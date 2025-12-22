import { useState } from "react";
import axios from "axios";

export default function ChatInput({ onSend, onPrivacyDetected }) {
    const [text, setText] = useState("");
    const [blocked, setBlocked] = useState(false);

    async function handleChange(e) {
        const value = e.target.value;
        setText(value);

        if (!value.trim()) {
            setBlocked(false);
            onPrivacyDetected(null);
            return;
        }

        const res = await axios.post("/api/privacy/check", { text: value });

        if (res.data.flagged) {
            setBlocked(true);
            onPrivacyDetected(res.data);
        } else {
            setBlocked(false);
            onPrivacyDetected(null);
        }
    }

    async function handleSend() {
        if (blocked || !text.trim()) return;

        await onSend(text);
        setText("");
    }

    return (
        <div className="flex items-center gap-2 p-3 border-t bg-white">
            <input
                value={text}
                onChange={handleChange}
                placeholder="Type a message…"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring"
            />
            <button
                onClick={handleSend}
                disabled={blocked}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-40"
            >
                Send
            </button>
        </div>
    );
}


