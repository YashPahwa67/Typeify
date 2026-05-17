import React, { useRef } from "react";
import { MdRefresh } from "react-icons/md";

const RestartButton = ({ onRestart, className = "" }) => {
  const buttonRef = useRef(null); // reference to the button element

  const handleClick = () => {
    // Remove focus from the button after clicking
    if (buttonRef.current) buttonRef.current.blur();

    // Call the restart function passed from the parent
    onRestart();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`block rounded px-8 py-2 hover:bg-slate-700/50 ${className}`}
    >
      <MdRefresh className="w-6 h-6" />
    </button>
  );
};

export default RestartButton;
