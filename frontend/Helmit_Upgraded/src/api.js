
export const API_BASE = "http://localhost:8000";

export async function predictMessage(text) {
    const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ text }] })
    });
    if (!res.ok) throw new Error("Prediction error");
    return await res.json();
}

export async function fetchForecast(days = 3) {
    const res = await fetch(`${API_BASE}/forecast?days=${days}`);
    if (!res.ok) throw new Error("Forecast error");
    return await res.json();
}

export async function scanPrivacy(text) {
    const res = await fetch("http://localhost:8000/privacy/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });

    return res.json();   // ⬅️ THIS becomes `res`
}