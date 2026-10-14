import React, { useState } from "react";
import { BarChart3, Layers, PieChart, Info } from "lucide-react";

export default function StatisticsCard({ metadata, clustering }) {
  const [activeTab, setActiveTab] = useState("comparison");

  const modelsData = metadata?.evaluation_metrics || {};
  const winningModel = metadata?.model_name || "XGBoost";
  const featureImportances = metadata?.feature_importances || [];
  const clusterProfiles = clustering?.cluster_profiles || [];

  return (
    <section id="insights" style={{ marginBottom: "5rem" }}>
      <div className="section-header">
        <div className="section-tag">Empirical Results</div>
        <h2 className="section-title">Model Insights & Analytics</h2>
        <p className="section-desc">
          Real performance metrics and customer segmentation trained on the <code>loan_final313.csv</code> dataset.
        </p>
      </div>

      <div className="card-glass">
        {/* Navigation Tabs */}
        <div className="insights-tabs">
          <button
            className={`tab-btn ${activeTab === "comparison" ? "active" : ""}`}
            onClick={() => setActiveTab("comparison")}
          >
            <BarChart3 size={16} style={{ display: "inline", marginRight: "6px" }} />
            Supervised Models Comparison (M1-M3)
          </button>
          <button
            className={`tab-btn ${activeTab === "features" ? "active" : ""}`}
            onClick={() => setActiveTab("features")}
          >
            <Layers size={16} style={{ display: "inline", marginRight: "6px" }} />
            Feature Importance (M3)
          </button>
          <button
            className={`tab-btn ${activeTab === "clusters" ? "active" : ""}`}
            onClick={() => setActiveTab("clusters")}
          >
            <PieChart size={16} style={{ display: "inline", marginRight: "6px" }} />
            K-Means Applicant Clustering (M4)
          </button>
        </div>

        {/* TAB 1: MODEL COMPARISON */}
        {activeTab === "comparison" && (
          <div>
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              <Info size={16} color="#38bdf8" />
              <span>
                Selected Model: <strong style={{ color: "#fff" }}>{winningModel}</strong>. Selected due to superior ROC-AUC and default recall on unseen test data.
              </span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model Architecture</th>
                    <th>Accuracy</th>
                    <th>Precision</th>
                    <th>Recall (Defaults)</th>
                    <th>F1-Score</th>
                    <th>ROC-AUC</th>
                    <th>Fit Time</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(modelsData).map(([name, m]) => {
                    const isWinner = name.includes(winningModel);
                    return (
                      <tr key={name} className={isWinner ? "highlighted" : ""}>
                        <td>
                          {name}
                          {isWinner && <span className="winner-pill">BEST</span>}
                        </td>
                        <td>{(m.accuracy * 100).toFixed(2)}%</td>
                        <td>{(m.precision * 100).toFixed(2)}%</td>
                        <td>{(m.recall * 100).toFixed(2)}%</td>
                        <td>{m.f1_score.toFixed(4)}</td>
                        <td>
                          <strong style={{ color: isWinner ? "#38bdf8" : "inherit" }}>
                            {m.roc_auc.toFixed(4)}
                          </strong>
                        </td>
                        <td>{m.fit_time_seconds}s</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: FEATURE IMPORTANCE */}
        {activeTab === "features" && (
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Gini importance scores extracted from the winning <strong>{winningModel}</strong> model after one-hot encoding.
            </p>

            <div className="feat-imp-list">
              {featureImportances.map((item, idx) => {
                const maxImp = featureImportances[0]?.importance || 1;
                const pct = (item.importance / maxImp) * 100;
                return (
                  <div key={idx} className="feat-imp-item">
                    <span className="feat-imp-name" title={item.feature}>
                      {idx + 1}. {item.feature.replace(/_/g, " ")}
                    </span>
                    <div className="feat-imp-bar-track">
                      <div className="feat-imp-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="feat-imp-score">{(item.importance * 100).toFixed(2)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CLUSTERING */}
        {activeTab === "clusters" && (
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              K-Means++ unsupervised segmentation of applicant financial behaviors (Inertia minimization with K=3).
            </p>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cluster Persona</th>
                    <th>Applicants</th>
                    <th>Avg Annual Income</th>
                    <th>Avg Loan Request</th>
                    <th>Avg DTI</th>
                    <th>Avg Rate</th>
                    <th>Observed Default Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {clusterProfiles.map((c) => (
                    <tr key={c.cluster_id}>
                      <td>
                        <strong style={{ color: "#fff" }}>
                          {c.persona_name || `Cluster ${c.cluster_id}`}
                        </strong>
                      </td>
                      <td>{c.count.toLocaleString()} ({c.pct_of_total}%)</td>
                      <td>${c.avg_income.toLocaleString()}</td>
                      <td>${c.avg_loan.toLocaleString()}</td>
                      <td>{c.avg_dti}</td>
                      <td>{c.avg_interest_rate}%</td>
                      <td>
                        <span style={{
                          color: c.default_rate_pct > 9 ? "var(--risk-high)" : "var(--risk-low)",
                          fontWeight: 700
                        }}>
                          {c.default_rate_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
