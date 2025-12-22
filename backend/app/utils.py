# backend/app/utils.py
import re
from typing import List, Dict, Any

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text

def map_risk_level(score: float) -> str:
    s = float(score)
    if s < 0.25:
        return "safe"
    elif s < 0.45:
        return "medium"
    elif s < 0.7:
        return "high"
    else:
        return "critical"
