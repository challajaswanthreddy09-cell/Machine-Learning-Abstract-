import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <ShieldCheck size={18} color="#38bdf8" />
        <span style={{ fontWeight: 700, color: "#fff" }}>LoanGuard AI — College Machine Learning Project</span>
      </div>
      <div>Modules M1–M4: Supervised Classification &amp; Unsupervised Customer Segmentation</div>
      <p className="footer-disclaimer">
        <strong>Disclaimer:</strong> This is an educational ML-based prediction system and not an official banking or financial approval decision. All metrics, predictions, and segmentation results are derived from empirical modeling on historical loan data.
      </p>
    </footer>
  );
}
