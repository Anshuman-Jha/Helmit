import { useState } from "react";
import { BarChart3, TrendingUp, X } from "lucide-react";

export default function Sidebar({ onStatsClick, onForecastClick }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className={`${isOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col h-screen`}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                {isOpen && <h2 className="text-lg font-semibold text-gray-800">Menu</h2>}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {isOpen ? <X className="w-5 h-5" /> : <span className="text-2xl">☰</span>}
                </button>
            </div>

            <div className="flex-1 p-4 space-y-2">
                <button
                    onClick={onStatsClick}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                >
                    <BarChart3 className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span className="font-medium">View Stats</span>}
                </button>

                <button
                    onClick={onForecastClick}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                >
                    <TrendingUp className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span className="font-medium">View Forecast</span>}
                </button>
            </div>
        </div>
    );
}

