import express from "express";
import { generateTypingText } from "../utils/ai.js";

const router = express.Router();

// POST /api/text/generate — AI-generated typing passage
router.post("/generate", async (req, res) => {
  try {
    const text = await generateTypingText(req.body || {});
    res.json({ text });
  } catch (err) {
    console.error("AI text generation failed:", err.message);
    // 503 so the frontend can gracefully fall back to local word generation.
    res.status(503).json({ error: "AI text generation unavailable" });
  }
});

export default router;
