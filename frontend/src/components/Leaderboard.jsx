import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLeaderboard } from "../services/score.api";

const FILTERS = [15, 30, 60, 120];

const Leaderboard = () => {
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getLeaderboard(selectedDuration);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDuration]);

  return (
    <div
      className="flex w-full text-text"
      style={{ minHeight: "calc(100vh - 88px)" }}
    >
      {/* ── Sidebar ── */}
      <div className="w-56 shrink-0 py-8 px-4 flex flex-col gap-2">
        <p className="text-gray-600 text-xs uppercase tracking-widest mb-4 px-2">
          Duration
        </p>
        {FILTERS.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedDuration(time)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 w-full text-left
              ${
                selectedDuration === time
                  ? "bg-accent text-[#0e1116]"
                  : "text-sub-alt hover:bg-surface-2 hover:text-text"
              }`}
          >
            <span>🕐</span>
            time {time}
          </button>
        ))}
      </div>

      {/* ── Main card ── */}
      <div
        className="panel flex-1 overflow-auto px-10 py-8"
        style={{ margin: "16px 24px 24px 0" }}
      >
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-200 mb-8 tracking-wide">
          All-time English Time {selectedDuration} Leaderboard
        </h1>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center mt-32">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-400 text-sm mt-10">{error}</p>}

        {/* Table */}
        {!loading && !error && (
          <div className="w-full">
            {/* Header */}
            <div
              className="grid px-4 py-3 text-gray-600 text-xs uppercase tracking-widest border-b mb-1"
              style={{
                gridTemplateColumns: "40px 1fr 120px 120px 140px",
                borderColor: "#1e2535",
              }}
            >
              <span>#</span>
              <span>name</span>
              <span className="text-right">wpm</span>
              <span className="text-right">accuracy</span>
              <span className="text-right">date</span>
            </div>

            {/* Rows */}
            <AnimatePresence mode="wait">
              {data.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-600 py-32 text-sm"
                >
                  No scores yet for {selectedDuration}s — be the first! 🏆
                </motion.div>
              ) : (
                data.map((entry, index) => (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="grid px-4 py-4 items-center rounded-lg transition-all duration-150 cursor-default"
                    style={{
                      gridTemplateColumns: "40px 1fr 120px 120px 140px",
                      backgroundColor:
                        index === 0 ? "rgba(250,204,21,0.05)" : "transparent",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        index === 0 ? "rgba(250,204,21,0.05)" : "transparent")
                    }
                  >
                    {/* Rank */}
                    <span className="font-bold">
                      {index === 0 ? (
                        <span className="text-yellow-400 text-lg">👑</span>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          {index + 1}
                        </span>
                      )}
                    </span>

                    {/* Username */}
                    <span
                      className={`font-semibold text-sm flex items-center gap-3 ${
                        index === 0 ? "text-yellow-400" : "text-gray-200"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 shrink-0">
                        {entry.userId?.username?.[0]?.toUpperCase() ?? "?"}
                      </span>
                      {entry.userId?.username ?? "unknown"}
                    </span>

                    {/* WPM */}
                    <span
                      className={`text-right font-bold text-sm ${
                        index === 0 ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      {entry.wpm.toFixed(2)}
                    </span>

                    {/* Accuracy */}
                    <span
                      className={`text-right text-sm font-medium ${
                        entry.accuracy >= 95
                          ? "text-green-400"
                          : entry.accuracy >= 80
                            ? "text-yellow-300"
                            : "text-red-400"
                      }`}
                    >
                      {entry.accuracy.toFixed(2)}%
                    </span>

                    {/* Date */}
                    <span className="text-right text-xs text-gray-600 leading-relaxed">
                      {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      <br />
                      {new Date(entry.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {/* Footer */}
            {data.length > 0 && (
              <div
                className="mt-6 pt-4 text-gray-600 text-xs flex justify-between border-t"
                style={{ borderColor: "#1e2535" }}
              >
                <span>Showing top {data.length} results</span>
                <span>time {selectedDuration}s · english</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
