import express from "express";
import Score from "../models/Score.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

// Save score after test
router.post("/", auth, async (req, res) => {
  try {
    const { wpm, accuracy, raw, consistency, duration, mode } = req.body;

    // words mode has no duration so don't pass it if null
    const scoreData = {
      userId: req.user._id,
      wpm,
      accuracy,
      raw,
      consistency,
      mode,
      ...(duration !== null && { duration }),
    };

    const score = await Score.create(scoreData);
    res.json(score);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save score" });
  }
});

// Get leaderboard by duration
router.get("/", async (req, res) => {
  try {
    const duration = Number(req.query.duration);

    if (![15, 30, 60, 120].includes(duration)) {
      return res.status(400).json({ error: "Invalid duration" });
    }

    // Group by userId, keep only their best WPM score
    const leaderboard = await Score.aggregate([
      { $match: { duration } },
      { $sort: { wpm: -1 } },
      {
        $group: {
          _id: "$userId",
          bestScore: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$bestScore" } },
      { $sort: { wpm: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      { $unwind: "$userId" },
      {
        $project: {
          wpm: 1,
          accuracy: 1,
          createdAt: 1,
          "userId._id": 1,
          "userId.username": 1,
        },
      },
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});


// Get profile stats for logged in user
router.get("/stats", auth, async (req, res) => {
  try {
    const scores = await Score.find({ userId: req.user._id });

    if (scores.length === 0) {
      return res.json({
        testsCompleted: 0,
        bestWpm: 0,
        avgWpm: 0,
        avgAccuracy: 0,
      });
    }

    const testsCompleted = scores.length;
    const bestWpm = Math.max(...scores.map((s) => s.wpm));
    const avgWpm = Math.round(
      scores.reduce((sum, s) => sum + s.wpm, 0) / scores.length
    );
    const avgAccuracy = (
      scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length
    ).toFixed(1);

    res.json({ testsCompleted, bestWpm, avgWpm, avgAccuracy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
