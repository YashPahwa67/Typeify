import { useCallback, useEffect, useState } from "react";
import { isKeyboardCodeAllowed } from "../utilty/helper";

const UseTyping = (enabled) => {
  const [cursor, setCursor] = useState(0);
  const [typed, setTyped] = useState("");
  // FIX: Changed from useRef to useState so updates trigger re-renders
  const [totalTyped, setTotalTyped] = useState(0);

  const keydownHandler = useCallback(
    ({ key, code }) => {
      if (!enabled || !isKeyboardCodeAllowed(code)) return;

      if (key === "Backspace") {
        setTyped((prev) => prev.slice(0, -1));
        setCursor((c) => Math.max(c - 1, 0));
        setTotalTyped((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (key.length === 1) {
        setTyped((prev) => prev + key);
        setCursor((c) => c + 1);
        setTotalTyped((prev) => prev + 1);
      }
    },
    [enabled]
  );

  const clearTyped = useCallback(() => {
    setTyped("");
    setCursor(0);
  }, []);

  const resetTotalTyped = useCallback(() => {
    setTotalTyped(0);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", keydownHandler);
    return () => window.removeEventListener("keydown", keydownHandler);
  }, [keydownHandler]);

  return {
    typed,
    cursor,
    clearTyped,
    resetTotalTyped,
    totalTyped,
  };
};

export default UseTyping;