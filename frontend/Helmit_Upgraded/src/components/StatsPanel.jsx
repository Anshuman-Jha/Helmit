import { X } from "lucide-react";
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
    AreaChart,
    Area,
} from "recharts";

export default function StatsPanel({ stats, onClose }) {
    if (!stats) return null;

    const pieChartData = stats?.risk_level_distribution
        ? Object.entries(stats.risk_level_distribution).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: value,
        }))
        : [];

    const PIE_COLORS = {
        Low: "#10b981",
        Medium: "#f59e0b",
        High: "#ef4444",
        Critical: "#dc2626",
        Safe: "#10b981",
    };

    const barChartData = stats?.label_distribution
        ? Object.entries(stats.label_distribution).map(([name, value]) => ({
            name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            value: Math.round(value * 10) / 10,
        }))
        : [];

    const lineChartData = stats?.risk_score_timeline?.slice(-30).map((item, idx) => ({
        index: idx + 1,
        score: Math.round(item.score * 10) / 10,
        level: item.level,
    })) || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-gray-800">Statistics Dashboard</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-xs text-blue-600 font-medium mb-1">Total Predictions</p>
                            <p className="text-2xl font-bold text-blue-900">{stats.total_predictions || 0}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <p className="text-xs text-purple-600 font-medium mb-1">Avg Risk Score</p>
                            <p className="text-2xl font-bold text-purple-900">{stats.average_risk_score || 0}%</p>
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

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pieChartData.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Level Distribution</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
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
                            </div>
                        )}

                        {barChartData.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Label Distribution</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={barChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {lineChartData.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Score Timeline</h3>
                                <ResponsiveContainer width="100%" height={250}>
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

