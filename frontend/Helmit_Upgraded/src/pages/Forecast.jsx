import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, BarChart3, PieChart, TrendingUp } from "lucide-react";
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    Area,
    AreaChart,
} from "recharts";

export default function Forecast() {
    const [loading, setLoading] = useState(false);
    const [forecast, setForecast] = useState(null);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const fetchForecast = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/forecast?days=3", {
                method: "GET",
            });

            if (!res.ok) {
                throw new Error("Failed to fetch forecast");
            }

            const data = await res.json();
            setForecast(data);
        } catch (err) {
            console.error("Forecast fetch error", err);
            setError(err.message);
            setForecast(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/stats", {
                method: "GET",
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Stats fetch error", err);
        }
    };

    useEffect(() => {
        fetchForecast();
        fetchStats();
    }, []);

    // Prepare data for pie chart (risk level distribution)
    const pieChartData = stats?.risk_level_distribution ? Object.entries(stats.risk_level_distribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value,
    })) : [];

    const PIE_COLORS = {
        Low: "#10b981",      // green
        Medium: "#f59e0b",   // yellow
        High: "#ef4444",     // red
        Critical: "#dc2626",  // dark red
        Safe: "#10b981",     // green
    };

    // Prepare data for bar chart (label distribution)
    const barChartData = stats?.label_distribution ? Object.entries(stats.label_distribution).map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        value: Math.round(value * 10) / 10,
    })) : [];

    // Prepare data for line chart (risk score timeline)
    const lineChartData = stats?.risk_score_timeline?.slice(-30).map((item, idx) => ({
        index: idx + 1,
        score: Math.round(item.score * 10) / 10,
        level: item.level,
    })) || [];

    // Prepare data for daily risk averages
    const dailyRiskData = stats?.daily_risk_averages ? Object.entries(stats.daily_risk_averages)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, avg]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            average: Math.round(avg * 10) / 10,
        })) : [];

    // Prepare data for 3-day forecast bar chart
    const forecastBarData = forecast?.forecast ? forecast.forecast.map((item, idx) => {
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
    }) : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        Safety Forecast
                    </h1>
                    <p className="text-gray-600">Risk prediction for the next 3 days</p>
                </div>

                <Card className="w-full">
                    <CardContent className="p-8">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                                <p className="text-gray-600">Loading forecast data...</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-red-50 border border-red-200">
                                    <span className="text-red-700 font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        {!loading && !error && !forecast && (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg mb-2">No forecast available</p>
                                <p className="text-gray-400 text-sm">Start chatting to generate forecast data</p>
                            </div>
                        )}

                        {!loading && !error && forecast && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                        Predicted Risk Levels
                                    </h2>
                                    <p className="text-gray-600 text-sm">
                                        Based on recent conversation patterns
                                    </p>
                                </div>

                                {/* Statistics Summary */}
                                {stats && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                            <p className="text-xs text-blue-600 font-medium mb-1">Total Predictions</p>
                                            <p className="text-2xl font-bold text-blue-900">{stats.total_predictions}</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                            <p className="text-xs text-purple-600 font-medium mb-1">Avg Risk Score</p>
                                            <p className="text-2xl font-bold text-purple-900">{stats.average_risk_score}%</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                            <p className="text-xs text-green-600 font-medium mb-1">Low Risk</p>
                                            <p className="text-2xl font-bold text-green-900">
                                                {stats.risk_level_distribution?.low || stats.risk_level_distribution?.safe || 0}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                            <p className="text-xs text-red-600 font-medium mb-1">High Risk</p>
                                            <p className="text-2xl font-bold text-red-900">
                                                {(stats.risk_level_distribution?.high || 0) + (stats.risk_level_distribution?.critical || 0)}
                                            </p>
                                        </div>
                                    </div>
                                )}

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

                                {forecast.forecast && forecast.forecast.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Detailed Forecast</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {forecast.forecast.map((item, idx) => (
                                                <div key={idx} className="text-center p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-gray-500 mb-1">Step {item.step}</p>
                                                    <p className="text-sm font-semibold text-gray-800">{item.risk_level}</p>
                                                    <p className="text-xs text-gray-600">{(item.score * 100).toFixed(0)}%</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-8 flex justify-center">
                            <Button
                                onClick={() => {
                                    fetchForecast();
                                    fetchStats();
                                }}
                                disabled={loading}
                                className="min-w-[160px]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Refreshing...
                                    </>
                                ) : (
                                    "Refresh Forecast"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Visualizations Section */}
                {stats && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Risk Level Distribution Pie Chart */}
                        {pieChartData.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <PieChart className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">Risk Level Distribution</h3>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || "#8884d8"} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Label Distribution Bar Chart */}
                        {barChartData.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart3 className="w-5 h-5 text-purple-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">Label Distribution</h3>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={barChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Risk Score Timeline */}
                        {lineChartData.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">Risk Score Timeline</h3>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={lineChartData}>
                                            <defs>
                                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="index" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#3b82f6"
                                                fillOpacity={1}
                                                fill="url(#colorScore)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Daily Risk Averages */}
                        {dailyRiskData.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart3 className="w-5 h-5 text-orange-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">Daily Risk Averages (Last 7 Days)</h3>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={dailyRiskData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="average" fill="#f97316" radius={[8, 8, 0, 0]}>
                                                {dailyRiskData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.average > 70 ? "#ef4444" : entry.average > 40 ? "#f59e0b" : "#10b981"}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* 3-Day Forecast Bar Chart */}
                        {forecastBarData.length > 0 && (
                            <Card className="lg:col-span-2">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                                        <h3 className="text-lg font-semibold text-gray-800">3-Day Risk Forecast</h3>
                                        <span className="ml-auto text-xs text-gray-500 bg-indigo-50 px-2 py-1 rounded">Next 3 Days</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height={350}>
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
                                                <linearGradient id="gradientSafe" x1="0" y1="0" x2="0" y2="1">
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
                                                label={{ value: 'Days Ahead', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
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
                                                        gradientId = "gradientSafe";
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
                                    <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-green-500"></div>
                                            <span className="text-gray-600">Low/Safe (&lt;45%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-yellow-500"></div>
                                            <span className="text-gray-600">Medium (45-70%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded bg-red-500"></div>
                                            <span className="text-gray-600">High/Critical (&gt;70%)</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
