#!/usr/bin/env python3
"""
Train a sequence forecasting model (LSTM) to predict future risk levels.
Saves artifacts to ../experiments/forecast_model.pt and forecast_preproc.joblib

Input: data/risk_history.csv with columns: timestamp,risk_score (numeric 0..1)
Output: model state dict + preprocessor joblib

Usage:
  python training/train_forecast.py --csv data/risk_history.csv --seq_len 10 --horizon 3 --epochs 12

Notes:
 - Uses PyTorch for LSTM training
 - On small datasets reduce batch_size and epochs
"""
import argparse
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import MinMaxScaler
import time

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
EXP_DIR = ROOT / "experiments"
EXP_DIR.mkdir(parents=True, exist_ok=True)


class RiskSeqDataset(Dataset):
    def __init__(self, X, y):
        self.X = X.astype(np.float32)
        self.y = y.astype(np.int64) if y.ndim>1 else y.astype(np.float32)
    def __len__(self):
        return len(self.X)
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


class LSTMModel(nn.Module):
    def __init__(self, input_dim, hidden_dim=128, num_layers=2, horizon=3):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.head = nn.Sequential(nn.Linear(hidden_dim, hidden_dim//2), nn.ReLU(), nn.Linear(hidden_dim//2, horizon))
        self.horizon = horizon
    def forward(self, x):
        out, _ = self.lstm(x)
        last = out[:, -1, :]
        logits = self.head(last)
        return logits


def prepare_sequences(series, seq_len=10, horizon=3):
    X, y = [], []
    for i in range(len(series) - seq_len - horizon + 1):
        X.append(series[i:i+seq_len])
        y.append(series[i+seq_len:i+seq_len+horizon])
    return np.array(X), np.array(y)


def train(args):
    df = pd.read_csv(args.csv)
    df = df.dropna(subset=["timestamp"]) if "timestamp" in df.columns else df
    if "risk_score" not in df.columns:
        raise RuntimeError("data must contain 'risk_score' column with numeric values 0..1")

    vals = df["risk_score"].astype(float).values
    # normalization
    scaler = MinMaxScaler(feature_range=(0,1))
    vals_scaled = scaler.fit_transform(vals.reshape(-1,1)).flatten()

    X, y = prepare_sequences(vals_scaled, seq_len=args.seq_len, horizon=args.horizon)
    if len(X) < 10:
        raise RuntimeError("Not enough data to create training sequences. Need at least seq_len + horizon + 1 rows")

    # reshape X -> (N, seq_len, 1); y -> (N, horizon)
    X = X.reshape(-1, args.seq_len, 1)
    y = y.reshape(-1, args.horizon)

    # train/val split
    n = len(X)
    idx = int(n * (1 - args.val_split))
    X_train, X_val = X[:idx], X[idx:]
    y_train, y_val = y[:idx], y[idx:]

    train_ds = RiskSeqDataset(X_train, y_train)
    val_ds = RiskSeqDataset(X_val, y_val)
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = LSTMModel(input_dim=1, hidden_dim=args.hidden_dim, num_layers=args.num_layers, horizon=args.horizon).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)
    criterion = nn.MSELoss()

    best_loss = float('inf')
    for epoch in range(1, args.epochs + 1):
        model.train()
        total_loss = 0.0
        for Xb, yb in train_loader:
            Xb = Xb.to(device)
            yb = yb.to(device)
            optimizer.zero_grad()
            out = model(Xb)
            loss = criterion(out, yb.float())
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * Xb.size(0)
        train_loss = total_loss / len(train_loader.dataset)

        # val
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for Xb, yb in val_loader:
                Xb = Xb.to(device)
                yb = yb.to(device)
                out = model(Xb)
                loss = criterion(out, yb.float())
                val_loss += loss.item() * Xb.size(0)
        val_loss = val_loss / len(val_loader.dataset)

        print(f"Epoch {epoch}/{args.epochs} train_loss={train_loss:.6f} val_loss={val_loss:.6f}")

        if val_loss < best_loss:
            best_loss = val_loss
            save_path = EXP_DIR / "forecast_model.pt"
            torch.save({"model_state_dict": model.state_dict(), "meta": {"seq_len": args.seq_len, "horizon": args.horizon, "hidden_dim": args.hidden_dim, "num_layers": args.num_layers}}, str(save_path))
            joblib.dump({"scaler": scaler, "seq_len": args.seq_len, "horizon": args.horizon, "feat_dim": 1}, EXP_DIR / "forecast_preproc.joblib")
            print("Saved best model to", save_path)

    print("Training complete. Best val loss:", best_loss)


def cli():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=str, default=str(DATA_DIR / "risk_history.csv"))
    parser.add_argument("--seq_len", type=int, default=10)
    parser.add_argument("--horizon", type=int, default=3)
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch_size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--hidden_dim", type=int, default=128)
    parser.add_argument("--num_layers", type=int, default=2)
    parser.add_argument("--val_split", type=float, default=0.15)
    args = parser.parse_args()
    train(args)

if __name__ == "__main__":
    cli()
