import React from "react";
import { UserCheck, Sliders, Cpu, Gauge, ShieldCheck, CheckCircle } from "lucide-react";

export default function RiskCard() {
  const steps = [
    {
      num: "01",
      icon: <UserCheck size={20} />,
      title: "Applicant Profile",
      desc: "Captures income, credit grade, loan request, and DTI at origination time."
    },
    {
      num: "02",
      icon: <Sliders size={20} />,
      title: "Data Pipeline",
      desc: "Cleans data, isolates target leakage, applies Median Imputer & One-Hot Encoding."
    },
    {
      num: "03",
      icon: <Cpu size={20} />,
      title: "ML Estimator",
      desc: "Production XGBoost pipeline estimates non-linear default likelihood."
    },
    {
      num: "04",
      icon: <Gauge size={20} />,
      title: "Default Probability",
      desc: "Calculates calibrated default probability score p ∈ [0, 1]."
    },
    {
      num: "05",
      icon: <ShieldCheck size={20} />,
      title: "Risk Tiering",
      desc: "Categorizes into Low Risk (<35%), Medium Risk (35-60%), or High Risk (≥60%)."
    },
    {
      num: "06",
      icon: <CheckCircle size={20} />,
      title: "Decision & Excel Log",
      desc: "Renders decision and appends record to prediction_history.xlsx."
    }
  ];

  return (
    <section id="how-it-works" style={{ marginBottom: "5rem" }}>
      <div className="section-header">
        <div className="section-tag">Machine Learning Lifecycle</div>
        <h2 className="section-title">How It Works</h2>
        <p className="section-desc">
          Strict training-serving parity: applicant features are transformed and evaluated using the exact saved pipeline.
        </p>
      </div>

      <div className="how-it-works-grid">
        {steps.map((s) => (
          <div key={s.num} className="flow-step-card">
            <div className="step-number">{s.num}</div>
            <div className="step-icon-box">{s.icon}</div>
            <h3 className="step-name">{s.title}</h3>
            <p className="step-desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
