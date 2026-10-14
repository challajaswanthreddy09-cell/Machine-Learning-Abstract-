import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LoanForm from "./components/LoanForm";
import PredictionResult from "./components/PredictionResult";
import RiskCard from "./components/RiskCard";
import StatisticsCard from "./components/StatisticsCard";
import PredictionHistory from "./components/PredictionHistory";
import Footer from "./components/Footer";
import { checkHealth, getMetadata, predictLoan, getHistory } from "./services/api";
import { ArrowDown, AlertCircle } from "lucide-react";
import "./App.css";

export default function App() {
  const [backendStatus, setBackendStatus] = useState({ healthy: false, modelName: "" });
  const [metadata, setMetadata] = useState(null);
  const [clustering, setClustering] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Initialize data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setErrorMessage(null);
      const health = await checkHealth();
      setBackendStatus({ healthy: health.status === "healthy", modelName: health.model_name });

      const metaRes = await getMetadata();
      setMetadata(metaRes.metadata);
      setClustering(metaRes.clustering);

      await fetchHistory();
    } catch (err) {
      console.warn("Backend not yet connected:", err);
      setBackendStatus({ healthy: false, modelName: "" });
      setErrorMessage("FastAPI backend is unreachable at http://127.0.0.1:8000. Start the server with `uvicorn backend.main:app`.");
    }
  };

  const fetchHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const histData = await getHistory(50);
      setHistory(histData.history || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handlePredictSubmit = async (formData) => {
    setIsPredicting(true);
    setErrorMessage(null);
    try {
      const res = await predictLoan(formData);
      setPredictionResult(res);
      // Refresh history to show newly appended Excel row immediately
      await fetchHistory();
    } catch (err) {
      setErrorMessage(err.message || "Failed to generate prediction. Check backend status.");
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar backendStatus={backendStatus} />

      {/* HERO SECTION */}
      <header id="home" className="hero-section">
        <div className="hero-badge">
          <span>Enterprise ML Credit Risk Scoring</span>
        </div>
        <h1 className="hero-title">AI-Powered Loan Default Prediction</h1>
        <p className="hero-subtitle">
          Evaluate borrower risk profiles, forecast loan default probabilities, and automate underwriting decisions using verified gradient boosted machine learning models.
        </p>
        <a href="#predict" className="hero-cta-btn">
          <span>Check Loan Eligibility</span>
          <ArrowDown size={18} />
        </a>
      </header>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto 2rem",
          padding: "1rem 1.5rem",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          borderRadius: "12px",
          color: "#fca5a5",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.95rem"
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* PREDICTION WORKSPACE */}
        <section id="predict" style={{ marginBottom: "5rem" }}>
          <div className="section-header">
            <div className="section-tag">Interactive Risk Assessment</div>
            <h2 className="section-title">Loan Eligibility Predictor</h2>
            <p className="section-desc">
              Enter applicant parameters to evaluate against the trained <strong>{backendStatus.modelName || "XGBoost"}</strong> model pipeline.
            </p>
          </div>

          <div className="prediction-workspace">
            <LoanForm
              metadata={metadata}
              onSubmit={handlePredictSubmit}
              isLoading={isPredicting}
            />

            <PredictionResult result={predictionResult} />
          </div>
        </section>

        {/* HOW IT WORKS LIFECYCLE */}
        <RiskCard />

        {/* MODEL INSIGHTS & BENCHMARKING */}
        <StatisticsCard metadata={metadata} clustering={clustering} />

        {/* PERSISTENT EXCEL HISTORY */}
        <PredictionHistory
          history={history}
          onRefresh={fetchHistory}
          isLoading={isHistoryLoading}
        />
      </main>

      <Footer />
    </div>
  );
}
