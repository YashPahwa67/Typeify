import React , { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Login from "./Login";
import Signup from "./Signup";

const AuthModal = () => {
  const { showAuthModal, setShowAuthModal } = useAuth();
  const [mode, setMode] = useState("login");

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1f2937] rounded-xl p-6 w-[360px] relative">
        {/* Close */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-3 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        {/* Tabs */}
        <div className="flex justify-center gap-6 mb-6">
          <button
            className={`${
              mode === "login" ? "text-yellow-400" : "text-gray-400"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={`${
              mode === "signup" ? "text-yellow-400" : "text-gray-400"
            }`}
            onClick={() => setMode("signup")}
          >
            Signup
          </button>
        </div>

        {mode === "login" ? <Login /> : <Signup />}
      </div>
    </div>
  );
};

export default AuthModal;
