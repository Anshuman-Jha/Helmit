# backend/app/services/forecast_engine.py
"""
Forecast engine service.
Wraps loading of forecasting artifacts and exposes a single `forecast(days)` function.
Place at: predictive-safety/backend/app/services/forecast_engine.py
"""
import os
import joblib
import numpy as np
from typing import List, Dict, Any

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EXP_DIR = os.path.join(BASE, "experiments")
MODEL_PATH = os.path.join(EXP_DIR, "forecast_model.pt")
PREPROC_PATH = os.path.join(EXP_DIR, "forecast_preproc.joblib")

_model = None
_preproc = None

try:
    if os.path.exists(PREPROC_PATH):
        _preproc = joblib.load(PREPROC_PATH)
    if os.path.exists(MODEL_PATH):
        import torch
        state = torch.load(MODEL_PATH, map_location=torch.device("cpu"))
        meta = state.get("meta", {})
        # reconstruct LSTM same as training
        class LSTMForecaster(torch.nn.Module):
            def __init__(self, input_dim, hidden_dim=128, num_layers=2, horizon=3, n_classes=1, dropout=0.2):
                super().__init__()
                self.lstm = torch.nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=dropout)
                self.head = torch.nn.Sequential(
                    torch.nn.Linear(hidden_dim, max(16, hidden_dim // 2)),
                    torch.nn.ReLU(),
                    torch.nn.Linear(max(16, hidden_dim // 2), horizon * n_classes)
                )
                self.horizon = horizon
                self.n_classes = n_classes
            def forward(self, x):
                out, _ = self.lstm(x)
                last = out[:, -1, :]
                logits = self.head(last)
                logits = logits.view(-1, self.horizon, self.n_classes)
                return logits

        input_dim = int(_preproc.get("feat_dim", 1)) if isinstance(_preproc, dict) else 1
        hidden_dim = int(meta.get("hidden_dim", 128))
        num_layers = int(meta.get("num_layers", 2))
        horizon = int(meta.get("horizon", 3))
        n_classes = int(meta.get("n_classes", 1)) if meta.get("n_classes") else 1
        _model = LSTMForecaster(input_dim=input_dim, hidden_dim=hidden_dim, num_layers=num_layers, horizon=horizon, n_classes=n_classes)
        _model.load_state_dict(state["model_state_dict"]) 
        _model.eval()
except Exception:
    _model = None


def score_to_level(s: float) -> str:
    s = float(s)
    if s < 0.25:
        return "safe"
    if s < 0.45:
        return "medium"
    if s < 0.7:
        return "high"
    return "critical"


def linear_extrapolate(series: List[float], days: int = 3) -> List[float]:
    if len(series) < 2:
        return [float(series[-1]) if series else 0.0] * days
    x = np.arange(len(series))
    y = np.array(series)
    coeffs = np.polyfit(x, y, deg=1)
    slope, intercept = coeffs[0], coeffs[1]
    preds = [float(intercept + slope * (len(series) - 1 + d)) for d in range(1, days + 1)]
    preds = [max(0.0, min(1.0, p)) for p in preds]
    return preds


def forecast_from_history(history: List[Dict[str, Any]], days: int = 3) -> List[Dict[str, Any]]:
    series = [float(h.get("risk_score", 0.0)) for h in history if h.get("risk_score") is not None]
    if not series:
        return [{"step": i+1, "score": 0.0, "risk_level": score_to_level(0.0)} for i in range(days)]

    # model-based
    if _model is not None and _preproc is not None:
        try:
            import torch
            seq_len = int(_preproc.get("seq_len", 10))
            feat_dim = int(_preproc.get("feat_dim", 1))
            last_seq = _preproc.get("last_seq") if isinstance(_preproc, dict) else None
            if last_seq is not None:
                seq = np.array(last_seq).reshape(1, seq_len, feat_dim).astype(np.float32)
            else:
                vals = series[-seq_len:]
                if len(vals) < seq_len:
                    vals = [0.0] * (seq_len - len(vals)) + vals
                seq = np.array(vals).reshape(1, seq_len, 1).astype(np.float32)
            inp = torch.tensor(seq, dtype=torch.float32)
            with torch.no_grad():
                out = _model(inp).cpu().numpy()
            if out.ndim == 3 and out.shape[-1] == 1:
                preds = out.flatten().tolist()[:days]
            elif out.ndim == 3 and out.shape[-1] > 1:
                probs = np.exp(out) / np.sum(np.exp(out), axis=-1, keepdims=True)
                class_idx = np.arange(probs.shape[-1])
                preds = (probs * class_idx).sum(axis=-1).flatten().tolist()[:days]
            else:
                preds = out.flatten().tolist()[:days]
            if isinstance(_preproc, dict) and _preproc.get("scaler") is not None:
                try:
                    scaler = _preproc["scaler"]
                    denorm = [float(scaler.inverse_transform([[p]])[0][0]) for p in preds]
                    preds = [max(0.0, min(1.0, float(d))) for d in denorm]
                except Exception:
                    preds = [max(0.0, min(1.0, float(p))) for p in preds]
            else:
                preds = [max(0.0, min(1.0, float(p))) for p in preds]
            out = [{"step": i+1, "score": float(p), "risk_level": score_to_level(p)} for i, p in enumerate(preds[:days])]
            return out
        except Exception:
            pass

    # fallback
    preds = linear_extrapolate(series, days)
    return [{"step": i+1, "score": float(p), "risk_level": score_to_level(p)} for i, p in enumerate(preds)]
