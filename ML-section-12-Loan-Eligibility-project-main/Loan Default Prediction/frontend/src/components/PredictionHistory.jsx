import React from "react";
import { FileSpreadsheet, RefreshCw } from "lucide-react";

export default function PredictionHistory({ history, onRefresh, isLoading }) {
  return (
    <section id="history" className="history-section" style={{ marginBottom: "5rem" }}>
      <div className="section-header">
        <div className="section-tag">Persistent Excel Storage</div>
        <h2 className="section-title">Prediction History Log</h2>
        <p className="section-desc">
          Live records read from <code>data/prediction_history.xlsx</code>. Every completed eligibility check is automatically appended.
        </p>
      </div>

      <div className="card-glass">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            <FileSpreadsheet size={18} color="#10b981" />
            <span>Total Logged Records in Excel: <strong style={{ color: "#fff" }}>{history.length}</strong></span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="preset-btn"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh Excel Log</span>
          </button>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-dim)" }}>
            No prediction records found yet. Submit an application above to create the first entry.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Loan Amount</th>
                  <th>Annual Income</th>
                  <th>Grade</th>
                  <th>DTI</th>
                  <th>Default Probability</th>
                  <th>Risk Tier</th>
                  <th>Decision</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, idx) => {
                  const risk = row["Risk Level"] || "Low";
                  const riskColor = risk === "Low" ? "var(--risk-low)" : risk === "Medium" ? "var(--risk-med)" : "var(--risk-high)";
                  return (
                    <tr key={idx}>
                      <td style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>{row["Timestamp"]}</td>
                      <td>${row["Loan Amount ($)"]?.toLocaleString()}</td>
                      <td>${row["Annual Income ($)"]?.toLocaleString()}</td>
                      <td>Grade {row["Credit Grade"]}</td>
                      <td>{row["DTI Ratio"]}%</td>
                      <td>
                        <strong style={{ color: riskColor }}>
                          {row["Default Probability"]}
                        </strong>
                      </td>
                      <td>
                        <span style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: `${riskColor}22`,
                          color: riskColor,
                          border: `1px solid ${riskColor}44`
                        }}>
                          {risk}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{row["Eligibility Decision"]}</td>
                      <td style={{ color: "var(--text-dim)" }}>{row["Model Used"]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
