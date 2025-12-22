# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .db import init_db
from .routes import predict, forecast, privacy, stats

app = FastAPI(title="Helmit AI Predictive Safety MVP", version="1.0")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def on_startup():
    try:
        await init_db()
    except Exception:
        pass

app.include_router(predict.router)
app.include_router(forecast.router)
app.include_router(privacy.router)
app.include_router(stats.router)

@app.get("/health")
def health():
    return {"status": "ok"}
