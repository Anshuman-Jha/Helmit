# backend/app/routes/forecast.py
from fastapi import APIRouter, HTTPException
import os, joblib, numpy as np
from pathlib import Path

# Use relative imports since we're in the app package
from ..crud import get_history

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

EXP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "experiments"))
MODEL_PATH = os.path.join(EXP_DIR, "forecast_model.pt")
PREPROC_PATH = os.path.join(EXP_DIR, "forecast_preproc.joblib")

def score_to_level(s: float) -> str:
    s = float(s)
    if s < 0.25:
        return "safe"
    if s < 0.45:
        return "medium"
    if s < 0.7:
        return "high"
    return "critical"

def linear_extrapolate(series, days=3):
    series = np.array(series)
    if len(series) < 2:
        return [float(series[-1]) if len(series)>0 else 0.0]*days
    x = np.arange(len(series))
    coeffs = np.polyfit(x, series, 1)
    slope, intercept = coeffs[0], coeffs[1]
    preds = [float(np.clip(intercept + slope*(len(series)-1+d), 0,1)) for d in range(1, days+1)]
    return preds

@router.get("")
async def forecast(days: int = 3, recent: int = 60):
    try:
        history = await get_history(limit=recent)
    except Exception as e:
        # Return empty forecast instead of crashing
        return {
            "forecast": [{"step": i+1, "score": 0.0, "risk_level": "safe"} for i in range(days)],
            "daily_risk_pct": [0] * days,
            "error": f"Database error: {str(e)}"
        }
    if not history:
        # Return default safe forecast if no history
        return {
            "forecast": [{"step": i+1, "score": 0.0, "risk_level": "safe"} for i in range(days)],
            "daily_risk_pct": [0] * days
        }
    series = [float(h.get("risk_score", 0.0)) for h in history if h.get("risk_score") is not None]
    preds = linear_extrapolate(series, days=days)
    out = []
    for i,p in enumerate(preds):
        out.append({"step": i+1, "score": float(p), "risk_level": score_to_level(p)})
    # also return simple daily risk pct for UI convenience
    daily_risk_pct = [int(round(p*100)) for p in preds]
    return {"forecast": out, "daily_risk_pct": daily_risk_pct}
