import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/coach`;

// Request AI coaching tips for a finished test. Throws on failure.
export const getCoaching = async (stats) => {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stats),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI coaching unavailable");
  return data.tips;
};
