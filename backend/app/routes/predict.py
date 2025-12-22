# backend/app/routes/predict.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

# Use relative imports since we're in the app package
from ..db import get_session
from ..core.models_api import predict_multilabel_single, map_probs_to_risk
from ..crud import insert_prediction

router = APIRouter(prefix="/api/predict", tags=["predict"])

class MsgIn(BaseModel):
    text: str
    sender: str = "other"

class ConversationIn(BaseModel):
    messages: list[MsgIn]

@router.post("")
async def predict_single(payload: ConversationIn):
    # For MVP we accept list of messages; we compute per-message scores and aggregate
    messages = payload.messages
    if not messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    per_message = []
    aggregated = {}
    for m in messages:
        t = m.text
        probs = predict_multilabel_single(t)
        per_message.append({"sender": m.sender, "text": t, "labels": probs})
        # aggregate by max
        for k, v in probs.items():
            aggregated[k] = max(aggregated.get(k, 0.0), v)
    risk = map_probs_to_risk(aggregated)
    # persist last message as record
    rec = {
        "message": messages[-1].text,
        "sender": messages[-1].sender,
        "risk_level": ("high" if risk["risk_score"]>=0.7 else "medium" if risk["risk_score"]>=0.45 else "low"),
        "risk_score": float(risk["risk_score"]),
        "label_probs": aggregated,
    }
    try:
        _id = await insert_prediction(rec)
    except Exception:
        _id = None
    return {"id": _id, "summary": {"agg_label_scores": aggregated, "risk": {"level": rec["risk_level"], "score": rec["risk_score"]}}, "per_message": per_message}
