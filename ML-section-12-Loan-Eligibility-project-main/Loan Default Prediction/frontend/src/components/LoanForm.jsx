import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function LoanForm({ metadata, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    loan_amount: 12000,
    annual_inc: 65000,
    interest_rate: 11.5,
    dti: 17.5,
    installment: 395.7,
    emp_length_int: 5,
    grade: "B",
    home_ownership: "MORTGAGE",
    term: "36 months",
    purpose: "debt_consolidation",
    application_type: "INDIVIDUAL"
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const nextVal = type === "number" || type === "range" ? parseFloat(value) || 0 : value;
      const updated = { ...prev, [name]: nextVal };

      // Dynamically calculate standard amortized monthly installment if loan_amount, interest_rate, or term changes
      if (name === "loan_amount" || name === "interest_rate" || name === "term") {
        const principal = name === "loan_amount" ? nextVal : updated.loan_amount;
        const ratePct = name === "interest_rate" ? nextVal : updated.interest_rate;
        const termMonths = (name === "term" ? nextVal : updated.term).includes("60") ? 60 : 36;
        
        const monthlyRate = (ratePct / 100) / 12;
        if (monthlyRate > 0) {
          const inst = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
                       (Math.pow(1 + monthlyRate, termMonths) - 1);
          updated.installment = Math.round(inst * 100) / 100;
        }
      }

      return updated;
    });
  };

  const applyPreset = (type) => {
    if (type === "prime") {
      setFormData({
        loan_amount: 10000,
        annual_inc: 115000,
        interest_rate: 6.8,
        dti: 10.2,
        installment: 307.86,
        emp_length_int: 8,
        grade: "A",
        home_ownership: "MORTGAGE",
        term: "36 months",
        purpose: "credit_card",
        application_type: "INDIVIDUAL"
      });
    } else if (type === "moderate") {
      setFormData({
        loan_amount: 15000,
        annual_inc: 58000,
        interest_rate: 13.5,
        dti: 19.5,
        installment: 509.05,
        emp_length_int: 4,
        grade: "C",
        home_ownership: "RENT",
        term: "36 months",
        purpose: "debt_consolidation",
        application_type: "INDIVIDUAL"
      });
    } else if (type === "high-risk") {
      setFormData({
        loan_amount: 28000,
        annual_inc: 32000,
        interest_rate: 23.5,
        dti: 33.5,
        installment: 798.80,
        emp_length_int: 1,
        grade: "F",
        home_ownership: "RENT",
        term: "60 months",
        purpose: "small_business",
        application_type: "INDIVIDUAL"
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const gradeOptions = metadata?.categorical_options?.grade || ["A", "B", "C", "D", "E", "F", "G"];
  const homeOptions = metadata?.categorical_options?.home_ownership || ["MORTGAGE", "RENT", "OWN", "OTHER"];
  const termOptions = metadata?.categorical_options?.term || ["36 months", "60 months"];
  const purposeOptions = metadata?.categorical_options?.purpose || [
    "debt_consolidation", "credit_card", "home_improvement", "other",
    "major_purchase", "small_business", "car", "medical", "moving",
    "vacation", "house", "wedding", "renewable_energy", "educational"
  ];
  const appTypeOptions = metadata?.categorical_options?.application_type || ["INDIVIDUAL", "JOINT"];

  return (
    <div className="card-glass">
      <div className="card-header">
        <div className="card-title-group">
          <Sparkles size={20} color="#38bdf8" />
          <h2 className="card-title">Applicant Profile</h2>
        </div>
      </div>

      {/* Quick Test Presets */}
      <div className="presets-bar">
        <span className="presets-label">Sample Profiles:</span>
        <button type="button" className="preset-btn" onClick={() => applyPreset("prime")}>
          Prime (Low Risk)
        </button>
        <button type="button" className="preset-btn" onClick={() => applyPreset("moderate")}>
          Moderate Risk
        </button>
        <button type="button" className="preset-btn" onClick={() => applyPreset("high-risk")}>
          Subprime (High Risk)
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Loan Amount */}
          <div className="form-group">
            <label className="form-label">
              <span>Requested Loan Amount</span>
              <span className="form-val-display">${formData.loan_amount.toLocaleString()}</span>
            </label>
            <input
              type="range"
              name="loan_amount"
              min="1000"
              max="35000"
              step="500"
              value={formData.loan_amount}
              onChange={handleChange}
              className="form-range"
            />
            <input
              type="number"
              name="loan_amount"
              value={formData.loan_amount}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Annual Income */}
          <div className="form-group">
            <label className="form-label">
              <span>Annual Income</span>
              <span className="form-val-display">${formData.annual_inc.toLocaleString()}</span>
            </label>
            <input
              type="range"
              name="annual_inc"
              min="15000"
              max="250000"
              step="2500"
              value={formData.annual_inc}
              onChange={handleChange}
              className="form-range"
            />
            <input
              type="number"
              name="annual_inc"
              value={formData.annual_inc}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Credit Risk Grade */}
          <div className="form-group">
            <label className="form-label">Credit Risk Grade</label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="form-select"
            >
              {gradeOptions.map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>

          {/* Interest Rate */}
          <div className="form-group">
            <label className="form-label">
              <span>Assigned Interest Rate</span>
              <span className="form-val-display">{formData.interest_rate}%</span>
            </label>
            <input
              type="range"
              name="interest_rate"
              min="5.0"
              max="28.0"
              step="0.25"
              value={formData.interest_rate}
              onChange={handleChange}
              className="form-range"
            />
            <input
              type="number"
              name="interest_rate"
              step="0.1"
              value={formData.interest_rate}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* DTI */}
          <div className="form-group">
            <label className="form-label">
              <span>Debt-to-Income (DTI)</span>
              <span className="form-val-display">{formData.dti}%</span>
            </label>
            <input
              type="range"
              name="dti"
              min="0.0"
              max="45.0"
              step="0.5"
              value={formData.dti}
              onChange={handleChange}
              className="form-range"
            />
            <input
              type="number"
              name="dti"
              step="0.1"
              value={formData.dti}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Monthly Installment */}
          <div className="form-group">
            <label className="form-label">Monthly Installment ($)</label>
            <input
              type="number"
              name="installment"
              step="0.01"
              value={formData.installment}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Employment Length */}
          <div className="form-group">
            <label className="form-label">
              <span>Employment Length</span>
              <span className="form-val-display">{formData.emp_length_int} Years</span>
            </label>
            <input
              type="range"
              name="emp_length_int"
              min="0"
              max="10"
              step="1"
              value={formData.emp_length_int}
              onChange={handleChange}
              className="form-range"
            />
          </div>

          {/* Home Ownership */}
          <div className="form-group">
            <label className="form-label">Home Ownership</label>
            <select
              name="home_ownership"
              value={formData.home_ownership}
              onChange={handleChange}
              className="form-select"
            >
              {homeOptions.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div className="form-group">
            <label className="form-label">Loan Term</label>
            <select
              name="term"
              value={formData.term}
              onChange={handleChange}
              className="form-select"
            >
              {termOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Application Type */}
          <div className="form-group">
            <label className="form-label">Application Type</label>
            <select
              name="application_type"
              value={formData.application_type}
              onChange={handleChange}
              className="form-select"
            >
              {appTypeOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Purpose */}
          <div className="form-group full-width">
            <label className="form-label">Loan Purpose</label>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className="form-select"
            >
              {purposeOptions.map((p) => (
                <option key={p} value={p}>{p.replace(/_/g, " ").toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Analyzing Credit Risk with ML Model...</span>
            </>
          ) : (
            <>
              <span>Predict Loan Default Risk</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
