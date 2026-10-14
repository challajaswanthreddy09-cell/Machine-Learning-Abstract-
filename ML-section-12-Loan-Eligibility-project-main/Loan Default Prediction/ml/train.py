"""
ml/train.py
Model Training & Selection Script for Loan Default Prediction.

Trains and compares:
1. Logistic Regression
2. Decision Tree Classifier
3. Random Forest Classifier
4. XGBoost Classifier

Evaluates models, selects the best model, computes feature importance,
and serializes the production pipeline to joblib and metadata to JSON.
"""

import os
import sys
import json
import time
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix
)

# Add project root and ml directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from ml.preprocessing import (
    load_and_clean_data, get_preprocessor, create_pipeline,
    NUMERICAL_FEATURES, CATEGORICAL_FEATURES, TARGET_COL
)


def train_and_evaluate():
    data_path = os.path.join(BASE_DIR, "data", "loan_final313.csv")
    models_dir = os.path.join(BASE_DIR, "ml", "models")
    os.makedirs(models_dir, exist_ok=True)

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Loading dataset from: {data_path}")
    X, y = load_and_clean_data(data_path)
    total_records = len(X)
    default_count = int(y.sum())
    non_default_count = total_records - default_count
    imbalance_ratio = non_default_count / default_count

    print(f"Total instances: {total_records:,}")
    print(f"Class distribution: Good Loans (0) = {non_default_count:,} ({non_default_count/total_records*100:.1f}%), Bad Loans/Defaults (1) = {default_count:,} ({default_count/total_records*100:.1f}%)")
    print(f"Imbalance ratio: {imbalance_ratio:.2f}:1")

    # Extract unique values for frontend metadata
    categorical_options = {}
    for col in CATEGORICAL_FEATURES:
        categorical_options[col] = sorted(list(X[col].unique()))

    numerical_stats = {}
    for col in NUMERICAL_FEATURES:
        numerical_stats[col] = {
            "min": float(X[col].min()),
            "max": float(X[col].max()),
            "median": float(X[col].median()),
            "mean": float(round(X[col].mean(), 2)),
            "std": float(round(X[col].std(), 2))
        }

    # Stratified sampling for fast, statistically sound training
    sample_size = min(150000, len(X))
    print(f"Selecting stratified sample of {sample_size:,} records for high-efficiency training...")
    X_sample, _, y_sample, _ = train_test_split(
        X, y, train_size=sample_size, stratify=y, random_state=42
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X_sample, y_sample, test_size=0.20, stratify=y_sample, random_state=42
    )
    print(f"Train split: {len(X_train):,} samples | Test split: {len(X_test):,} samples")

    # Model definitions
    candidate_models = {
        "Logistic Regression": {
            "model": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
            "scale_numerical": True,
            "description": "Baseline linear classifier with class-balanced weighting and L2 regularization"
        },
        "Decision Tree": {
            "model": DecisionTreeClassifier(max_depth=8, min_samples_leaf=50, class_weight="balanced", random_state=42),
            "scale_numerical": False,
            "description": "Single tree using Gini impurity, max depth=8 to avoid overfitting"
        },
        "Random Forest": {
            "model": RandomForestClassifier(n_estimators=100, max_depth=12, min_samples_leaf=20, class_weight="balanced", n_jobs=-1, random_state=42),
            "scale_numerical": False,
            "description": "Bagging ensemble of 100 decision trees with feature subsampling"
        },
        "XGBoost": {
            "model": XGBClassifier(
                n_estimators=120,
                max_depth=5,
                learning_rate=0.08,
                scale_pos_weight=imbalance_ratio,
                eval_metric="logloss",
                random_state=42
            ),
            "scale_numerical": False,
            "description": "Gradient boosted decision trees optimized with scale_pos_weight"
        }
    }

    results = {}
    fitted_pipelines = {}

    print("\n" + "="*70)
    print(f"{'Model':22} | {'Accuracy':8} | {'Precision':9} | {'Recall':8} | {'F1':8} | {'ROC-AUC':8}")
    print("="*70)

    for name, config in candidate_models.items():
        t0 = time.time()
        pipeline = create_pipeline(config["model"], scale_numerical=config["scale_numerical"])
        pipeline.fit(X_train, y_train)
        fit_duration = time.time() - t0

        y_pred = pipeline.predict(X_test)
        y_proba = pipeline.predict_proba(X_test)[:, 1]

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred))
        auc = float(roc_auc_score(y_test, y_proba))
        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "confusion_matrix": cm,
            "fit_time_seconds": round(fit_duration, 2),
            "description": config["description"]
        }
        fitted_pipelines[name] = pipeline

        print(f"{name:22} | {acc:8.4f} | {prec:9.4f} | {rec:8.4f} | {f1:8.4f} | {auc:8.4f}")

    print("="*70)

    # Model Selection: We prioritize ROC-AUC and F1 for imbalanced default detection
    best_model_name = max(results.keys(), key=lambda k: (results[k]["roc_auc"] + results[k]["f1_score"]))
    print(f"\nWinning Model Selected: {best_model_name}")
    print(f"Selection criteria: Highest combined ROC-AUC ({results[best_model_name]['roc_auc']}) and balanced F1-score ({results[best_model_name]['f1_score']}) for default risk differentiation.")

    best_pipeline = fitted_pipelines[best_model_name]

    # Save Pipeline artifact
    model_save_path = os.path.join(models_dir, "loan_default_model.joblib")
    joblib.dump(best_pipeline, model_save_path)
    print(f"Saved trained pipeline to: {model_save_path}")

    # Feature Importance computation
    feature_importances = []
    preprocessor = best_pipeline.named_steps["preprocessor"]
    classifier = best_pipeline.named_steps["classifier"]

    # Extract one-hot feature names
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["onehot"]
    cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    all_feature_names = NUMERICAL_FEATURES + cat_feature_names

    if hasattr(classifier, "feature_importances_"):
        raw_importances = classifier.feature_importances_
        for feat_name, imp in zip(all_feature_names, raw_importances):
            feature_importances.append({"feature": feat_name, "importance": round(float(imp), 5)})
        feature_importances.sort(key=lambda x: x["importance"], reverse=True)
    elif hasattr(classifier, "coef_"):
        raw_coefs = np.abs(classifier.coef_[0])
        for feat_name, coef in zip(all_feature_names, raw_coefs):
            feature_importances.append({"feature": feat_name, "importance": round(float(coef), 5)})
        feature_importances.sort(key=lambda x: x["importance"], reverse=True)

    print("\nTop 10 Most Important Features:")
    for item in feature_importances[:10]:
        print(f"  {item['feature']:30}: {item['importance']:.5f}")

    # Metadata file
    metadata = {
        "model_name": best_model_name,
        "model_file": "loan_default_model.joblib",
        "training_date": datetime.now().isoformat(),
        "dataset_name": "loan_final313.csv",
        "target_column": TARGET_COL,
        "target_classes": {
            "0": "Good Loan (Non-Default)",
            "1": "Bad Loan (Default)"
        },
        "features": {
            "numerical": NUMERICAL_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
            "all_preprocessed_features": all_feature_names
        },
        "categorical_options": categorical_options,
        "numerical_stats": numerical_stats,
        "evaluation_metrics": results,
        "best_metrics": results[best_model_name],
        "feature_importances": feature_importances[:15],
        "risk_thresholds": {
            "low_risk_threshold": 0.35,
            "medium_risk_threshold": 0.60,
            "description": "Default probability < 0.35 is Low Risk (Approved), 0.35-0.60 is Medium Risk (Conditional Approval), >= 0.60 is High Risk (Declined)."
        }
    }

    metadata_path = os.path.join(BASE_DIR, "ml", "model_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to: {metadata_path}")


if __name__ == "__main__":
    train_and_evaluate()
