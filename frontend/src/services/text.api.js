import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/text`;

// Request an AI-generated typing passage. Throws on failure so the caller
// can fall back to local word generation.
export const generateText = async (opts) => {
  const res = await fetch(`${API_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI text unavailable");
  return data.text;
};
