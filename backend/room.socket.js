// backend/room.socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker"; // same library you already use
import { generateTypingText } from "./utils/ai.js";

const rooms = new Map();

// ── Same logic as your UseWords generatedWords() function ─────
function generateWords(
  count,
  includePunctuation = false,
  includeNumbers = false,
) {
  let words = faker.word.words(count).toLowerCase();

  if (includePunctuation) {
    const punctuation = [",", ".", "!", "?", ";", ":"];
    const wordsArray = words.split(" ");
    const wordsWithPunctuation = wordsArray.map((word, index) => {
      if (index > 0 && index % 3 === 0 && Math.random() > 0.5) {
        const randomPunct =
          punctuation[Math.floor(Math.random() * punctuation.length)];
        return word + randomPunct;
      }
      return word;
    });
    words = wordsWithPunctuation.join(" ");
  }

  if (includeNumbers) {
    const wordsArray = words.split(" ");
    const wordsWithNumbers = wordsArray.map((word, index) => {
      if (index > 0 && index % 4 === 0 && Math.random() > 0.6) {
        return Math.floor(Math.random() * 1000).toString();
      }
      return word;
    });
    words = wordsWithNumbers.join(" ");
  }

  return words;
}

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function serializeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    mode: room.mode,
    value: room.value,
    includePunctuation: room.includePunctuation,
    includeNumbers: room.includeNumbers,
    aiEnabled: room.aiEnabled,
    aiDifficulty: room.aiDifficulty,
    status: room.status,
    words: room.status === "running" ? room.words : null, // hidden until race starts
    players: Array.from(room.players.entries()).map(([id, p]) => ({
      id,
      ...p,
    })),
  };
}

function buildResults(room) {
  const players = Array.from(room.players.entries())
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      return b.wpm - a.wpm;
    });
  return { code: room.code, players, winner: players[0] || null };
}

function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("AUTH_REQUIRED"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    socket.data.username = decoded.username || "Player";
    next();
  } catch {
    next(new Error("AUTH_INVALID"));
  }
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { userId, username } = socket.data;

    // ── CREATE ROOM ─────────────────────────────────────────
    socket.on(
      "create-room",
      ({
        mode,
        value,
        includePunctuation,
        includeNumbers,
        aiEnabled,
        aiDifficulty,
      }) => {
        const code = makeCode();

        const room = {
          code,
          hostId: socket.id,
          mode: mode || "words",
          value: value || 25,
          includePunctuation: includePunctuation || false,
          includeNumbers: includeNumbers || false,
          aiEnabled: aiEnabled || false,
          aiDifficulty: ["easy", "medium", "hard"].includes(aiDifficulty)
            ? aiDifficulty
            : "medium",
          words: "",
          status: "waiting",
          startedAt: null,
          players: new Map(),
        };

        room.players.set(socket.id, {
          userId,
          username,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
          finishTime: null,
        });

        rooms.set(code, room);
        socket.join(code);
        socket.data.roomCode = code;

        socket.emit("room-created", serializeRoom(room));
      },
    );

    // ── JOIN ROOM ───────────────────────────────────────────
    socket.on("join-room", ({ code }) => {
      const room = rooms.get(code?.toUpperCase());

      if (!room) {
        socket.emit("room-error", { message: "Room not found" });
        return;
      }
      if (room.status !== "waiting") {
        socket.emit("room-error", { message: "Race already in progress" });
        return;
      }

      room.players.set(socket.id, {
        userId,
        username,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        finishTime: null,
      });

      socket.join(room.code);
      socket.data.roomCode = room.code;

      io.to(room.code).emit("room-updated", serializeRoom(room));
    });

    // ── START RACE (host only) ──────────────────────────────
    socket.on("start-race", async () => {
      const room = rooms.get(socket.data.roomCode);
      if (!room) return;
      if (room.hostId !== socket.id) {
        socket.emit("room-error", { message: "Only the host can start" });
        return;
      }
      if (room.status !== "waiting") return;

      // Generate words ONCE on the server — same string sent to all players
      const wordCount = room.mode === "words" ? room.value : 60;

      if (room.aiEnabled) {
        try {
          room.words = await generateTypingText({
            count: wordCount,
            difficulty: room.aiDifficulty,
            includePunctuation: room.includePunctuation,
            includeNumbers: room.includeNumbers,
          });
        } catch (err) {
          // Gracefully fall back to local word generation if AI is unavailable.
          console.error("Room AI text failed, using faker:", err.message);
          room.words = generateWords(
            wordCount,
            room.includePunctuation,
            room.includeNumbers,
          );
        }
      } else {
        room.words = generateWords(
          wordCount,
          room.includePunctuation,
          room.includeNumbers,
        );
      }

      // Room may have been torn down while awaiting AI generation.
      if (!rooms.has(room.code)) return;
      room.status = "running";
      room.startedAt = Date.now();

      room.players.forEach((p) => {
        p.progress = 0;
        p.wpm = 0;
        p.accuracy = 100;
        p.finished = false;
        p.finishTime = null;
      });

      // All players receive the exact same words string here
      io.to(room.code).emit("race-started", serializeRoom(room));

      // Time mode: server auto-ends the race
      if (room.mode === "time") {
        setTimeout(() => {
          const r = rooms.get(room.code);
          if (r && r.status === "running") {
            r.status = "finished";
            io.to(r.code).emit("race-over", buildResults(r));
          }
        }, room.value * 1000);
      }
    });

    // ── TYPING PROGRESS ─────────────────────────────────────
    socket.on("typing-progress", ({ progress, wpm, accuracy }) => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || room.status !== "running") return;

      const player = room.players.get(socket.id);
      if (!player || player.finished) return;

      player.progress = Math.min(100, progress);
      player.wpm = Math.max(0, wpm || 0);
      player.accuracy = accuracy ?? 100;

      io.to(room.code).emit("progress-update", {
        playerId: socket.id,
        progress: player.progress,
        wpm: player.wpm,
        accuracy: player.accuracy,
      });

      // Words mode: player finished when progress hits 100
      if (room.mode === "words" && player.progress >= 100) {
        player.finished = true;
        player.finishTime = Date.now() - room.startedAt;

        io.to(room.code).emit("player-finished", {
          playerId: socket.id,
          username: player.username,
          wpm: player.wpm,
          accuracy: player.accuracy,
        });

        const allDone = [...room.players.values()].every((p) => p.finished);
        if (allDone) {
          room.status = "finished";
          io.to(room.code).emit("race-over", buildResults(room));
        }
      }
    });

    // ── LEAVE / DISCONNECT ──────────────────────────────────
    const removeFromRoom = () => {
      const code = socket.data.roomCode;
      if (!code) return;
      const room = rooms.get(code);
      if (!room) return;

      room.players.delete(socket.id);
      socket.leave(code);
      socket.data.roomCode = null;

      if (room.players.size === 0) {
        rooms.delete(code);
        return;
      }

      if (room.hostId === socket.id) {
        room.hostId = room.players.keys().next().value;
      }

      // If the leaver was the last person still racing, end the race.
      if (
        room.status === "running" &&
        [...room.players.values()].every((p) => p.finished)
      ) {
        room.status = "finished";
        io.to(room.code).emit("race-over", buildResults(room));
        return;
      }

      io.to(code).emit("room-updated", serializeRoom(room));
    };

    socket.on("leave-room", removeFromRoom);
    socket.on("disconnect", removeFromRoom);
  });
}
