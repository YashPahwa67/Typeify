import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getUserStats } from "../services/score.api";

const StatCard = ({ label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-1 px-8 py-6 rounded-2xl"
    style={{ background: "#151a25" }}
  >
    <span className="text-gray-500 text-xs uppercase tracking-widest">
      {label}
    </span>
    <span className="text-yellow-400 text-3xl font-extrabold">{value}</span>
  </motion.div>
);

const Profile = ({ onNavigate }) => {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getUserStats(token);
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  const handleLogout = () => {
    logout();
    onNavigate("home");
  };

  return (
    <div className="px-6 pb-6">
      <div
        className="rounded-2xl p-10 w-full"
        style={{ background: "#151a25" }}
      >
        {/* Top Row — Avatar + Name + Logout */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-yellow-400">
              {user?.username?.[0]?.toUpperCase() ?? "?"}
            </div>

            {/* Name + join date */}
            <div>
              <h2 className="text-white text-3xl font-extrabold">
                {user?.username}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Joined{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "recently"}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 text-sm font-semibold border border-gray-700 hover:border-red-500/40"
          >
            <span>⎋</span> Logout
          </button>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Tests Completed"
              value={stats?.testsCompleted ?? 0}
            />
            <StatCard label="Best WPM" value={stats?.bestWpm ?? 0} />
            <StatCard label="Avg WPM" value={stats?.avgWpm ?? 0} />
            <StatCard
              label="Avg Accuracy"
              value={`${stats?.avgAccuracy ?? 0}%`}
            />
          </div>
        )}

        {/* Recent scores CTA */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between items-center">
          <span className="text-gray-600 text-sm">
            Your best scores appear on the leaderboard
          </span>
          <button
            onClick={() => onNavigate("leaderboard")}
            className="text-yellow-400 text-sm font-semibold hover:text-yellow-300 transition-all"
          >
            View Leaderboard →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
