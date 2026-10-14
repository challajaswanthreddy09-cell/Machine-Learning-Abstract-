/**
 * frontend/src/services/api.js
 * HTTP service layer connecting React UI with FastAPI ML Backend.
 */

const API_BASE_URL = "http://127.0.0.1:8000";

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Health check error:", err);
    throw new Error("Unable to connect to ML Backend. Ensure FastAPI is running on port 8000.");
  }
}

export async function getMetadata() {
  try {
    const res = await fetch(`${API_BASE_URL}/metadata`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Metadata fetch error:", err);
    throw new Error("Failed to load model metadata.");
  }
}

export async function predictLoan(applicantData) {
  try {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(applicantData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server responded with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Prediction API error:", err);
    throw err;
  }
}

export async function getHistory(limit = 20) {
  try {
    const res = await fetch(`${API_BASE_URL}/history?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("History fetch error:", err);
    throw new Error("Unable to retrieve history records from Excel storage.");
  }
}
