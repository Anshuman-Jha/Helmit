# backend/app/core/models_api.py
"""
Light, robust model loader:
- Try to load transformer_multilabel from experiments/transformer_model
- Else, try a TF-IDF OneVsRest pipeline joblib
Expose predict_multilabel_single(text) -> dict label->prob and map_probs_to_risk
"""
import os, joblib, json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
EXP = ROOT / "experiments"
TFIDF_PIPE = EXP / "tfidf_ovr_pipeline.joblib"
TRANS_DIR = EXP / "transformer_model"

LABELS = [
    "mental_health_risk",
    "substance_abuse",
    "harassment",
    "cyberbullying",
    "self_harm",
    "adult_content",
    "online_predator",
]

# Try TF-IDF pipeline first (fast)
_tfidf_pipeline = None
_label_binarizer = None
try:
    if TFIDF_PIPE.exists():
        _tfidf_pipeline = joblib.load(str(TFIDF_PIPE))
except Exception:
    _tfidf_pipeline = None

def predict_multilabel_single(text: str) -> dict:
    # returns dict label->prob (0..1)
    out = {l: 0.0 for l in LABELS}
    
    if _tfidf_pipeline:
        try:
            probs = _tfidf_pipeline.predict_proba([text])
            # OneVsRest predict_proba returns list of arrays per class; handle accordingly
            try:
                class_probs = np.array([p[:,1] if p.ndim==2 else p for p in probs]).T[0]
            except Exception:
                class_probs = np.clip(probs[0], 0.0, 1.0)
            for i, label in enumerate(LABELS):
                out[label] = float(class_probs[i]) if i < len(class_probs) else 0.0
        except Exception:
            pass  # Fall through to keyword heuristics
    
    # Always run keyword heuristics and take max with model predictions
    # This ensures critical cases are caught even if model misses them
    lower = text.lower()
    keyword_probs = {l: 0.0 for l in LABELS}
    
    # Self-harm detection - more comprehensive
    if any(phrase in lower for phrase in ["suicid", "end it", "kill myself", "end it all", "want to die", "not worth living", "end my life"]):
        keyword_probs["self_harm"] = 0.95
        keyword_probs["mental_health_risk"] = 0.9
    # Depression and mental health
    if any(phrase in lower for phrase in ["depressed", "depression", "hopeless", "alone", "can't go on", "can't keep going"]):
        keyword_probs["mental_health_risk"] = max(keyword_probs["mental_health_risk"], 0.85)
    # Bullying
    if any(phrase in lower for phrase in ["bully", "bullied", "bullying"]):
        keyword_probs["cyberbullying"] = 0.92
    # Substance abuse
    if any(phrase in lower for phrase in ["drink", "drugs", "pill", "alcohol", "high"]):
        keyword_probs["substance_abuse"] = 0.6
    # Adult content
    if any(phrase in lower for phrase in ["nude", "sex", "porn"]):
        keyword_probs["adult_content"] = 0.7
    
    # Take maximum of model and keyword predictions
    for label in LABELS:
        out[label] = max(out[label], keyword_probs[label])
    
    return out
    # fallback simple keyword heuristics (temporary)
    lower = text.lower()
    out = {l: 0.0 for l in LABELS}
    # Self-harm detection - more comprehensive
    if any(phrase in lower for phrase in ["suicid", "end it", "kill myself", "end it all", "want to die", "not worth living", "end my life"]):
        out["self_harm"] = 0.95
        out["mental_health_risk"] = 0.9
    # Depression and mental health
    if any(phrase in lower for phrase in ["depressed", "depression", "hopeless", "alone", "can't go on", "can't keep going"]):
        out["mental_health_risk"] = max(out["mental_health_risk"], 0.85)
    # Bullying
    if any(phrase in lower for phrase in ["bully", "bullied", "bullying"]):
        out["cyberbullying"] = 0.92
    # Substance abuse
    if any(phrase in lower for phrase in ["drink", "drugs", "pill", "alcohol", "high"]):
        out["substance_abuse"] = 0.6
    # Adult content
    if any(phrase in lower for phrase in ["nude", "sex", "porn"]):
        out["adult_content"] = 0.7
    return out

def map_probs_to_risk(probs: dict) -> dict:
    # simple rule-based map; more sophisticated model in experiments can replace this
    score = 0.0
    # weight labels - increased weights for critical categories
    weights = {
        "self_harm": 3.0,  # Increased from 2.0
        "cyberbullying": 1.5,  # Increased from 1.2
        "harassment": 1.2,
        "substance_abuse": 0.8,
        "adult_content": 0.6,
        "online_predator": 2.0,  # Increased from 1.5
        "mental_health_risk": 1.5  # Increased from 1.0
    }
    for k, v in probs.items():
        score += weights.get(k, 1.0) * float(v)
    # More sensitive normalization - if self_harm is high, risk should be high
    if probs.get("self_harm", 0) > 0.5:
        # Self-harm gets priority - minimum 0.7 risk if detected
        norm = max(0.7, min(1.0, score / (sum(weights.values()) * 0.4)))
    elif probs.get("mental_health_risk", 0) > 0.7:
        # High mental health risk should be at least medium
        norm = max(0.5, min(1.0, score / (sum(weights.values()) * 0.5)))
    else:
        # Normal scaling
        norm = max(0.0, min(1.0, score / (sum(weights.values()) * 0.5)))
    return {"risk_score": float(norm), "label_probs": probs}
