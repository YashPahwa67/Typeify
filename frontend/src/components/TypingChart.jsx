import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { FaMagic } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { getCoaching } from "../services/coach.api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const TypingChart = ({
  wpmData,
  errors,
  totalTyped,
  accuracy,
  consistency = 0,
  onRestart,
  mode,
  selectedTime,
  selectedWordCount,
}) => {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const safeWpmData = wpmData || [];

  // Get the very last WPM value for the big display
  const finalWpm = safeWpmData.length > 0 ? safeWpmData[safeWpmData.length - 1].wpm : 0;

  // AI Coach state
  const [coach, setCoach] = useState({ status: "idle", tips: [], error: "" });

  const runCoach = async () => {
    setCoach({ status: "loading", tips: [], error: "" });
    try {
      const tips = await getCoaching({
        wpm: finalWpm,
        accuracy: Math.round(typeof accuracy === "number" ? accuracy : 100),
        consistency,
        raw: totalTyped,
        errors,
        mode,
        duration: mode === "time" ? selectedTime : null,
        wordCount: mode === "words" ? selectedWordCount : null,
        wpmSeries: safeWpmData.map((d) => d.wpm),
      });
      setCoach({ status: "done", tips, error: "" });
    } catch (err) {
      setCoach({ status: "error", tips: [], error: err.message });
    }
  };
  
  const correctChars = Math.max(0, totalTyped - errors);
  const formattedAccuracy = typeof accuracy === "number" ? accuracy.toFixed(0) : "100";

  const chartData = {
    // X-Axis: Use the 'second' field directly
    labels: safeWpmData.map((d) => d.second),
    datasets: [
      {
        label: "WPM",
        data: safeWpmData.map((d) => d.wpm),
        borderColor: "#e2b714",
        backgroundColor: "rgba(226, 183, 20, 0.12)",
        borderWidth: 3,
        pointRadius: 2,
        pointBackgroundColor: "#e2b714",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Time (s)", color: "#6b7688" },
        ticks: { color: "#6b7688" },
        grid: { color: "#262e3b" },
      },
      y: {
        title: { display: true, text: "WPM", color: "#6b7688" },
        ticks: { color: "#6b7688" },
        grid: { color: "#262e3b" },
        beginAtZero: true,
      },
    },
  };

  const Stat = ({ label, value, sub }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest text-sub-alt">
        {label}
      </span>
      <span className="font-mono text-3xl font-semibold tabular-nums text-accent">
        {value}
      </span>
      {sub && <span className="text-xs text-sub">{sub}</span>}
    </div>
  );

  return (
    <div className="panel mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-7xl flex-col p-8">
      {/* HERO STATS */}
      <div className="grid grid-cols-1 gap-8 border-b border-border pb-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex gap-12">
          <div>
            <div className="text-xs uppercase tracking-widest text-sub-alt">
              wpm
            </div>
            <div className="font-mono text-7xl font-bold leading-none text-accent">
              {finalWpm}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-sub-alt">
              accuracy
            </div>
            <div className="font-mono text-7xl font-bold leading-none text-accent">
              {formattedAccuracy}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:justify-items-end">
          <Stat label="raw" value={totalTyped} />
          <Stat
            label="characters"
            value={`${correctChars}/${errors}`}
            sub="correct / errors"
          />
          <Stat
            label={mode === "time" ? "time" : "words"}
            value={mode === "time" ? `${selectedTime}s` : `${selectedWordCount}`}
          />
          <Stat label="mode" value={mode} />
        </div>
      </div>

      {/* CHART AREA */}
      <div className="mt-6 min-h-[300px] flex-grow">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* AI COACH */}
      <div className="mt-6">
        {coach.status === "idle" && (
          <div className="flex justify-center">
            <button
              onClick={runCoach}
              className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
            >
              <FaMagic /> Get AI coaching
            </button>
          </div>
        )}

        {coach.status === "loading" && (
          <div className="flex items-center justify-center gap-3 text-sub-alt">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            analyzing your run…
          </div>
        )}

        {coach.status === "error" && (
          <div className="text-center text-sm text-sub-alt">
            Coaching unavailable right now.{" "}
            <button
              onClick={runCoach}
              className="text-accent underline-offset-4 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {coach.status === "done" && (
          <div className="view-enter rounded-2xl border border-border bg-surface-2 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent">
              <FaMagic /> AI Coach
            </div>
            <ul className="space-y-2">
              {coach.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-text">
                  <span className="text-accent">▹</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onRestart}
          title="Next test"
          aria-label="Next test"
          className="grid h-11 w-16 place-items-center rounded-xl text-2xl text-sub-alt transition-all duration-200 hover:bg-surface-2 hover:text-accent"
        >
          ↻
        </button>
      </div>

      {!isAuthenticated && (
        <div className="mt-3 text-center text-sm text-sub-alt">
          <button
            className="underline-offset-4 transition-colors hover:text-accent hover:underline"
            onClick={() => setShowAuthModal(true)}
          >
            🔒 Log in to save your score
          </button>
        </div>
      )}
    </div>
  );
};

export default TypingChart;