import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import { motion } from "framer-motion";

const UserTypings = ({ userInput, words, className = "" }) => {
  const charRefs = useRef([]);
  const containerRef = useRef(null);
  const [caretPos, setCaretPos] = useState(null);

  const typed = userInput.split("");
  const allChars = words.split("");

  const measureCaret = () => {
    const index = typed.length;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    if (index === 0) {
      const first = charRefs.current[0];
      if (first) {
        const r = first.getBoundingClientRect();
        setCaretPos({
          left: r.left - containerRect.left,
          top: r.top - containerRect.top,
          height: r.height,
        });
      }
      return;
    }

    const prev = charRefs.current[index - 1];
    if (prev) {
      const r = prev.getBoundingClientRect();
      setCaretPos({
        left: r.right - containerRect.left,
        top: r.top - containerRect.top,
        height: r.height,
      });
    }
  };

  useLayoutEffect(() => {
    measureCaret();
  }, [typed.length, words]);

  useEffect(() => {
    window.addEventListener("resize", measureCaret);
    return () => window.removeEventListener("resize", measureCaret);
  }, [typed.length]);

  return (
    <div
      ref={containerRef}
      className={`relative font-mono tracking-tight ${className}`}
    >
      {allChars.map((char, index) => {
        const typedChar = typed[index];
        const isTyped = typedChar !== undefined;
        const isCorrect = typedChar === char;
        const isWrongSpace = char === " " && isTyped && !isCorrect;

        let color = "var(--color-sub)";
        if (isTyped && isCorrect) color = "var(--color-accent-soft)";
        if (isTyped && !isCorrect && char !== " ") color = "var(--color-error)";

        return (
          <span
            key={index}
            ref={(el) => (charRefs.current[index] = el)}
            style={{
              color,
              backgroundColor: isWrongSpace
                ? "rgba(239,68,68,0.4)"
                : "transparent",
            }}
          >
            {char}
          </span>
        );
      })}

      {/* OUTER div — handles smooth position (spring) */}
      {caretPos && (
        <motion.div
          animate={{
            left: caretPos.left,
            top: caretPos.top,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 38,
            mass: 0.3,
          }}
          style={{
            position: "absolute",
            left: caretPos.left,
            top: caretPos.top,
            width: "2px",
            height: caretPos.height,
            pointerEvents: "none",
          }}
        >
          {/* INNER div — handles blink only, no position */}
          <motion.div
            animate={{ opacity: [1, 1, 0, 0, 1] }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "linear",
              times: [0, 0.4, 0.5, 0.9, 1],
            }}
            style={{
              width: "2px",
              height: "100%",
              backgroundColor: "#facc15",
              borderRadius: "2px",
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default UserTypings;
