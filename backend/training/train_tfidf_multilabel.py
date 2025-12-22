# backend/training/train_tfidf_multilabel.py
import argparse
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, f1_score, roc_auc_score, precision_recall_fscore_support
from sklearn.calibration import CalibratedClassifierCV

ROOT = Path(__file__).resolve().parents[1]
DATA_DEFAULT = ROOT / "data" / "multi_label_dataset.csv"
EXP_DIR = ROOT / "experiments"
EXP_DIR.mkdir(parents=True, exist_ok=True)

LABELS = [
  "mental_health_risk",
  "substance_abuse",
  "harassment",
  "cyberbullying",
  "self_harm",
  "adult_content",
  "online_predator"
]

def load_data(path):
    df = pd.read_csv(path)
    # basic cleaning: ensure columns exist
    for c in LABELS:
        if c not in df.columns:
            df[c] = 0
    df = df.dropna(subset=["text"])
    X = df["text"].astype(str).values
    Y = df[LABELS].astype(int).values
    return X, Y, df

def build_pipeline():
    # base estimator (LogisticRegression)
    base = LogisticRegression(solver="liblinear", C=1.0, max_iter=1000)
    # wrap base in calibrated classifier (Platt/Logistic)
    # Note: In scikit-learn >= 1.2, use 'estimator' instead of 'base_estimator'
    calibrated = CalibratedClassifierCV(estimator=base, cv=3, method="isotonic")
    ovr = OneVsRestClassifier(calibrated)
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1,2), max_df=0.95, min_df=2)),
        ("clf", ovr)
    ])
    return pipeline

def evaluate(y_true, y_pred, y_prob):
    print("F1 macro:", f1_score(y_true, y_pred, average="macro"))
    print(classification_report(y_true, y_pred, target_names=LABELS))
    # per-label ROC AUC (if possible)
    try:
        aucs = []
        for i in range(y_true.shape[1]):
            auc = roc_auc_score(y_true[:, i], y_prob[:, i])
            aucs.append(auc)
        print("Per-label ROC AUC:", dict(zip(LABELS, [round(a,3) for a in aucs])))
    except Exception:
        pass

def train(args):
    X, Y, df = load_data(args.data)
    X_train, X_val, y_train, y_val = train_test_split(X, Y, test_size=0.15, random_state=42)
    print("Train size:", len(X_train), "Val size:", len(X_val))

    pipeline = build_pipeline()

    # Fit pipeline (this will fit vectorizer then OVR of calibrated LR)
    pipeline.fit(X_train, y_train)

    # predict
    y_pred = pipeline.predict(X_val)
    # predict_proba: OneVsRestClassifier.predict_proba returns array (n_samples, n_labels)
    y_prob = pipeline.predict_proba(X_val)

    evaluate(y_val, y_pred, y_prob)

    # Save pipeline
    out_path = EXP_DIR / "tfidf_ovr_pipeline.joblib"
    joblib.dump(pipeline, out_path)
    print("Saved pipeline ->", out_path)

    # save a small metrics file for reference
    metrics = {"n_train": len(X_train), "n_val": len(X_val)}
    joblib.dump(metrics, EXP_DIR / "train_meta.joblib")
    print("Saved train metadata")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=str(DATA_DEFAULT))
    args = parser.parse_args()
    train(args)
