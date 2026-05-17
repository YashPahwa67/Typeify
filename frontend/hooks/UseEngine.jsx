import { useCallback, useEffect, useState, useRef } from "react";
import UseWords from "./UseWords";
import UseCountdownTimer from "./UseCountdownTimer";
import UseTyping from "./UseTyping";
import { countErrors, calculateAccuracyPercentage } from "../utilty/helper";
import { useAuth } from "../src/context/AuthContext";

const useEngine = (
  selectedValue,
  mode,
  includePunctuation = false,
  includeNumbers = false,
) => {
  const { showAuthModal } = useAuth();
  const [state, setState] = useState("start");
  const [errors, setErrors] = useState(0);
  const [wpmHistory, setWpmHistory] = useState([]);

  const wordCount = mode === "words" ? selectedValue : 40;
  const initialTime = mode === "time" ? selectedValue : 30;

  const { words, updateWords, appendWords } = UseWords(
    wordCount,
    includePunctuation,
    includeNumbers,
  );

  const { timeLeft, startCountdown, resetCountdown } =
    UseCountdownTimer(initialTime);

  const { typed, cursor, clearTyped, resetTotalTyped, totalTyped } = UseTyping(
    state !== "finish" && !showAuthModal,
  );

  const correctCharsRef = useRef(0);
  const totalTypedRef = useRef(totalTyped);

  useEffect(() => {
    totalTypedRef.current = totalTyped;
  }, [totalTyped]);

  const isStarting = state === "start" && cursor > 0;
  const areWordsFinished = cursor >= words.length;

  // FIX: Append new words when user is close to the end (time mode only)
  useEffect(() => {
    if (mode === "time" && state === "run") {
      const charsLeft = words.length - cursor;
      if (charsLeft < 100) {
        appendWords();
      }
    }
  }, [cursor, words.length, mode, state, appendWords]);

  // Track errors and correct chars
  useEffect(() => {
    const wordsReached = words.substring(0, cursor);
    const currentErrors = countErrors(typed, wordsReached);
    setErrors(currentErrors);
    correctCharsRef.current = Math.max(0, totalTyped - currentErrors);
  }, [typed, words, cursor, totalTyped]);

  // WPM history
  useEffect(() => {
    if (state === "run" && mode === "time") {
      const timeElapsed = initialTime - timeLeft;

      if (timeElapsed > 0) {
        const netWpm = Math.max(
          0,
          Math.round(correctCharsRef.current / 5 / (timeElapsed / 60)),
        );

        setWpmHistory((prev) => {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && lastEntry.second === timeElapsed) return prev;
          return [...prev, { second: timeElapsed, wpm: netWpm }];
        });
      }
    }
  }, [timeLeft, state, mode, initialTime]);

  // Finish conditions
  useEffect(() => {
    if (state === "run") {
      if (mode === "time" && timeLeft === 0) setState("finish");
      if (mode === "words" && areWordsFinished) setState("finish");
    }
  }, [timeLeft, areWordsFinished, state, mode]);

  // Auto-start
  useEffect(() => {
    if (showAuthModal) return;
    if (isStarting) {
      setState("run");
      startCountdown();
    }
  }, [isStarting, startCountdown, showAuthModal]);

  const restart = useCallback(() => {
    resetCountdown();
    resetTotalTyped();
    setErrors(0);
    setState("start");
    setWpmHistory([]);
    correctCharsRef.current = 0;
    updateWords();
    clearTyped();
  }, [resetCountdown, resetTotalTyped, updateWords, clearTyped]);

  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue, mode, includePunctuation, includeNumbers]);

  const accuracy = calculateAccuracyPercentage(errors, totalTyped);

  return {
    state,
    words,
    timeLeft,
    typed,
    errors,
    totalTyped,
    restart,
    wpmHistory,
    accuracy,
  };
};

export default useEngine;
