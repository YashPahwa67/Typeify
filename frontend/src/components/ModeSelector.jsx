import React from "react";

const ModeSelector = ({
  onPunctuationChange,
  onNumbersChange,
  onTimeChange,
  onWordCountChange,
  onModeChange,
  selectedTime,
  selectedWordCount,
  isPunctuationEnabled,
  isNumbersEnabled,
  mode,
}) => {
  return (
    <div className="flex flex-col gap-6 mb-8 py-4">
      {/* Mode Type Selector */}
      <div className="flex gap-6 items-center justify-center flex-wrap">
        <button
          className={`flex items-center gap-2 bg-transparent border-none cursor-pointer text-base px-3 py-2 transition-all duration-200 font-normal ${
            isPunctuationEnabled
              ? "text-yellow-500"
              : "text-gray-500 opacity-50 hover:text-gray-400"
          }`}
          onClick={() => {
            console.log("Punctuation button clicked");
            onPunctuationChange(!isPunctuationEnabled);
          }}
          title="punctuation"
        >
          <span className="text-xl flex items-center">@</span>
          <span className="text-base">punctuation</span>
        </button>

        <button
          className={`flex items-center gap-2 bg-transparent border-none cursor-pointer text-base px-3 py-2 transition-all duration-200 font-normal ${
            isNumbersEnabled
              ? "text-yellow-500"
              : "text-gray-500 opacity-50 hover:text-gray-400"
          }`}
          onClick={() => {
            console.log("Numbers button clicked");
            onNumbersChange(!isNumbersEnabled);
          }}
          title="numbers"
        >
          <span className="text-xl flex items-center">#</span>
          <span className="text-base">numbers</span>
        </button>

        <button
          className={`flex items-center gap-2 bg-transparent border-none cursor-pointer text-base px-3 py-2 transition-all duration-200 font-normal ${
            mode === "time"
              ? "text-yellow-500"
              : "text-gray-500 hover:text-gray-400"
          }`}
          onClick={() => {
            console.log("Time mode button clicked");
            onModeChange("time");
          }}
          title="time"
        >
          <span className="text-xl flex items-center">🕐</span>
          <span className="text-base">time</span>
        </button>

        <button
          className={`flex items-center gap-2 bg-transparent border-none cursor-pointer text-base px-3 py-2 transition-all duration-200 font-normal ${
            mode === "words"
              ? "text-yellow-500"
              : "text-gray-500 hover:text-gray-400"
          }`}
          onClick={() => {
            console.log("Words mode button clicked");
            onModeChange("words");
          }}
          title="words"
        >
          <span className="text-xl flex items-center">A</span>
          <span className="text-base">words</span>
        </button>
      </div>

      {/* Time Selector - Show when in time mode */}
      {mode === "time" && (
        <div className="flex gap-4 items-center justify-center">
          {[15, 30, 60, 120].map((time) => (
            <button
              key={time}
              className={`bg-transparent border-none cursor-pointer text-xl px-4 py-2 transition-all duration-200 font-medium min-w-[50px] ${
                selectedTime === time
                  ? "text-yellow-500 font-semibold"
                  : "text-gray-500 hover:text-gray-400"
              }`}
              onClick={() => {
                console.log("Time option clicked:", time);
                onTimeChange(time);
              }}
            >
              {time}
            </button>
          ))}
        </div>
      )}

      {/* Word Count Selector - Show when in words mode */}
      {mode === "words" && (
        <div className="flex gap-4 items-center justify-center">
          {[10, 25, 50, 100].map((wordCount) => (
            <button
              key={wordCount}
              className={`bg-transparent border-none cursor-pointer text-xl px-4 py-2 transition-all duration-200 font-medium min-w-[50px] ${
                selectedWordCount === wordCount
                  ? "text-yellow-500 font-semibold"
                  : "text-gray-500 hover:text-gray-400"
              }`}
              onClick={() => {
                console.log("Word count option clicked:", wordCount);
                onWordCountChange(wordCount);
              }}
            >
              {wordCount}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeSelector;
