import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/auth`;

// Step 1 of signup — send a verification code to the user's email.
export const requestSignupOtp = async (username, email, password) => {
  const res = await fetch(`${API_URL}/signup/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not send code");
  return data;
};

// Step 2 of signup — verify the code; returns { token, username } on success.
export const verifySignupOtp = async (email, otp) => {
  const res = await fetch(`${API_URL}/signup/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Verification failed");
  return data;
};

// Forgot password — step 1: request a reset code by email.
export const forgotPassword = async (email) => {
  const res = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not send reset code");
  return data;
};

// Forgot password — step 2: verify code + set a new password (returns token).
export const resetPassword = async (email, otp, password) => {
  const res = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not reset password");
  return data;
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
};
