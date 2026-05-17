import React from "react";
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
import { useAuth } from "../context/AuthContext";

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
  onRestart,
  mode,
  selectedTime,
  selectedWordCount,
}) => {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const safeWpmData = wpmData || [];

  // Get the very last WPM value for the big display
  const finalWpm = safeWpmData.length > 0 ? safeWpmData[safeWpmData.length - 1].wpm : 0;
  
  const correctChars = Math.max(0, totalTyped - errors);
  const formattedAccuracy = typeof accuracy === "number" ? accuracy.toFixed(0) : "100";

  const chartData = {
    // X-Axis: Use the 'second' field directly
    labels: safeWpmData.map((d) => d.second),
    datasets: [
      {
        label: "WPM",
        data: safeWpmData.map((d) => d.wpm),
        borderColor: "#FACC15",
        backgroundColor: "rgba(250, 204, 21, 0.1)", // Add fill for better visual
        borderWidth: 3,
        pointRadius: 2,
        tension: 0.3,
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
        title: { display: true, text: 'Time (s)', color: '#6B7280' },
        ticks: { color: "#9CA3AF" }, 
        grid: { color: "#374151" } 
      },
      y: {
        title: { display: true, text: 'WPM', color: '#6B7280' },
        ticks: { color: "#9CA3AF" },
        grid: { color: "#374151" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-6 bg-gray-800 rounded-lg shadow-2xl min-h-[calc(100vh-120px)] flex flex-col">
      {/* STATS HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-gray-400 text-xs uppercase mb-2">WPM</div>
          <div className="text-yellow-400 text-7xl font-bold mb-4">{finalWpm}</div>

          <div className="text-gray-400 text-xs uppercase mb-2">ACC</div>
          <div className="text-yellow-400 text-6xl font-bold">{formattedAccuracy}%</div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-gray-400 text-xs uppercase">raw</div>
              <div className="text-yellow-400 text-4xl">{totalTyped}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase">characters</div>
              <div className="text-yellow-400 text-xl">
                {correctChars}/{errors}/0/0
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase">time</div>
              <div className="text-yellow-400 text-4xl">
                {mode === "time" ? `${selectedTime}s` : `${selectedWordCount}w`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHART AREA */}
      <div className="mt-auto flex-grow min-h-[300px]">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* CONTROLS */}
      <div className="flex justify-center mt-6">
        <button className="text-gray-500 text-2xl hover:text-yellow-400 transition-colors" onClick={onRestart}>
          ↻
        </button>
      </div>
      
      {!isAuthenticated && (
         <div className="text-center mt-2 text-gray-500 text-sm">
            <span
              className="underline cursor-pointer hover:text-yellow-400 transition-colors"
              onClick={() => setShowAuthModal(true)}
            >
              🔒 Login to save your score
            </span>
          </div>
      )}
    </div>
  );
};

export default TypingChart;