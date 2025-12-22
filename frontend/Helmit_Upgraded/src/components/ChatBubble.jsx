export default function ChatBubble({ message }) {
    const isUser = message.sender === "self";

    const badgeColor = {
        safe: "bg-green-100 text-green-700",
        bullying: "bg-yellow-100 text-yellow-700",
        harassment: "bg-orange-100 text-orange-700",
        self_harm: "bg-red-100 text-red-700",
        adult: "bg-purple-100 text-purple-700",
        privacy: "bg-blue-100 text-blue-700",
    };

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-2`}>
            <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl shadow 
          ${isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"}`}
            >
                <p className="text-sm">{message.text}</p>

                {message.category && (
                    <div className="mt-1">
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium 
                ${badgeColor[message.category] || "bg-gray-100 text-gray-600"}`}
                        >
                            {message.category.replace("_", " ").toUpperCase()}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
