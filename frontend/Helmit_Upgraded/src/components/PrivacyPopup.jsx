export default function PrivacyPopup({ alert, onCancel, onConfirm }) {
    if (!alert) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
                <h2 className="text-lg font-semibold text-red-600">
                    ⚠ Sensitive Information Detected
                </h2>

                <p className="mt-3 text-gray-700">
                    You are about to share <strong>{alert.type}</strong>.
                </p>

                <p className="text-sm text-gray-500 mt-2">
                    Hmm...Sharing personal details?? Remember Home safety rules!!.
                </p>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                        Sorry, I'll keep it to myself.
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                    >
                        I Understand, Send Anyway
                    </button>
                </div>
            </div>
        </div>
    );
}
