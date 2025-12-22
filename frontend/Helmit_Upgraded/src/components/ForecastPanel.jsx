import { X, TrendingUp } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

export default function ForecastPanel({ forecast, onClose }) {
    if (!forecast) return null;

    const forecastBarData = forecast?.forecast
        ? forecast.forecast.map((item, idx) => {
            const today = new Date();
            const forecastDate = new Date(today);
            forecastDate.setDate(today.getDate() + item.step);

            return {
                day: `Day ${item.step}`,
                date: forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                score: Math.round(item.score * 100),
                level: item.risk_level,
                fullDate: forecastDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            };
        })
        : [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-2xl font-bold text-gray-800">3-Day Risk Forecast</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Forecast Cards */}
                    <div className="space-y-3">
                        {forecast.daily_risk_pct?.map((day, idx) => {
                            const riskColor = day > 70
                                ? "bg-red-50 border-red-200"
                                : day > 40
                                    ? "bg-yellow-50 border-yellow-200"
                                    : "bg-green-50 border-green-200";

                            const textColor = day > 70
                                ? "text-red-700"
                                : day > 40
                                    ? "text-yellow-700"
                                    : "text-green-700";

                            const badgeColor = day > 70
                                ? "bg-red-100 text-red-800"
                                : day > 40
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800";

                            return (
                                <div
                                    key={idx}
                                    className={`p-5 rounded-xl border-2 ${riskColor} transition-all duration-200 hover:shadow-md`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-lg ${badgeColor} flex items-center justify-center font-bold text-lg`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">Day {idx + 1}</p>
                                                <p className="text-xs text-gray-500">Risk Prediction</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${textColor}`}>
                                                {day}%
                                            </p>
                                            <p className={`text-xs font-medium ${textColor} uppercase`}>
                                                {day > 70 ? "High" : day > 40 ? "Medium" : "Low"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Forecast Bar Chart */}
                    {forecastBarData.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">3-Day Forecast Visualization</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={forecastBarData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <defs>
                                        <linearGradient id="gradientHigh" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                                        </linearGradient>
                                        <linearGradient id="gradientMedium" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                                        </linearGradient>
                                        <linearGradient id="gradientLow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                                    <XAxis
                                        dataKey="day"
                                        angle={-15}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        label={{ value: 'Risk Score (%)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}
                                        formatter={(value, name, props) => [
                                            `${value}%`,
                                            `${props.payload.level.charAt(0).toUpperCase() + props.payload.level.slice(1)} Risk`
                                        ]}
                                        labelFormatter={(label, payload) => {
                                            if (payload && payload[0]) {
                                                return `${payload[0].payload.fullDate}`;
                                            }
                                            return label;
                                        }}
                                    />
                                    <Bar
                                        dataKey="score"
                                        radius={[12, 12, 0, 0]}
                                        strokeWidth={2}
                                    >
                                        {forecastBarData.map((entry, index) => {
                                            let gradientId = "gradientLow";
                                            let strokeColor = "#10b981";

                                            if (entry.level === "critical" || entry.level === "high") {
                                                gradientId = "gradientHigh";
                                                strokeColor = "#ef4444";
                                            } else if (entry.level === "medium") {
                                                gradientId = "gradientMedium";
                                                strokeColor = "#f59e0b";
                                            } else if (entry.level === "safe" || entry.level === "low") {
                                                gradientId = "gradientLow";
                                                strokeColor = "#10b981";
                                            }

                                            return (
                                                <Cell
                                                    key={`forecast-cell-${index}`}
                                                    fill={`url(#${gradientId})`}
                                                    stroke={strokeColor}
                                                />
                                            );
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

