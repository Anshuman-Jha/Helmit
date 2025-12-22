import { useEffect, useState } from "react";

export default function Dashboard() {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/forecast");
        if (!res.ok) throw new Error("Failed to load forecast data");
        const data = await res.json();
        setForecast(data.forecast || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Risk Forecast Dashboard</h1>

      {loading && <p className="text-gray-500">Loading forecast...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && forecast.length === 0 && (
        <p className="text-gray-600">No forecast data available yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Forecast Box */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Upcoming Risk Levels</h2>
          {forecast.length > 0 ? (
            <ul className="space-y-2">
              {forecast.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <span className="font-medium">Day {item.step}</span>
                  <span
                    className={`font-semibold ${item.risk_level === "high" || item.risk_level === "critical"
                      ? "text-red-600"
                      : item.risk_level === "medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                      }`}
                  >
                    {item.risk_level.toUpperCase()} ({(item.score * 100).toFixed(0)}%)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No upcoming risk predictions.</p>
          )}
        </div>

        {/* Summary Box */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <p className="text-gray-700 leading-relaxed">
            This dashboard shows predicted risk levels for the next 3 days based on
            user conversations. The system analyzes message patterns and assigns a
            risk score categorized into <strong>Low</strong>, <strong>Medium</strong>,
            or <strong>High</strong> severity.
          </p>
        </div>
      </div>
    </div>
  );
}
