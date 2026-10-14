"""
ml/evaluate.py
Model Evaluation & Reporting Script for Loan Default Prediction.

Reads the saved model metadata, prints the comparative evaluation table,
displays confusion matrices, and generates an evaluation report.
"""

import os
import sys
import json

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METADATA_PATH = os.path.join(BASE_DIR, "ml", "model_metadata.json")


def display_evaluation_report():
    if not os.path.exists(METADATA_PATH):
        print(f"Error: Model metadata not found at {METADATA_PATH}. Run ml/train.py first.")
        return

    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    print("=" * 80)
    print("LOAN DEFAULT PREDICTION SYSTEM - MODEL EVALUATION REPORT")
    print("=" * 80)
    print(f"Dataset Used       : {meta['dataset_name']}")
    print(f"Target Column      : {meta['target_column']}")
    print(f"Winning Model      : {meta['model_name']}")
    print(f"Model File         : {meta['model_file']}")
    print(f"Evaluation Date    : {meta['training_date']}")
    print("-" * 80)

    print("\n[1] COMPARATIVE PERFORMANCE MATRIX (On Unseen Test Data):")
    print(f"{'Model Name':22} | {'Accuracy':8} | {'Precision':9} | {'Recall':8} | {'F1-Score':8} | {'ROC-AUC':8} | {'Fit Time (s)':12}")
    print("-" * 80)

    for name, metrics in meta["evaluation_metrics"].items():
        print(
            f"{name:22} | "
            f"{metrics['accuracy']:8.4f} | "
            f"{metrics['precision']:9.4f} | "
            f"{metrics['recall']:8.4f} | "
            f"{metrics['f1_score']:8.4f} | "
            f"{metrics['roc_auc']:8.4f} | "
            f"{metrics['fit_time_seconds']:12.2f}"
        )

    print("-" * 80)

    print("\n[2] CONFUSION MATRICES:")
    for name, metrics in meta["evaluation_metrics"].items():
        cm = metrics.get("confusion_matrix")
        if cm:
            tn, fp = cm[0]
            fn, tp = cm[1]
            print(f"\n--- {name} ---")
            print(f"  True Negatives (Correct Non-Defaults) : {tn:,}")
            print(f"  False Positives (Type I Error)       : {fp:,}")
            print(f"  False Negatives (Type II Error)      : {fn:,}")
            print(f"  True Positives (Detected Defaults)   : {tp:,}")
            print(f"  Default Detection Recall Rate        : {tp / (tp + fn) * 100:.2f}%")

    print("\n[3] TOP 10 FEATURE IMPORTANCE (From Winning Model):")
    for idx, item in enumerate(meta.get("feature_importances", [])[:10], start=1):
        bar = "#" * int(item["importance"] * 80)
        print(f"  {idx:2}. {item['feature']:28} : {item['importance']:.5f} | {bar}")

    print("\n[4] RISK THRESHOLDS (Configured in Backend):")
    print(f"  Low Risk (Approved)          : Probability < {meta['risk_thresholds']['low_risk_threshold']}")
    print(f"  Medium Risk (Conditional)   : {meta['risk_thresholds']['low_risk_threshold']} <= Probability < {meta['risk_thresholds']['medium_risk_threshold']}")
    print(f"  High Risk (Declined)         : Probability >= {meta['risk_thresholds']['medium_risk_threshold']}")
    print("=" * 80)


if __name__ == "__main__":
    display_evaluation_report()
