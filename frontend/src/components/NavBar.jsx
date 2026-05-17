import React from "react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./Auth/AuthModal";

const NavBar = ({ onNavigate, currentPage }) => {
  const { isAuthenticated, setShowAuthModal } = useAuth();

  return (
    <>
      <nav className="w-full py-6 flex justify-between items-center px-8">
        <h1
          className="text-5xl font-extrabold text-yellow-400 cursor-pointer"
          style={{ fontFamily: "'Poppins', sans-serif" }}
          onClick={() => onNavigate("home")}
        >
          TYPEIFY
        </h1>

        <div className="flex items-center gap-5">
          <button
            onClick={() => onNavigate("leaderboard")}
            title="Leaderboard"
            className={`text-2xl transition-all duration-200 ${
              currentPage === "leaderboard"
                ? "text-yellow-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            🏆
          </button>

          {/* Multiplayer — only visible when logged in */}
          {isAuthenticated && (
            <button
              onClick={() => onNavigate("multiplayer")}
              title="Multiplayer"
              className={`text-2xl transition-all duration-200 ${
                currentPage === "multiplayer"
                  ? "text-yellow-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              ⚔️
            </button>
          )}

          {isAuthenticated ? (
            <button
              onClick={() => onNavigate("profile")}
              title="Profile"
              className={`text-2xl transition-all duration-200 ${
                currentPage === "profile"
                  ? "text-yellow-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              👤
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              title="Login"
              className="text-gray-500 text-2xl hover:text-gray-300 transition-all"
            >
              👤
            </button>
          )}
        </div>
      </nav>
      <AuthModal />
    </>
  );
};

export default NavBar;
