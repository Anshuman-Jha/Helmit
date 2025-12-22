import { useState, useEffect } from "react";
import axios from "axios";
// #region agent log
fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:3', message: 'ChatPage importing components', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
// #endregion
import ChatBubble from "../components/ChatBubble";
// #region agent log
fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:6', message: 'ChatBubble imported', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
// #endregion
import ChatInput from "../components/ChatInput";
import PrivacyPopup from "../components/PrivacyPopup";
// #region agent log
fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:9', message: 'Importing Sidebar', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
// #endregion
import Sidebar from "../components/Sidebar";
// #region agent log
fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:11', message: 'Sidebar imported', data: { sidebarType: typeof Sidebar }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
// #endregion
import StatsPanel from "../components/StatsPanel";
import ForecastPanel from "../components/ForecastPanel";
// #region agent log
fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:14', message: 'All components imported', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
// #endregion

export default function ChatPage() {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:17', message: 'ChatPage component mounting', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
    // #endregion
    const [messages, setMessages] = useState([]);
    const [privacyAlert, setPrivacyAlert] = useState(null);
    const [stats, setStats] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [showStats, setShowStats] = useState(false);
    const [showForecast, setShowForecast] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:28', message: 'ChatPage mounted and rendering', data: { messagesCount: messages.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
        // #endregion
    }, []);

    async function sendMessage(text) {
        // Add user message immediately
        const userMsg = { text, sender: "self" };
        setMessages((prev) => [...prev, userMsg]);

        try {
            const res = await axios.post("/api/predict", {
                messages: [{ text, sender: "self" }],
            });

            // Extract risk level from the response
            const riskLevel = res.data?.summary?.risk?.level || "low";
            const riskScore = res.data?.summary?.risk?.score || 0;
            const labelProbs = res.data?.summary?.agg_label_scores || {};

            // Find top detected labels (probability > 0.1)
            const detectedLabels = Object.entries(labelProbs)
                .filter(([label, prob]) => prob > 0.1)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([label, prob]) => {
                    // Format label names for display
                    const labelNames = {
                        "self_harm": "Self-Harm",
                        "mental_health_risk": "Mental Health Risk",
                        "cyberbullying": "Cyberbullying",
                        "harassment": "Harassment",
                        "substance_abuse": "Substance Abuse",
                        "adult_content": "Adult Content",
                        "online_predator": "Online Predator"
                    };
                    return `${labelNames[label] || label}: ${(prob * 100).toFixed(0)}%`;
                });

            // Map risk level to category for display
            const categoryMap = {
                "low": "safe",
                "medium": "bullying",
                "high": "self_harm"
            };
            const category = categoryMap[riskLevel] || "safe";

            // Build response text with detected labels
            let responseText = `Analysis: Risk Level ${riskLevel.toUpperCase()} (Score: ${(riskScore * 100).toFixed(0)}%)`;
            if (detectedLabels.length > 0) {
                responseText += `\n\nDetected Categories:\n${detectedLabels.join('\n')}`;
            } else {
                responseText += `\n\nNo specific risks detected.`;
            }

            // Add bot response with risk analysis
            setMessages((prev) => [
                ...prev,
                {
                    text: responseText,
                    sender: "other",
                    category: category,
                },
            ]);
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                {
                    text: "Sorry, there was an error processing your message. Please try again.",
                    sender: "other",
                },
            ]);
        }
    }

    async function fetchStats() {
        try {
            setLoading(true);
            const res = await axios.get("/api/stats");
            setStats(res.data);
            setShowStats(true);
        } catch (error) {
            console.error("Error fetching stats:", error);
            alert("Failed to load statistics. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function fetchForecast() {
        try {
            setLoading(true);
            const res = await axios.get("/api/forecast?days=3");
            setForecast(res.data);
            setShowForecast(true);
        } catch (error) {
            console.error("Error fetching forecast:", error);
            alert("Failed to load forecast. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:114', message: 'ChatPage render starting', data: { hasSidebar: typeof Sidebar !== 'undefined' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
    // #endregion
    try {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:118', message: 'Rendering Sidebar', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
        // #endregion
        return (
            <div className="flex h-screen bg-gray-50">
                {/* Left Sidebar */}
                <Sidebar
                    onStatsClick={fetchStats}
                    onForecastClick={fetchForecast}
                />

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.map((msg, i) => (
                            <ChatBubble key={i} message={msg} />
                        ))}
                    </div>

                    <ChatInput
                        onSend={sendMessage}
                        onPrivacyDetected={setPrivacyAlert}
                    />
                </div>

                {/* Privacy Popup */}
                <PrivacyPopup
                    alert={privacyAlert}
                    onCancel={() => setPrivacyAlert(null)}
                    onConfirm={() => setPrivacyAlert(null)}
                />

                {/* Stats Panel */}
                {showStats && (
                    <StatsPanel
                        stats={stats}
                        onClose={() => setShowStats(false)}
                    />
                )}

                {/* Forecast Panel */}
                {showForecast && (
                    <ForecastPanel
                        forecast={forecast}
                        onClose={() => setShowForecast(false)}
                    />
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center">
                        <div className="bg-white rounded-lg p-6 shadow-xl">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading...</p>
                        </div>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/103f191e-03a0-4544-9c19-d3f0bea8fc69', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'Chatpage.jsx:145', message: 'ERROR in ChatPage render', data: { error: error.message, stack: error.stack }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
        // #endregion
        console.error('ChatPage render error:', error);
        return <div style={{ padding: '20px', color: 'red' }}>Error: {error.message}</div>;
    }
}
