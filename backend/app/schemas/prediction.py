 backend/app/schemas/prediction.py
"""
Pydantic schemas for prediction endpoints.
Place this file at: predictive-safety/backend/app/schemas/prediction.py
"""
from pydantic import BaseModel
from typing import List, Dict, Optional


class MessageIn(BaseModel):
    sender: Optional[str] = "other"
    text: str
    ts: Optional[str] = None


class ConversationIn(BaseModel):
    messages: List[MessageIn]


class LabelProb(BaseModel):
    label: str
    prob: float


class PerMessageOut(BaseModel):
    sender: Optional[str]
    text: str
    ts: Optional[str]
    labels: Optional[Dict[str, float]]
    top_labels: Optional[List[LabelProb]]


class SummaryOut(BaseModel):
    agg_label_scores: Dict[str, float]
    risk: Dict[str, float]


class PredictOut(BaseModel):
    summary: SummaryOut
    per_message: List[PerMessageOut]
    evidence: Optional[List[Dict[str, Optional[str]]]]
