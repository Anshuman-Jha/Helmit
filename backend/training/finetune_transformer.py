#!/usr/bin/env python3
"""
Finetune a Transformer for multi-label safety classification (production-ready)

Saves artifacts to: ../experiments/transformer_model/
Artifacts produced:
 - model files (transformers.save_pretrained)
 - tokenizer files
 - label_binarizer.joblib (MultiLabelBinarizer)

Usage (example):
  cd backend
  python training/finetune_transformer.py \
    --train data/train.csv --val data/val.csv \
    --model_name distilbert-base-uncased --epochs 3 --batch_size 8 --lr 2e-5

Notes:
 - This script uses Hugging Face `transformers` Trainer API.
 - For large models use a GPU (Colab / local CUDA). On CPU, use small models and low batch sizes.
"""
import argparse
import os
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import MultiLabelBinarizer
from datasets import Dataset, DatasetDict
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding,
)
import torch

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
EXP_DIR = ROOT / "experiments" / "transformer_model"
EXP_DIR.mkdir(parents=True, exist_ok=True)

LABELS = [
    "mental_health_risk",
    "substance_abuse",
    "harassment",
    "cyberbullying",
    "self_harm",
    "adult_content",
    "online_predator",
]


def load_and_prepare(train_csv: Path, val_csv: Path, tokenizer_name: str, max_length: int):
    def to_labels_list(row):
        labs = []
        for l in LABELS:
            try:
                if int(row.get(l, 0)) == 1:
                    labs.append(l)
            except Exception:
                continue
        return labs

    train_df = pd.read_csv(train_csv).dropna(subset=["text"]) if train_csv.exists() else pd.DataFrame()
    val_df = pd.read_csv(val_csv).dropna(subset=["text"]) if val_csv.exists() else pd.DataFrame()

    if train_df.empty or val_df.empty:
        raise RuntimeError("train.csv and val.csv must exist in data/ and contain 'text' column")

    train_df["labels_list"] = train_df.apply(to_labels_list, axis=1)
    val_df["labels_list"] = val_df.apply(to_labels_list, axis=1)

    mlb = MultiLabelBinarizer(classes=LABELS)
    mlb.fit(train_df["labels_list"])

    y_train = mlb.transform(train_df["labels_list"])
    y_val = mlb.transform(val_df["labels_list"]) if not val_df.empty else np.zeros((len(y_train), len(LABELS)))
    
    # Convert to float32 for multi-label BCE loss (required dtype)
    y_train = y_train.astype(np.float32)
    y_val = y_val.astype(np.float32)

    ds_train = Dataset.from_dict({"text": train_df["text"].astype(str).tolist(), "labels": y_train.tolist()})
    ds_val = Dataset.from_dict({"text": val_df["text"].astype(str).tolist(), "labels": y_val.tolist()})

    ds = DatasetDict({"train": ds_train, "validation": ds_val})

    tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)

    def tokenize_fn(batch):
        toks = tokenizer(batch["text"], truncation=True, padding="max_length", max_length=max_length)
        # Convert labels to float32 tensor, then back to list (ensures proper dtype)
        import torch
        labels_tensor = torch.tensor(batch["labels"], dtype=torch.float32)
        toks["labels"] = labels_tensor.tolist()
        return toks

    if len(ds["train"]) > 0:
        ds = ds.map(tokenize_fn, batched=True, remove_columns=["text"])
    return ds, tokenizer, mlb
    return ds, tokenizer, mlb


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    # sigmoid then threshold 0.5
    probs = 1 / (1 + np.exp(-logits))
    preds = (probs > 0.5).astype(int)
    from sklearn.metrics import f1_score
    return {"f1_micro": float(f1_score(labels, preds, average="micro"))}

device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"🚀 Using device: {device}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", type=str, default=str(DATA_DIR / "train.csv"))
    parser.add_argument("--val", type=str, default=str(DATA_DIR / "val.csv"))
    parser.add_argument("--model_name", type=str, default="distilbert-base-uncased")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--max_length", type=int, default=128)
    args = parser.parse_args()

    ds, tokenizer, mlb = load_and_prepare(Path(args.train), Path(args.val), args.model_name, args.max_length)

    model = AutoModelForSequenceClassification.from_pretrained(args.model_name, num_labels=len(LABELS), problem_type="multi_label_classification")

    training_args = TrainingArguments(
        output_dir=str(EXP_DIR),
        eval_strategy="epoch",            # ✅ Use 'eval_strategy' (evaluation_strategy is deprecated)
        save_strategy="epoch",
        learning_rate=args.lr,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=1,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        load_best_model_at_end=True,
        fp16=False,                       # ❌ Keep False for M1 (MPS uses float32/bf16)
        logging_steps=10,
        report_to="none",                 # 🚫 Prevents errors if WandB/Tensorboard aren't setup
    )

    # Custom data collator to ensure labels are float32
    def data_collator(features):
        batch = tokenizer.pad(features, return_tensors="pt")
        # Ensure labels are float32 tensors
        if "labels" in batch:
            batch["labels"] = torch.tensor(batch["labels"], dtype=torch.float32)
        return batch
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=ds["train"],
        eval_dataset=ds["validation"],
        processing_class=tokenizer,  # Use processing_class instead of tokenizer (deprecated)
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    trainer.train()

    # Save artifacts
    trainer.save_model(str(EXP_DIR))
    tokenizer.save_pretrained(str(EXP_DIR))
    joblib.dump(mlb, EXP_DIR / "label_binarizer.joblib")
    print("Saved transformer artifacts to", EXP_DIR)


if __name__ == "__main__":
    main()
