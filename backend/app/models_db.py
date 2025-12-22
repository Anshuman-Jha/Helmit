# backend/app/models_db.py
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, func, Index
from .db import Base

class RiskHistory(Base):
    __tablename__ = "risk_history"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    message = Column(String(length=2000), nullable=True)
    sender = Column(String(length=64), nullable=True)
    risk_level = Column(String(length=32), nullable=False, index=True)
    risk_score = Column(Float, nullable=False, index=True)
    label_probs = Column(JSON, nullable=True)
    meta = Column(JSON, nullable=True)
    def __repr__(self):
        return f"<RiskHistory id={self.id} risk={self.risk_level} score={self.risk_score}>"
Index('ix_risk_history_timestamp', RiskHistory.timestamp)
Index('ix_risk_history_level_score', RiskHistory.risk_level, RiskHistory.risk_score)
