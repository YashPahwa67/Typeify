import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";
import PasswordReset from "../models/PasswordReset.js";
import { sendOtpEmail, sendResetEmail } from "../utils/mailer.js";

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

const issueToken = (user) =>
  jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

/* STEP 1 — request an OTP for a new signup */
router.post("/signup/request-otp", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const otp = generateOtp();
    const [passwordHash, otpHash] = await Promise.all([
      bcrypt.hash(password, 10),
      bcrypt.hash(otp, 10),
    ]);

    // Upsert: a re-request for the same email replaces the previous pending entry.
    await PendingUser.findOneAndUpdate(
      { email },
      {
        username,
        email,
        passwordHash,
        otpHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    try {
      await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error("Email send failed:", mailErr);
      return res.status(502).json({
        error:
          "Could not send verification email. Please check the email configuration and try again.",
      });
    }

    res.json({ message: "Verification code sent", email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not start signup" });
  }
});

/* STEP 2 — verify the OTP and create the account */
router.post("/signup/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      return res
        .status(400)
        .json({ error: "No pending signup found. Please sign up again." });
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res
        .status(400)
        .json({ error: "Code expired. Please request a new one." });
    }

    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res
        .status(429)
        .json({ error: "Too many attempts. Please sign up again." });
    }

    const isValid = await bcrypt.compare(String(otp), pending.otpHash);
    if (!isValid) {
      pending.attempts += 1;
      await pending.save();
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Guard against a race where the email got registered meanwhile.
    const existing = await User.findOne({ email });
    if (existing) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res.status(400).json({ error: "Email already exists" });
    }

    const user = await User.create({
      username: pending.username,
      email: pending.email,
      passwordHash: pending.passwordHash,
    });

    await PendingUser.deleteOne({ _id: pending._id });

    const token = issueToken(user);
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = issueToken(user);
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* FORGOT PASSWORD — step 1: email a reset code */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Only send a real code if the account exists, but always respond the
    // same way so we don't leak which emails are registered.
    if (user) {
      const otp = generateOtp();
      const otpHash = await bcrypt.hash(otp, 10);

      await PasswordReset.findOneAndUpdate(
        { email },
        {
          email,
          otpHash,
          attempts: 0,
          expiresAt: new Date(Date.now() + OTP_TTL_MS),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      try {
        await sendResetEmail(email, otp);
      } catch (mailErr) {
        console.error("Reset email failed:", mailErr);
        return res.status(502).json({
          error: "Could not send reset email. Please try again later.",
        });
      }
    }

    res.json({
      message: "If that email is registered, a reset code has been sent.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not process request" });
  }
});

/* FORGOT PASSWORD — step 2: verify code + set new password */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res
        .status(400)
        .json({ error: "Email, code and new password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const reset = await PasswordReset.findOne({ email });
    if (!reset) {
      return res
        .status(400)
        .json({ error: "No reset request found. Please start again." });
    }

    if (reset.expiresAt.getTime() < Date.now()) {
      await PasswordReset.deleteOne({ _id: reset._id });
      return res
        .status(400)
        .json({ error: "Code expired. Please request a new one." });
    }

    if (reset.attempts >= MAX_OTP_ATTEMPTS) {
      await PasswordReset.deleteOne({ _id: reset._id });
      return res
        .status(429)
        .json({ error: "Too many attempts. Please start again." });
    }

    const isValid = await bcrypt.compare(String(otp), reset.otpHash);
    if (!isValid) {
      reset.attempts += 1;
      await reset.save();
      return res.status(400).json({ error: "Invalid verification code" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await PasswordReset.deleteOne({ _id: reset._id });
      return res.status(400).json({ error: "Account no longer exists" });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    await PasswordReset.deleteOne({ _id: reset._id });

    const token = issueToken(user);
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not reset password" });
  }
});

export default router;
