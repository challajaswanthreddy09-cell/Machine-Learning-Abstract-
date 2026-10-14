"""
backend/main.py
FastAPI REST API Server for LoanGuard AI - Loan Default Prediction System.
"""

import os
import sys
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root is available in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.prediction_service import service

app = FastAPI(
    title="LoanGuard AI - Loan Default Prediction API",
    description="Production-ready FastAPI backend serving scikit-learn/XGBoost pipelines for loan eligibility and default risk scoring.",
    version="1.0.0"
)

# Enable CORS for local React / Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoanApplicantRequest(BaseModel):
    loan_amount: float = Field(..., ge=500.0, le=50000.0, description="Requested loan amount in USD")
    annual_inc: float = Field(..., ge=1000.0, le=5000000.0, description="Annual verifiable income in USD")
    interest_rate: float = Field(..., ge=3.0, le=35.0, description="Interest rate percentage (e.g. 11.5)")
    dti: float = Field(..., ge=0.0, le=100.0, description="Debt-to-Income percentage ratio")
    installment: float = Field(..., ge=10.0, le=3000.0, description="Estimated monthly payment in USD")
    emp_length_int: float = Field(..., ge=0.0, le=40.0, description="Employment length in completed years")
    grade: str = Field(..., description="Credit risk grade (A, B, C, D, E, F, G)")
    home_ownership: str = Field(..., description="Home ownership status (MORTGAGE, RENT, OWN, OTHER)")
    term: str = Field(..., description="Loan repayment duration (36 months, 60 months)")
    purpose: str = Field(..., description="Loan purpose category (e.g. debt_consolidation, credit_card)")
    application_type: str = Field(default="INDIVIDUAL", description="INDIVIDUAL or JOINT")

    class Config:
        json_schema_extra = {
            "example": {
                "loan_amount": 12000.0,
                "annual_inc": 65000.0,
                "interest_rate": 10.5,
                "dti": 18.2,
                "installment": 390.25,
                "emp_length_int": 5.0,
                "grade": "B",
                "home_ownership": "MORTGAGE",
                "term": "36 months",
                "purpose": "debt_consolidation",
                "application_type": "INDIVIDUAL"
            }
        }


@app.get("/", tags=["General"])
def read_root():
    return {
        "project": "Loan Default Prediction System (LoanGuard AI)",
        "docs_url": "/docs",
        "health_check": "/health",
        "metadata_url": "/metadata"
    }


@app.get("/health", tags=["General"])
def health_check():
    """Health check endpoint confirming API status and model availability."""
    return {
        "status": "healthy",
        "model_loaded": service.pipeline is not None,
        "model_name": service.metadata.get("model_name", "Unknown"),
        "features_count": len(service.metadata.get("features", {}).get("numerical", [])) + 
                          len(service.metadata.get("features", {}).get("categorical", []))
    }


@app.get("/metadata", tags=["Model Insights"])
def get_metadata():
    """Returns training metadata, categorical choices, validation limits, and clustering summary."""
    return {
        "metadata": service.metadata,
        "clustering": service.clustering_summary
    }


@app.post("/predict", tags=["Inference"])
def predict_loan_default(applicant: LoanApplicantRequest):
    """
    Submits applicant data to the trained ML model.
    Returns eligibility decision, default probability, risk tier,
    and thread-safely logs the record to data/prediction_history.xlsx.
    """
    try:
        input_dict = applicant.model_dump()
        result = service.predict(input_dict)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )


@app.get("/history", tags=["Persistence"])
def get_prediction_history(limit: int = 50):
    """Fetches recent prediction records logged into Excel."""
    try:
        records = service.get_history(limit=limit)
        return {
            "total_records": len(records),
            "history": records
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading history: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
