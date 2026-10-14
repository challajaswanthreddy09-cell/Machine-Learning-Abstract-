"""
ml/preprocessing.py
Data Preprocessing Pipeline for Loan Default Prediction.

Handles:
- Loading the raw loan_final313 dataset.
- Removal of post-loan target leakage features (recoveries, total_pymnt, etc.).
- Categorical and numerical column separation.
- Median imputation and StandardScaler for numerical features.
- Most-frequent imputation and OneHotEncoder for categorical features.
"""

import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

NUMERICAL_FEATURES = [
    "loan_amount",
    "emp_length_int",
    "annual_inc",
    "interest_rate",
    "dti",
    "installment"
]

CATEGORICAL_FEATURES = [
    "grade",
    "home_ownership",
    "term",
    "purpose",
    "application_type"
]

TARGET_COL = "loan_condition_cat"

# Columns identified as post-loan leakage, arbitrary IDs, or redundant duplicates
LEAKAGE_COLUMNS = [
    "total_pymnt",        # Leakage: Cumulative payments made after loan origination
    "total_rec_prncp",    # Leakage: Principal recovered over time
    "recoveries",          # Leakage: Debt collection recoveries post-chargeoff
    "final_d",            # Leakage: Date of final settlement/default
    "issue_d",            # Timestamp of issuance (not an intrinsic credit risk attribute)
    "year",               # Origination year
    "id",                 # Unique applicant row identifier
]

DUPLICATE_OR_REDUNDANT_COLUMNS = [
    "home_ownership_cat",     # Integer duplicate of home_ownership
    "income_cat",             # Integer duplicate of income_category
    "term_cat",               # Integer duplicate of term
    "application_type_cat",   # Integer duplicate of application_type
    "purpose_cat",            # Integer duplicate of purpose
    "interest_payment_cat",   # Integer duplicate of interest_payments
    "grade_cat",              # Integer duplicate of grade
    "income_category",        # Coarse binning of annual_inc
    "interest_payments",      # Coarse binning of interest_rate
    "region"                  # Demographic location label not relevant to core credit capacity
]


def load_and_clean_data(csv_path: str):
    """
    Loads dataset from csv_path, maps the target variable, 
    removes leakage and redundant columns, and returns X and y.
    """
    df = pd.read_csv(csv_path)

    # Validate and standardize target
    if "loan_condition_cat" in df.columns:
        y = df["loan_condition_cat"].astype(int)
    elif "loan_condition" in df.columns:
        # 1 for Bad Loan (Default), 0 for Good Loan
        y = df["loan_condition"].map({"Bad Loan": 1, "Good Loan": 0}).astype(int)
    else:
        raise ValueError("Could not find target column 'loan_condition_cat' or 'loan_condition'")

    # Clean categorical text columns (strip whitespace)
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # Normalize home_ownership categories (map rare types like NONE, ANY to OTHER)
    valid_home = ["MORTGAGE", "RENT", "OWN", "OTHER"]
    df["home_ownership"] = df["home_ownership"].apply(lambda x: x if x in valid_home else "OTHER")

    # Clean numerical features: clip severe anomalies (e.g. DTI extreme outliers)
    df["dti"] = df["dti"].clip(lower=0.0, upper=100.0)

    # Select candidate feature matrix X
    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES].copy()

    return X, y


def get_preprocessor(scale_numerical: bool = True) -> ColumnTransformer:
    """
    Constructs a reusable ColumnTransformer.
    - Numerical: Median imputation + (optional) StandardScaler
    - Categorical: Most-frequent imputation + OneHotEncoder (ignoring unseen categories)
    """
    num_steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale_numerical:
        num_steps.append(("scaler", StandardScaler()))

    num_transformer = Pipeline(steps=num_steps)

    cat_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_transformer, NUMERICAL_FEATURES),
            ("cat", cat_transformer, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )

    return preprocessor


def create_pipeline(model, scale_numerical: bool = True) -> Pipeline:
    """
    Wraps preprocessor and the given estimator into an end-to-end Pipeline.
    """
    preprocessor = get_preprocessor(scale_numerical=scale_numerical)
    return Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", model)
    ])
