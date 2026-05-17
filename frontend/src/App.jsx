import React, { useState, useEffect, useRef } from "react";
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

  const { isAuthenticated, token } = useAuth();
  const hasSavedScore = useRef(false);

  const {
    state,
    words,
    timeLeft,
    typed,
    errors,
    restart,
    totalTyped,
    wpmHistory,
  } = UseEngine(
    mode === "time" ? selectedTime : selectedWordCount,
    mode,
    includePunctuation,
    includeNumbers,
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

  const CountdownTimer = ({ timeLeft }) => (
    <h2 className="text-yellow-400 font-semibold text-xl mb-4">
      Time: {timeLeft}
    </h2>
  );

  const WordsCountDisplay = ({ wordsTyped, totalWords }) => (
    <h2 className="text-yellow-400 font-semibold text-xl mb-4">
      Words: {wordsTyped}/{totalWords}
    </h2>
  );

  const WordsContainer = ({ children }) => (
    <div className="relative w-full mt-3 leading-relaxed break-normal">
      {children}
    </div>
  );

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#0f1117" }}>
      <NavBar onNavigate={handleNavigate} currentPage={currentPage} />

      {currentPage === "leaderboard" ? (
        <div className="px-6 pb-6">
          <Leaderboard />
        </div>
      ) : currentPage === "profile" ? (
        <div className="px-6 pb-6">
          <Profile onNavigate={handleNavigate} />
        </div>
      ) : currentPage === "multiplayer" ? (
        <div className="px-6 pb-6">
          <MultiplayerArena />
        </div>
      ) : (
        <div className="w-full px-10">
          {state !== "finish" ? (
            <>
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
              />

              {mode === "time" ? (
                <CountdownTimer timeLeft={timeLeft} />
              ) : (
                <WordsCountDisplay
                  wordsTyped={wordsTyped}
                  totalWords={selectedWordCount}
                />
              )}

              <WordsContainer>
                <UserTypings
                  className="text-3xl"
                  words={words}
                  userInput={typed}
                />
              </WordsContainer>

              <RestartButton
                className="mx-auto mt-10 text-slate-500"
                onRestart={handleRestart}
              />
            </>
          ) : (
            <TypingChart
              wpmData={wpmHistory}
              errors={errors}
              totalTyped={totalTyped}
              accuracy={parseFloat(formattedAccuracy)}
              onRestart={handleRestart}
              mode={mode}
              selectedTime={selectedTime}
              selectedWordCount={selectedWordCount}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
