import express from "express";
import { generateCoaching } from "../utils/ai.js";

const router = express.Router();

// POST /api/coach/analyze — AI coaching tips for a finished test
router.post("/analyze", async (req, res) => {
  try {
    const tips = await generateCoaching(req.body || {});
    res.json({ tips });
  } catch (err) {
    console.error("AI coaching failed:", err.message);
    res.status(503).json({ error: "AI coaching unavailable" });
  }
});

export default router;
