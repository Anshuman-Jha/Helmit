# backend/app/crud.py
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy import select, delete
from sqlalchemy.exc import SQLAlchemyError
from .db import AsyncSessionLocal
from .models_db import RiskHistory

async def insert_prediction(record: Dict[str, Any]) -> int:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            ts = record.get("timestamp")
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts)
                except Exception:
                    from datetime import timezone
                    ts = datetime.now(timezone.utc)
            elif ts is None:
                from datetime import timezone
                ts = datetime.now(timezone.utc)
            obj = RiskHistory(
                timestamp=ts,
                message=record.get("message"),
                sender=record.get("sender"),
                risk_level=record.get("risk_level") or "low",
                risk_score=float(record.get("risk_score", 0.0)),
                label_probs=record.get("label_probs"),
                meta=record.get("meta"),
            )
            session.add(obj)
        try:
            await session.commit()
            await session.refresh(obj)
            return int(obj.id)
        except SQLAlchemyError:
            await session.rollback()
            raise

async def get_history(limit: int = 500) -> List[Dict[str, Any]]:
    async with AsyncSessionLocal() as session:
        q = select(RiskHistory).order_by(RiskHistory.timestamp.desc()).limit(limit)
        result = await session.execute(q)
        rows = result.scalars().all()
        out = []
        for r in reversed(rows):
            out.append({
                "id": int(r.id),
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "message": r.message,
                "sender": r.sender,
                "risk_level": r.risk_level,
                "risk_score": float(r.risk_score) if r.risk_score is not None else 0.0,
                "label_probs": r.label_probs,
                "meta": r.meta,
            })
        return out

async def get_recent(limit: int = 100) -> List[Dict[str, Any]]:
    async with AsyncSessionLocal() as session:
        q = select(RiskHistory).order_by(RiskHistory.timestamp.desc()).limit(limit)
        result = await session.execute(q)
        rows = result.scalars().all()
        return [{
            "id": int(r.id),
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "message": r.message,
            "sender": r.sender,
            "risk_level": r.risk_level,
            "risk_score": float(r.risk_score) if r.risk_score is not None else 0.0,
            "label_probs": r.label_probs,
            "meta": r.meta,
        } for r in rows]

async def delete_all() -> int:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            await session.execute(delete(RiskHistory))
        try:
            await session.commit()
        except SQLAlchemyError:
            await session.rollback()
            raise
    return -1
