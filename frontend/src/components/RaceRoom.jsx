import React, { useState, useEffect, useRef } from "react";
import UserTypings from "./UserTypings";

const RaceRoom = ({
  socket,
  room,
  screen,
  results,
  players,
  setPlayers,
  onLeave,
}) => {
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(room?.value || 30);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  // Dedupe a backspace that may arrive via both keydown and beforeinput.
  const lastKeydownDeleteRef = useRef(0);
  const lastInputDeleteRef = useRef(0);
  const myId = socket?.id;

  const focusInput = () => inputRef.current?.focus();

  // Start timer when race begins
  useEffect(() => {
    if (screen === "race" && room?.mode === "time") {
      let t = room.value;
      setTimeLeft(t);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        t -= 1;
        setTimeLeft(t);
        if (t <= 0) clearInterval(timerRef.current);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen]);

  // Reset typed when race starts
  useEffect(() => {
    if (screen === "race") setTyped("");
  }, [screen]);

  // Primary capture: `beforeinput` on the focused hidden input. This works
  // reliably across desktop AND mobile keyboards (focusing the input also
  // summons the on-screen keyboard on mobile, unlike a window keydown listener).
  useEffect(() => {
    if (screen !== "race") return;
    const el = inputRef.current;
    if (!el) return;

    const handleBeforeInput = (e) => {
      const { inputType, data } = e;
      if (
        inputType === "insertText" ||
        inputType === "insertCompositionText" ||
        inputType === "insertFromPaste"
      ) {
        if (data) {
          let next = "";
          for (const ch of data) {
            if (ch === "\n" || ch === "\r") continue;
            next += ch;
          }
          if (next) setTyped((prev) => prev + next);
        }
      } else if (
        inputType === "deleteContentBackward" ||
        inputType === "deleteWordBackward"
      ) {
        if (Date.now() - lastKeydownDeleteRef.current > 60) {
          lastInputDeleteRef.current = Date.now();
          setTyped((prev) => prev.slice(0, -1));
        }
      }
      if (e.cancelable) e.preventDefault();
    };

    el.addEventListener("beforeinput", handleBeforeInput);
    return () => el.removeEventListener("beforeinput", handleBeforeInput);
  }, [screen]);

  // Backspace fires reliably via keydown on every platform (mobile virtual
  // keyboards often don't emit a `beforeinput` delete on an empty input).
  useEffect(() => {
    if (screen !== "race") return;

    const handleKey = ({ key }) => {
      if (key !== "Backspace") return;
      if (Date.now() - lastInputDeleteRef.current > 60) {
        lastKeydownDeleteRef.current = Date.now();
        setTyped((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [screen]);

  // Keep the hidden input focused so the mobile keyboard stays open.
  useEffect(() => {
    if (screen === "race") focusInput();
  }, [screen]);

  // Emit progress on every keystroke
  useEffect(() => {
    if (screen !== "race" || !room?.words) return;

    const words = room.words;
    const progress = Math.min(
      100,
      Math.round((typed.length / words.length) * 100),
    );

    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === words[i]) correct++;
    }

    const accuracy =
      typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
    const elapsedMin =
      room.mode === "time"
        ? Math.max((room.value - timeLeft) / 60, 1 / 60)
        : Math.max(typed.length / 5 / 60, 1 / 60);
    const wpm = Math.round(correct / 5 / elapsedMin);

    socket?.emit("typing-progress", { progress, wpm, accuracy });

    // Update own bar instantly without waiting for server echo
    setPlayers((prev) => {
      const updated = new Map(prev);
      const me = updated.get(myId);
      if (me) updated.set(myId, { ...me, progress, wpm, accuracy });
      return updated;
    });
  }, [typed]);

  // ── RESULTS ───────────────────────────────────────────────
  if (screen === "results" && results) {
    const sorted = [...results.players].sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      return b.wpm - a.wpm;
    });

    return (
      <div className="py-10 max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-yellow-400 text-3xl font-bold font-mono">
            {results.winner?.username} wins!
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {results.winner?.wpm} WPM · {results.winner?.accuracy}% ACC
          </p>
        </div>

        <div
          className="rounded-xl p-6 mb-6"
          style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
        >
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 mb-4 last:mb-0">
              <div className="text-gray-500 font-mono w-5 text-right text-sm">
                {i + 1}
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: avatarColor(p.username) }}
              >
                {p.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">
                  {p.username}
                </div>
                <div className="text-green-400 text-xs">
                  {p.wpm} WPM · {p.accuracy}% ACC
                </div>
              </div>
              {i === 0 && <span className="text-yellow-400 text-xl">👑</span>}
            </div>
          ))}
        </div>

        <button
          onClick={onLeave}
          className="w-full py-3 rounded-lg font-semibold text-black transition-all active:scale-95"
          style={{ backgroundColor: "#2ea043" }}
        >
          Back to Arena
        </button>
      </div>
    );
  }

  // ── RACE ──────────────────────────────────────────────────
  if (screen === "race") {
    const sortedPlayers = [...players.values()].sort(
      (a, b) => b.progress - a.progress,
    );

    return (
      <div className="py-6">
        <div
          className="rounded-xl p-5 mb-6"
          style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
        >
          {sortedPlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-3 mb-4 last:mb-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: avatarColor(p.username) }}
              >
                {p.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-white text-sm">{p.username}</span>
                  <span className="text-green-400 text-xs font-mono">
                    {p.wpm} WPM · {p.accuracy}% ACC
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full"
                  style={{ backgroundColor: "#30363d" }}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${p.progress}%`,
                      backgroundColor: p.id === myId ? "#2ea043" : "#1d6fa4",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          {room?.mode === "time" ? (
            <h2 className="text-yellow-400 font-semibold text-xl">
              Time: {timeLeft}
            </h2>
          ) : (
            <span />
          )}
          <button
            onClick={onLeave}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: "#b91c1c" }}
          >
            ⤶ Leave Room
          </button>
        </div>

        <div
          onClick={focusInput}
          className="relative rounded-xl p-5 cursor-text"
          style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
        >
          {/* Hidden input — focusing it opens the mobile keyboard and
              captures typing via beforeinput. */}
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Typing input"
            value=""
            onChange={() => {}}
            className="absolute inset-0 z-20 h-full w-full cursor-text opacity-0"
            style={{ caretColor: "transparent" }}
          />
          <UserTypings
            words={room?.words || ""}
            userInput={typed}
            className="text-2xl leading-relaxed"
          />
        </div>
      </div>
    );
  }

  // ── WAITING ROOM ──────────────────────────────────────────
  const playerList = [...players.values()];
  const isHost = room?.hostId === myId;

  return (
    <div className="py-10 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-white font-bold text-xl font-mono">
            {room?.mode === "time"
              ? `Room | ${room?.value}s`
              : `Room | ${room?.value} words`}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-500 text-sm"># Room Code:</span>
            <span className="text-gray-300 font-mono tracking-widest text-sm">
              {room?.code}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(room?.code || "")}
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              📋
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isHost ? (
            <button
              onClick={() => socket?.emit("start-race")}
              className="px-6 py-2 rounded-lg font-semibold text-black transition-all active:scale-95"
              style={{ backgroundColor: "#2ea043" }}
            >
              ▶ Start Race
            </button>
          ) : (
            <p className="text-gray-500 text-sm">Waiting for host to start…</p>
          )}
          <button
            onClick={onLeave}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: "#b91c1c" }}
          >
            ⤶ Leave
          </button>
        </div>
      </div>

      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-400">👥</span> Typists ({playerList.length}
          )
        </h3>
        <div className="space-y-4">
          {playerList.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: avatarColor(p.username) }}
              >
                {p.username[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-white text-sm font-medium">
                  {p.username}
                </div>
                {p.id === room?.hostId && (
                  <div className="text-green-400 text-xs">Host</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AVATAR_COLORS = [
  "#e05c5c",
  "#e08a5c",
  "#a3e05c",
  "#5ce09e",
  "#5cb8e0",
  "#8a5ce0",
  "#e05ca3",
];
function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default RaceRoom;
