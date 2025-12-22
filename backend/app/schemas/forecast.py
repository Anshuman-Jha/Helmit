# backend/app/schemas/forecast.py
"""
Pydantic schemas for forecasting responses.
Place at: predictive-safety/backend/app/schemas/forecast.py
"""
from pydantic import BaseModel
from typing import List


class ForecastStep(BaseModel):
    step: int
    score: float
    risk_level: str


class ForecastResponse(BaseModel):
    forecast: List[ForecastStep]
