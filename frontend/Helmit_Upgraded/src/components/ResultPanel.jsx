
export default function ResultPanel({ result }) {
    if (!result) return null;

    return (
        <div className="bg-white border-t p-4 shadow-inner">
            <h2 className="font-semibold text-lg mb-2">Prediction Result</h2>

            <div className="space-y-1 text-sm text-gray-800">
                <p><strong>Risk Label:</strong> {result.risk_label}</p>
                <p><strong>Overall Score:</strong> {result.overall_score.toFixed(3)}</p>
                <p><strong>Toxicity:</strong> {result.toxicity_score.toFixed(3)}</p>
                <p><strong>Self Harm:</strong> {result.self_harm_score.toFixed(3)}</p>
                <p><strong>Harassment:</strong> {result.harassment_score.toFixed(3)}</p>
                <p><strong>Adult Content:</strong> {result.adult_score.toFixed(3)}</p>
                <p><strong>Substance Abuse:</strong> {result.substance_score.toFixed(3)}</p>
            </div>
        </div>
    );
}