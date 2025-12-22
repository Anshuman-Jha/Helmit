#!/usr/bin/env python3
"""
Generate synthetic multi-label message dataset and a risk_history.csv for forecasting.

Outputs (under backend/data/):
 - multi_label_dataset.csv
 - multi_label_dataset_clean.csv
 - train.csv
 - val.csv
 - risk_history.csv

Usage:
  python training/generate_synthetic_data.py --out_dir data --n_messages 2000

This script creates a diverse set of labeled messages and a synthetic daily
risk history simulating gradual escalation and random spikes.
"""
import argparse
from pathlib import Path
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone

LABELS = [
    "mental_health_risk",
    "substance_abuse",
    "harassment",
    "cyberbullying",
    "self_harm",
    "adult_content",
    "online_predator",
]

TEMPLATES = {
    "mental_health_risk": [
        "I feel so alone and hopeless",
        "I don't think I can keep going",
        "Everything feels pointless",
    ],
    "substance_abuse": [
        "I've been drinking more lately",
        "I used pills to sleep last night",
        "I need something to calm me down",
    ],
    "harassment": [
        "You're useless and pathetic",
        "I will make your life miserable",
        "Nobody likes you",
    ],
    "cyberbullying": [
        "Spread this photo and shame them",
        "Let's troll that account all night",
        "Post it and watch them suffer",
    ],
    "self_harm": [
        "I want to end it all",
        "I cut myself last night",
        "I don't deserve to live",
    ],
    "adult_content": [
        "Send nudes",
        "Looking for explicit pics",
        "Are you up for adult chat?",
    ],
    "online_predator": [
        "Where do you live?",
        "Can you meet me alone?",
        "Send a photo of your room",
    ],
}
NEUTRAL = [
    "Hey, are you coming later?",
    "Let's meet tomorrow",
    "Did you finish the assignment?",
    "I bought groceries today",
]


def gen_messages(n):
    rows = []
    for _ in range(n):
        if random.random() < 0.6:
            # neutral
            text = random.choice(NEUTRAL)
            labels = [0] * len(LABELS)
        else:
            k = random.choices(LABELS, k=random.choice([1, 1, 2]))
            text = " ".join(random.choice(TEMPLATES[l]) for l in k)
            labels = [1 if l in k else 0 for l in LABELS]
            # add modifier sometimes
            if random.random() < 0.2:
                text += " please help"
        row = {"text": text}
        for i, l in enumerate(LABELS):
            row[l] = labels[i]
        rows.append(row)
    return rows


def gen_risk_history(days=200):
    # base trend slowly increasing
    start = datetime.now(timezone.utc).date() - timedelta(days=days)
    dates = [start + timedelta(days=i) for i in range(days)]
    base = np.linspace(0.1, 0.6, days)
    noise = np.random.normal(0, 0.05, days)
    scores = np.clip(base + noise, 0, 1)
    # inject random spikes
    for _ in range(max(3, days // 30)):
        idx = random.randint(0, days - 1)
        spike_length = random.randint(1, 3)
        # Ensure we don't go out of bounds
        end_idx = min(idx + spike_length, days)
        scores[idx: end_idx] = np.clip(scores[idx: end_idx] + np.random.uniform(0.2, 0.5), 0, 1)
    rows = []
    for d, s in zip(dates, scores):
        rows.append({"timestamp": d.isoformat(), "risk_score": float(round(float(s), 4))})
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out_dir", type=str, default=str(Path(__file__).resolve().parents[1] / "data"))
    parser.add_argument("--n_messages", type=int, default=800)
    parser.add_argument("--days", type=int, default=200)
    args = parser.parse_args()

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    msgs = gen_messages(args.n_messages)
    df = pd.DataFrame(msgs)
    df.to_csv(out / "multi_label_dataset.csv", index=False)

    # clean and split
    df_clean = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
    df_clean.to_csv(out / "multi_label_dataset_clean.csv", index=False)
    # simple train/val split
    val_n = max(50, int(len(df_clean) * 0.12))
    train_df = df_clean[:-val_n]
    val_df = df_clean[-val_n:]
    train_df.to_csv(out / "train.csv", index=False)
    val_df.to_csv(out / "val.csv", index=False)

    # risk history
    history = gen_risk_history(days=args.days)
    pd.DataFrame(history).to_csv(out / "risk_history.csv", index=False)

    print("Wrote:")
    print(" -", out / "multi_label_dataset.csv")
    print(" -", out / "multi_label_dataset_clean.csv")
    print(" -", out / "train.csv")
    print(" -", out / "val.csv")
    print(" -", out / "risk_history.csv")


if __name__ == "__main__":
    main()
