import mongoose from "mongoose";

/**
 * Holds a signup that is awaiting email (OTP) verification.
 * The real User document is only created once the OTP is confirmed.
 * A TTL index on `expiresAt` lets MongoDB auto-delete stale entries.
 */
const pendingUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Auto-remove the document once expiresAt is reached.
pendingUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingUser", pendingUserSchema);
