# backend/app/services/ai_inference.py
"""
AI inference service wrapper.
Provides a clear interface for the rest of the app to call ML models.
This wraps core.models_api so other app parts don't need to know internals.

Place at: predictive-safety/backend/app/services/ai_inference.py
"""
from typing import Dict, Any, List
from app.core import models_api


def predict_multilabel_for_text(text: str) -> Dict[str, float]:
    """Return dict label->prob for a single text."""
    return models_api.predict_multilabel_single(text)


def aggregate_labels_max(list_of_label_dicts: List[Dict[str, float]]) -> Dict[str, float]:
    """Aggregate multiple per-message label dicts into a single dict using max pooling."""
    agg = {}
    for d in list_of_label_dicts:
        for k, v in (d or {}).items():
            agg[k] = max(agg.get(k, 0.0), float(v))
    return agg


def map_to_risk(probs: Dict[str, float]) -> Dict[str, Any]:
    """Map aggregated probs to risk level/score using models_api helper."""
    return models_api.map_probs_to_risk(probs)
