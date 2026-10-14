import React from "react";
import { ShieldCheck, Activity, Database } from "lucide-react";

export default function Navbar({ backendStatus }) {
  return (
    <nav className="navbar">
      <div className="nav-content">
        <a href="#home" className="nav-brand">
          <div className="nav-logo-icon">
            <ShieldCheck size={22} />
          </div>
          <span>LoanGuard<span style={{ color: "#38bdf8" }}> AI</span></span>
        </a>

        <div className="nav-links">
          <a href="#home" className="nav-link">Home</a>
          <a href="#predict" className="nav-link">Loan Prediction</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#insights" className="nav-link">Model Insights</a>
          <a href="#history" className="nav-link">History</a>

          <div className={`status-pill ${backendStatus.healthy ? "" : "offline"}`}>
            <span className="pulse-dot"></span>
            <span>{backendStatus.healthy ? "ML Engine Online" : "Backend Offline"}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
