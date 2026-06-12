import React from "react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./Auth/AuthModal";
import { FaKeyboard, FaTrophy, FaUser } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`group relative grid h-10 w-10 place-items-center rounded-lg text-xl transition-all duration-200
      ${
        active
          ? "text-accent bg-accent/10"
          : "text-sub-alt hover:text-text hover:bg-surface-2"
      }`}
  >
    {icon}
    <span
      className={`pointer-events-none absolute -bottom-1 h-[3px] rounded-full bg-accent transition-all duration-300
        ${active ? "w-5 opacity-100" : "w-0 opacity-0"}`}
    />
  </button>
);

const NavBar = ({ onNavigate, currentPage }) => {
  const { isAuthenticated, setShowAuthModal } = useAuth();

  return (
    <>
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6">
        <button
          onClick={() => onNavigate("home")}
          className="group flex items-center gap-3"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-2xl text-accent transition-transform duration-200 group-hover:-rotate-6">
            <FaKeyboard />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-text">type</span>
            <span className="text-accent">ify</span>
          </h1>
        </button>

        <div className="flex items-center gap-2">
          <NavItem
            icon={<FaTrophy />}
            label="Leaderboard"
            active={currentPage === "leaderboard"}
            onClick={() => onNavigate("leaderboard")}
          />

          <NavItem
            icon={<GiCrossedSwords />}
            label={isAuthenticated ? "Multiplayer" : "Multiplayer (login required)"}
            active={currentPage === "multiplayer"}
            onClick={() =>
              isAuthenticated ? onNavigate("multiplayer") : setShowAuthModal(true)
            }
          />

          {isAuthenticated ? (
            <NavItem
              icon={<FaUser />}
              label="Profile"
              active={currentPage === "profile"}
              onClick={() => onNavigate("profile")}
            />
          ) : (
            <NavItem
              icon={<FaUser />}
              label="Login"
              active={false}
              onClick={() => setShowAuthModal(true)}
            />
          )}
        </div>
      </nav>
      <AuthModal />
    </>
  );
};

export default NavBar;
