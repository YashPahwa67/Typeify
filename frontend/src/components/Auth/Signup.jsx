import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { requestSignupOtp, verifySignupOtp } from "../../services/auth.api";

const inputClass =
  "p-2.5 rounded-lg bg-surface-2 border border-border text-text placeholder-sub-alt focus:outline-none focus:ring-2 focus:ring-accent/40";

const Signup = () => {
  const { login } = useAuth();
  const [step, setStep] = useState("details"); // "details" | "otp"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await requestSignupOtp(username, email, password);
      setInfo(`We sent a 6-digit code to ${email}`);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await verifySignupOtp(email, otp);
      login(data); // auto-login on success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await requestSignupOtp(username, email, password);
      setInfo("A new code is on its way.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
        {info && (
          <div className="text-center text-sm text-sub-alt">{info}</div>
        )}
        {error && (
          <div className="text-center text-sm text-red-400">{error}</div>
        )}

        <input
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit code"
          className={`${inputClass} text-center tracking-[0.5em] font-mono text-lg`}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          autoFocus
          required
        />

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="rounded-lg bg-accent py-2 font-semibold text-[#0e1116] transition hover:bg-accent-soft disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify & Create Account"}
        </button>

        <div className="flex justify-between text-xs text-sub-alt">
          <button
            type="button"
            onClick={() => {
              setStep("details");
              setOtp("");
              setError("");
              setInfo("");
            }}
            className="hover:text-text"
          >
            ← Edit details
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="hover:text-accent disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
      {error && (
        <div className="text-center text-sm text-red-400">{error}</div>
      )}

      <input
        placeholder="Username"
        className={inputClass}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <input
        type="email"
        placeholder="Email"
        className={inputClass}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password (min 6 chars)"
        className={inputClass}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent py-2 font-semibold text-[#0e1116] transition hover:bg-accent-soft disabled:opacity-50"
      >
        {loading ? "Sending code…" : "Send Verification Code"}
      </button>
    </form>
  );
};

export default Signup;
