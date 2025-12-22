# backend/app/routes/stats.py
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from collections import Counter
from datetime import datetime, timedelta, timezone

# Use relative imports since we're in the app package
from ..crud import get_history

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("")
async def get_user_stats():
    """Get user statistics for visualization"""
    try:
        history = await get_history(limit=1000)
        
        if not history:
            return {
                "risk_level_distribution": {},
                "risk_score_timeline": [],
                "label_distribution": {},
                "total_predictions": 0,
                "average_risk_score": 0.0,
            }
        
        # Risk level distribution (for pie chart)
        risk_levels = [h.get("risk_level", "low") for h in history]
        risk_level_distribution = dict(Counter(risk_levels))
        
        # Risk score timeline (for line/bar chart)
        risk_score_timeline = []
        for h in history[-60:]:  # Last 60 predictions
            risk_score_timeline.append({
                "timestamp": h.get("timestamp"),
                "score": float(h.get("risk_score", 0.0)) * 100,  # Convert to percentage
                "level": h.get("risk_level", "low"),
            })
        
        # Label probabilities distribution (for bar chart)
        label_distribution = {}
        for h in history:
            label_probs = h.get("label_probs", {})
            if isinstance(label_probs, dict):
                for label, prob in label_probs.items():
                    if label not in label_distribution:
                        label_distribution[label] = []
                    label_distribution[label].append(float(prob) * 100)
        
        # Calculate averages for each label
        label_averages = {
            label: sum(probs) / len(probs) if probs else 0.0
            for label, probs in label_distribution.items()
        }
        
        # Calculate overall statistics
        total_predictions = len(history)
        average_risk_score = sum(float(h.get("risk_score", 0.0)) for h in history) / total_predictions * 100
        
        # Risk trend (last 7 days)
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        recent_history = [
            h for h in history 
            if h.get("timestamp") and datetime.fromisoformat(h.get("timestamp").replace('Z', '+00:00')) > seven_days_ago
        ]
        
        daily_risk = {}
        for h in recent_history:
            timestamp = h.get("timestamp")
            if timestamp:
                try:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    day_key = dt.strftime("%Y-%m-%d")
                    if day_key not in daily_risk:
                        daily_risk[day_key] = []
                    daily_risk[day_key].append(float(h.get("risk_score", 0.0)) * 100)
                except:
                    pass
        
        daily_risk_averages = {
            day: sum(scores) / len(scores)
            for day, scores in daily_risk.items()
        }
        
        return {
            "risk_level_distribution": risk_level_distribution,
            "risk_score_timeline": risk_score_timeline,
            "label_distribution": label_averages,
            "daily_risk_averages": daily_risk_averages,
            "total_predictions": total_predictions,
            "average_risk_score": round(average_risk_score, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

