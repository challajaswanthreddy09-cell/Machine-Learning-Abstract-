import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet, ShieldAlert, Cpu } from "lucide-react";

export default function PredictionResult({ result }) {
  if (!result) {
    return (
      <div className="card-glass result-placeholder">
        <ShieldAlert size={56} className="result-placeholder-icon" />
        <h3 style={{ color: "#e2e8f0", marginBottom: "0.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
          Awaiting Application Submission
        </h3>
        <p style={{ maxWidth: "340px", fontSize: "0.9rem" }}>
          Fill in the applicant profile on the left or select a sample profile, then click <strong>Predict Loan Default Risk</strong> to run inference.
        </p>
      </div>
    );
  }

  const { eligible, decision, default_probability, risk_level, model_used, timestamp, input_data } = result;
  const probPct = Math.round(default_probability * 1000) / 10;

  const riskClass = risk_level === "Low" ? "low" : risk_level === "Medium" ? "med" : "high";
  const cardRiskClass = risk_level === "Low" ? "low-risk" : risk_level === "Medium" ? "med-risk" : "high-risk";

  return (
    <div className={`card-glass result-card ${cardRiskClass}`}>
      <div className="card-header">
        <div className="card-title-group">
          <Cpu size={20} color="#38bdf8" />
          <h2 className="card-title">Prediction Result</h2>
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{timestamp}</span>
      </div>

      {/* Decision Banner */}
      <div className={`decision-badge ${riskClass}`}>
        {risk_level === "Low" ? (
          <CheckCircle2 size={22} />
        ) : risk_level === "Medium" ? (
          <AlertTriangle size={22} />
        ) : (
          <XCircle size={22} />
        )}
        <span>{decision}</span>
      </div>

      {/* Default Probability Meter */}
      <div className="prob-meter-box">
        <div className="prob-meter-header">
          <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
            Estimated Default Probability
          </span>
          <span className="prob-val" style={{
            color: risk_level === "Low" ? "var(--risk-low)" : risk_level === "Medium" ? "var(--risk-med)" : "var(--risk-high)"
          }}>
            {probPct}%
          </span>
        </div>

        <div className="prob-track">
          <div
            className={`prob-fill ${riskClass}`}
            style={{ width: `${Math.min(Math.max(probPct, 3), 100)}%` }}
          ></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
          <span>0% (Safe)</span>
          <span>35% (Approval Cutoff)</span>
          <span>60% (High Risk)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Key Diagnostic Metrics */}
      <div className="result-details-grid">
        <div className="result-detail-item">
          <div className="result-detail-label">Risk Assessment</div>
          <div className="result-detail-val" style={{
            color: risk_level === "Low" ? "var(--risk-low)" : risk_level === "Medium" ? "var(--risk-med)" : "var(--risk-high)"
          }}>
            {risk_level} Risk Tier
          </div>
        </div>

        <div className="result-detail-item">
          <div className="result-detail-label">Inference Model</div>
          <div className="result-detail-val">{model_used}</div>
        </div>

        <div className="result-detail-item">
          <div className="result-detail-label">Loan Amount</div>
          <div className="result-detail-val">${input_data?.loan_amount?.toLocaleString()}</div>
        </div>

        <div className="result-detail-item">
          <div className="result-detail-label">Credit Grade</div>
          <div className="result-detail-val">Grade {input_data?.grade}</div>
        </div>
      </div>

      {/* Persistence Confirmation */}
      <div className="excel-saved-badge">
        <FileSpreadsheet size={18} />
        <span>Transaction logged to <code>data/prediction_history.xlsx</code></span>
      </div>
    </div>
  );
}
