import React, { useState, useEffect, useRef, useMemo } from "react";
import "./App.css";

import RestartButton from "./components/RestartButton";
import TypingChart from "./components/TypingChart";
import ModeSelector from "./components/ModeSelector";
import UserTypings from "./components/UserTypings";
import NavBar from "./components/NavBar";
import Leaderboard from "./components/Leaderboard";
import Profile from "./components/Profile";
import MultiplayerArena from "./components/MultiplayerArena"; // ADD

import UseEngine from "../hooks/UseEngine";
import { calculateAccuracyPercentage } from "../utilty/helper";
import { useAuth } from "./context/AuthContext";
import { saveScore } from "./services/score.api";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedTime, setSelectedTime] = useState(30);
  const [selectedWordCount, setSelectedWordCount] = useState(25);
  const [mode, setMode] = useState("time");
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("medium");

  const { isAuthenticated, token } = useAuth();
  const hasSavedScore = useRef(false);

  const ai = useMemo(
    () => ({ enabled: aiEnabled, topic: aiTopic, difficulty: aiDifficulty }),
    [aiEnabled, aiTopic, aiDifficulty],
  );

  const {
    state,
    words,
    timeLeft,
    typed,
    errors,
    restart,
    totalTyped,
    wpmHistory,
    loading,
  } = UseEngine(
    mode === "time" ? selectedTime : selectedWordCount,
    mode,
    includePunctuation,
    includeNumbers,
    ai,
  );

  const wordsTyped = typed
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const accuracyPercentage = calculateAccuracyPercentage(errors, totalTyped);
  const formattedAccuracy = accuracyPercentage.toFixed(2);

  const finalWpm =
    wpmHistory.length > 0 ? wpmHistory[wpmHistory.length - 1].wpm : 0;

  const consistency = (() => {
    if (wpmHistory.length < 2) return 100;
    const wpms = wpmHistory.map((d) => d.wpm);
    const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    if (!avg) return 100;
    const variance =
      wpms.reduce((s, w) => s + Math.pow(w - avg, 2), 0) / wpms.length;
    return Math.round(100 - (Math.sqrt(variance) / avg) * 100);
  })();

  // Auto-save score when test finishes
  useEffect(() => {
    if (state === "finish" && isAuthenticated && !hasSavedScore.current) {
      hasSavedScore.current = true;

      const scorePayload = {
        wpm: Math.round(finalWpm),
        accuracy: Number(formattedAccuracy),
        raw: totalTyped,
        consistency,
        duration: mode === "time" ? selectedTime : null,
        mode,
        language: "english",
      };

      saveScore(scorePayload, token)
        .then(() => console.log("Score saved ✅"))
        .catch((err) => console.error("Score save failed:", err));
    }
  }, [state, isAuthenticated]);

  const handleRestart = () => {
    hasSavedScore.current = false;
    restart();
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page === "home") {
      hasSavedScore.current = false;
      restart();
    }
  };

  const isRunning = state === "run";

  const LiveCounter = () =>
    mode === "time" ? (
      <div className="flex items-baseline gap-2 font-mono">
        <span className="text-4xl font-semibold tabular-nums text-accent">
          {timeLeft}
        </span>
        <span className="text-sm uppercase tracking-widest text-sub">
          seconds
        </span>
      </div>
    ) : (
      <div className="flex items-baseline gap-2 font-mono">
        <span className="text-4xl font-semibold tabular-nums text-accent">
          {wordsTyped}
          <span className="text-sub">/{selectedWordCount}</span>
        </span>
        <span className="text-sm uppercase tracking-widest text-sub">words</span>
      </div>
    );

  return (
    <div className="min-h-screen w-full">
      <NavBar onNavigate={handleNavigate} currentPage={currentPage} />

      {currentPage === "leaderboard" ? (
        <div className="view-enter mx-auto max-w-7xl px-6 pb-6">
          <Leaderboard />
        </div>
      ) : currentPage === "profile" ? (
        <div className="view-enter mx-auto max-w-7xl px-6 pb-6">
          <Profile onNavigate={handleNavigate} />
        </div>
      ) : currentPage === "multiplayer" ? (
        <div className="view-enter mx-auto max-w-7xl px-6 pb-6">
          <MultiplayerArena />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl px-6">
          {state !== "finish" ? (
            <div className="flex min-h-[calc(100vh-200px)] flex-col justify-center">
              <ModeSelector
                onPunctuationChange={setIncludePunctuation}
                onNumbersChange={setIncludeNumbers}
                onTimeChange={setSelectedTime}
                onWordCountChange={setSelectedWordCount}
                onModeChange={setMode}
                selectedTime={selectedTime}
                selectedWordCount={selectedWordCount}
                isPunctuationEnabled={includePunctuation}
                isNumbersEnabled={includeNumbers}
                mode={mode}
                aiEnabled={aiEnabled}
                aiTopic={aiTopic}
                aiDifficulty={aiDifficulty}
                onAiToggle={setAiEnabled}
                onAiTopicChange={setAiTopic}
                onAiDifficultyChange={setAiDifficulty}
              />

              <div className="mb-5 h-10">
                <LiveCounter />
              </div>

              <div
                className={`relative w-full rounded-2xl px-2 leading-relaxed break-normal transition-all duration-300 ${
                  isRunning ? "" : "opacity-95"
                }`}
              >
                {loading && (
                  <div className="absolute inset-0 z-10 flex items-center gap-3 rounded-2xl bg-base/70 backdrop-blur-sm">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                    <span className="text-lg text-sub-alt">
                      generating with AI…
                    </span>
                  </div>
                )}
                <UserTypings
                  className="text-4xl"
                  words={words}
                  userInput={typed}
                />
              </div>

              <RestartButton
                className="mx-auto mt-12"
                onRestart={handleRestart}
              />
            </div>
          ) : (
            <div className="view-enter">
              <TypingChart
                wpmData={wpmHistory}
                errors={errors}
                totalTyped={totalTyped}
                accuracy={parseFloat(formattedAccuracy)}
                consistency={consistency}
                onRestart={handleRestart}
                mode={mode}
                selectedTime={selectedTime}
                selectedWordCount={selectedWordCount}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
