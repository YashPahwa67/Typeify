import mongoose from "mongoose";

/**
 * Holds a pending password-reset request (OTP awaiting confirmation).
 * A TTL index on `expiresAt` lets MongoDB auto-delete stale entries.
 */
const passwordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PasswordReset", passwordResetSchema);
