const API_URL = "http://localhost:5001/api/scores";

export const getLeaderboard = async (duration) => {
  const res = await fetch(`${API_URL}?duration=${duration}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch leaderboard");
  return data;
};

export const saveScore = async (scorePayload, token) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(scorePayload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to save score");
  return data;
};


export const getUserStats = async (token) => {
  const res = await fetch(`${API_URL}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch stats");
  return data;
};
