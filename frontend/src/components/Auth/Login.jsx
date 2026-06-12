import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  loginUser,
  forgotPassword,
  resetPassword,
} from "../../services/auth.api";

const inputClass =
  "p-2.5 rounded-lg bg-surface-2 border border-border text-text placeholder-sub-alt focus:outline-none focus:ring-2 focus:ring-accent/40";

const primaryBtn =
  "rounded-lg bg-accent py-2 font-semibold text-[#0e1116] transition hover:bg-accent-soft disabled:opacity-50";

const Login = () => {
  const { login } = useAuth();
  // "login" | "forgot" (request code) | "reset" (enter code + new password)
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setError("");
    setInfo("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await forgotPassword(email);
      setInfo(`If ${email} is registered, a reset code has been sent.`);
      setView("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const data = await resetPassword(email, otp, newPassword);
      login(data); // auto-login with the new password
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot: request a code ── */
  if (view === "forgot") {
    return (
      <form onSubmit={handleForgot} className="flex flex-col gap-4">
        <p className="text-center text-sm text-sub-alt">
          Enter your email and we'll send a reset code.
        </p>
        {error && (
          <div className="text-center text-sm text-red-400">{error}</div>
        )}

        <input
          type="email"
          placeholder="Email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />

        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? "Sending…" : "Send Reset Code"}
        </button>

        <button
          type="button"
          onClick={() => {
            setView("login");
            reset();
          }}
          className="text-xs text-sub-alt hover:text-text"
        >
          ← Back to login
        </button>
      </form>
    );
  }

  /* ── Reset: enter code + new password ── */
  if (view === "reset") {
    return (
      <form onSubmit={handleReset} className="flex flex-col gap-4">
        {info && (
          <div className="text-center text-sm text-sub-alt">{info}</div>
        )}
        {error && (
          <div className="text-center text-sm text-red-400">{error}</div>
        )}

        <input
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit code"
          className={`${inputClass} text-center font-mono text-lg tracking-[0.5em]`}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          autoFocus
          required
        />

        <input
          type="password"
          placeholder="New password (min 6 chars)"
          className={inputClass}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className={primaryBtn}
        >
          {loading ? "Resetting…" : "Reset Password & Log In"}
        </button>

        <div className="flex justify-between text-xs text-sub-alt">
          <button
            type="button"
            onClick={() => {
              setView("forgot");
              setOtp("");
              reset();
            }}
            className="hover:text-text"
          >
            ← Resend code
          </button>
          <button
            type="button"
            onClick={() => {
              setView("login");
              reset();
            }}
            className="hover:text-text"
          >
            Back to login
          </button>
        </div>
      </form>
    );
  }

  /* ── Login ── */
  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      {error && (
        <div className="text-center text-sm text-red-400">{error}</div>
      )}

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
        placeholder="Password"
        className={inputClass}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={loading} className={primaryBtn}>
        {loading ? "Logging in…" : "Login"}
      </button>

      <button
        type="button"
        onClick={() => {
          setView("forgot");
          reset();
        }}
        className="text-center text-xs text-sub-alt transition hover:text-accent"
      >
        Forgot password?
      </button>
    </form>
  );
};

export default Login;
