# LoanGuard AI — Loan Default Prediction System

A complete end-to-end Machine Learning web application and credit risk analysis engine developed for a College Machine Learning curriculum covering Modules **M1 to M4 (CO1 to CO4)**.

The system analyzes applicant credit profiles, rigorously eliminates post-origination data leakage, trains and benchmarks multiple classification algorithms (Logistic Regression, Decision Trees, Random Forest, XGBoost), conducts unsupervised applicant segmentation via K-Means clustering, serves inferences through a high-performance **FastAPI** REST backend, provides an interactive fintech dashboard built with **React and Vite**, and automatically persists every transaction into an **Excel workbook** (`data/prediction_history.xlsx`).

---

## 1. Project Overview
In retail banking and peer-to-peer lending, identifying borrowers likely to default prior to loan issuance is essential for managing credit portfolio risk. **LoanGuard AI** provides automated underwriting support by estimating the default probability of an applicant based solely on parameters available at the moment of loan origination.

- **Primary Goal**: Distinguish high-risk loan applicants from prime borrowers using machine learning rather than simplistic rule-based heuristics.
- **Dataset**: Lending Club loan data (`loan_final313.csv`, 887,379 historical records).
- **Architecture**: Decoupled Client-Server architecture (React Vite SPA ↔ FastAPI REST Service ↔ Scikit-Learn/XGBoost Pipeline ↔ Excel Ledger).

---

## 2. Educational & Course Objectives (M1–M4)

| Module | Core Machine Learning Concepts Demonstrated |
| :--- | :--- |
| **M1: ML Fundamentals** | Supervised classification lifecycle, training vs. prediction boundary, preprocessing pipeline encapsulation, model serialization (`joblib`), production inference via REST API. |
| **M2: Linear Models & Preprocessing** | Logistic Regression, sigmoid probability mapping, odds ratios, categorical one-hot encoding, missing value median imputation, feature standard scaling (`StandardScaler`), stratified train/test splitting. |
| **M3: Tree Ensembles & Boosting** | Decision Trees (Gini impurity / information gain), Random Forest (bagging, bootstrap aggregation, feature subsampling), XGBoost (gradient boosted trees, log-loss objective, scale_pos_weight for class imbalance), Gini feature importance analysis. |
| **M4: Unsupervised Learning** | K-Means clustering, K-Means++ centroid initialization, Elbow Method (Inertia minimization), Silhouette score evaluation, PCA 2D cluster projection, customer financial behavior persona profiling. |

*(Note: In accordance with course scope, production DevOps/MLOps tools such as Docker, Kubernetes, MLflow, or DVC were intentionally omitted to maintain clarity for academic review).*

---

## 3. Dataset Description
- **File**: `data/loan_final313.csv`
- **Total Records**: 887,379 rows
- **Total Raw Columns**: 30 columns
- **Domain**: Historical peer-to-peer personal and commercial loans.
- **Attributes Available**: Loan amounts, stated income, interest rates, debt-to-income (DTI) ratios, credit grades, employment history, home ownership, repayment terms, and loan purposes.

---

## 4. Target Variable Analysis
Through empirical inspection of the raw dataset, the target column was identified:
- **Column**: `loan_condition` paired with `loan_condition_cat`.
  - `0`: **Good Loan** (819,950 records / **92.4%**) — Loans that were fully paid off or actively in good standing.
  - `1`: **Bad Loan / Default** (67,429 records / **7.6%**) — Loans charged off, defaulted, or severely delinquent.
- **Class Imbalance**: Approximately **12.16 : 1** (Good to Bad).
- **Imbalance Handling Strategy**:
  - Logistic Regression / Trees: `class_weight='balanced'`.
  - XGBoost: `scale_pos_weight = 12.16`.
  - Threshold tuning: Calibrated approval cutoff at probability $p = 0.35$.

---

## 5. Data Leakage Prevention (Crucial Requirement)
Credit risk models must strictly use information accessible **before** loan approval. Including features that develop during or after the loan lifecycle produces artificially inflated, invalid performance.

The following columns were systematically removed:
1. `recoveries`: Post-charge-off collection amounts. (In the dataset, 100% of Good Loans have exactly $0.00 in recoveries, whereas Bad Loans average $604.30. Retaining this causes blatant 100% target leakage).
2. `total_pymnt`: Cumulative payments made over the life of the loan.
3. `total_rec_prncp`: Cumulative principal repaid to date.
4. `final_d`: Date on which the loan concluded or defaulted.
5. `issue_d` & `year`: Administrative issuance timestamps.
6. `id`: Non-predictive unique applicant identifier.
7. `*_cat` columns: Integer-encoded duplicates (`grade_cat`, `term_cat`, etc.) dropped in favor of raw semantic strings encoded via scikit-learn's `OneHotEncoder`.
8. `income_category` & `interest_payments`: Redundant coarse categorizations of continuous variables.

---

## 6. Selected Features & Preprocessing Pipeline
The clean feature matrix consists of 11 variables available at origination:

### Numerical Features (6):
- `loan_amount`: Total principal requested ($500 – $35,000).
- `annual_inc`: Verifiable annual applicant income.
- `interest_rate`: Fixed annual interest rate percentage.
- `dti`: Debt-to-Income percentage ratio.
- `installment`: Agreed monthly payment amount.
- `emp_length_int`: Completed years of employment (0 to 10).

### Categorical Features (5):
- `grade`: Lender risk tier (`A`, `B`, `C`, `D`, `E`, `F`, `G`).
- `home_ownership`: Residential status (`MORTGAGE`, `RENT`, `OWN`, `OTHER`).
- `term`: Loan repayment period (`36 months`, `60 months`).
- `purpose`: Stated loan intention (14 categories, e.g., `debt_consolidation`, `credit_card`, `small_business`).
- `application_type`: `INDIVIDUAL` or `JOINT`.

### Preprocessing Architecture:
- Built using Scikit-Learn `ColumnTransformer` and `Pipeline`:
  - **Numerical Pipeline**: `SimpleImputer(strategy='median')` followed by optional `StandardScaler()`.
  - **Categorical Pipeline**: `SimpleImputer(strategy='most_frequent')` followed by `OneHotEncoder(handle_unknown='ignore', sparse_output=False)`.
- Guarantees **100% parity** between offline training and live real-time API prediction.

---

## 7. Model Training & Empirical Comparison
Models were evaluated on a stratified test holdout of 30,000 records from the Lending Club dataset:

| Model Architecture | Accuracy | Precision | Recall (Defaults) | F1-Score | ROC-AUC | Training Time |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** (M2) | 64.74% | 13.35% | 66.27% | 0.2222 | 0.7051 | 1.22s |
| **Decision Tree** (M3) | 64.00% | 13.45% | 68.77% | 0.2250 | 0.7191 | 1.25s |
| **Random Forest** (M3) | 63.31% | 13.30% | 69.34% | 0.2231 | 0.7127 | 2.36s |
| **XGBoost Classifier** (M3) ★ | **63.97%** | **13.67%** | **70.39%** | **0.2290** | **0.7299** | **1.21s** |

### Why XGBoost was Selected:
In loan default prediction, **ROC-AUC** and **Recall on the minority default class** are the decisive metrics. Detecting as many actual defaulters as possible minimizes severe financial losses. **XGBoost achieved the highest ROC-AUC (0.7299)** and the highest **default detection rate (70.39%)**, correctly identifying 1,605 out of 2,280 actual defaults in the test holdout.

---

## 8. Feature Importance
Gini impurity gain extracted from the winning XGBoost pipeline:
1. `interest_rate` (15.06%) — Higher interest rates directly reflect risk premiums assigned by underwriters.
2. `grade_C`, `grade_A`, `grade_B` (22.72% combined) — External credit scoring grade tiers.
3. `term_36 months` (5.02%) — Loan duration impact on liquidity.
4. `purpose_small_business` (4.21%) — Commercial use cases historically exhibit elevated default volatility.
5. `home_ownership_RENT` vs `MORTGAGE` (7.35% combined) — Home stability correlation.

---

## 9. M4 Unsupervised Analysis: K-Means Clustering
Implemented in `ml/clustering.py` using applicant financial variables (`annual_inc`, `loan_amount`, `dti`, `interest_rate`):
- Centroid Initialization: **K-Means++**
- Optimal Clusters: $K = 3$ (Evaluated across $K=2..6$ via Elbow Method & Silhouette Scores).

### Discovered Customer Personas:
1. **Cluster 0: Low-Risk Conservative Borrowers (42.6% of sample)**
   - Avg Income: $62,295 | Avg Loan: $10,214 | Avg DTI: 13.30 | Avg Rate: 11.28% | **Default Rate: 5.60%**
2. **Cluster 1: High-Debt / Subprime Borrowers (34.8% of sample)**
   - Avg Income: $53,693 | Avg Loan: $13,287 | Avg DTI: 25.79 | Avg Rate: 15.65% | **Default Rate: 10.49%** *(Nearly 2x default incidence)*
3. **Cluster 2: Prime High-Income Borrowers (22.6% of sample)**
   - Avg Income: $123,292 | Avg Loan: $25,525 | Avg DTI: 15.63 | Avg Rate: 13.34% | **Default Rate: 6.78%**

---

## 10. Eligibility Decision Logic & Risk Tiers
The model outputs a continuous calibrated default probability $p \in [0, 1]$:
- **Low Risk ($p < 0.35$)**: `Eligible for Loan` — Strong financial standing.
- **Medium Risk ($0.35 \le p < 0.60$)**: `Eligible for Loan (Conditional Review)` — Moderate risk; secondary verification recommended.
- **High Risk ($p \ge 0.60$)**: `Not Eligible for Loan` — Probability of non-repayment exceeds acceptable risk limits.

---

## 11. Persistent Excel Logging
Every prediction completed via the API or Web UI is thread-safely recorded into:
`data/prediction_history.xlsx`

- **Preservation Policy**: Existing records are **never overwritten**. New predictions are appended row by row.
- **Logged Columns**: Timestamp, Loan Amount, Annual Income, Interest Rate, DTI, Monthly Installment, Employment Length, Credit Grade, Home Ownership, Term, Purpose, Application Type, Default Probability, Risk Level, Eligibility Decision, and Model Used.
- **History Viewer**: The React frontend and the `GET /history` endpoint read directly from this Excel file in real time.

---

## 12. Project Folder Structure

```text
Loan Default Prediction/
│
├── data/
│   ├── loan_final313.csv               # Primary raw dataset
│   └── prediction_history.xlsx         # Persistent Excel transaction log
│
├── ml/
│   ├── notebooks/
│   │   └── loan_analysis.ipynb         # Full M1-M4 interactive analysis notebook
│   ├── preprocessing.py                # Reusable pipeline and leakage cleaning
│   ├── train.py                        # Model training, comparison, and export
│   ├── evaluate.py                     # Standalone evaluation & confusion matrix
│   ├── clustering.py                   # M4 K-Means++ clustering & Elbow analysis
│   ├── clustering_analysis.png         # Generated Elbow and PCA cluster plots
│   ├── clustering_summary.json         # Exported clustering profiles
│   ├── model_metadata.json             # Serialized schema, metrics, and parameters
│   └── models/
│       └── loan_default_model.joblib   # Serialized production pipeline
│
├── backend/
│   ├── main.py                         # FastAPI application and REST endpoints
│   ├── prediction_service.py           # Pipeline loader and openpyxl writer
│   ├── requirements.txt                # Python dependencies
│   └── __init__.py
│
├── frontend/
│   ├── package.json                    # React & Vite dependencies
│   ├── vite.config.js                  # Vite build configuration
│   ├── index.html                      # HTML entrypoint
│   └── src/
│       ├── main.jsx                    # React bootstrap
│       ├── App.jsx                     # Application layout and state
│       ├── App.css                     # Custom FinTech dark theme styling
│       ├── index.css                   # CSS design variables and resets
│       ├── components/
│       │   ├── Navbar.jsx              # Navigation and live health indicator
│       │   ├── LoanForm.jsx            # Dynamic loan application form
│       │   ├── PredictionResult.jsx    # Visual risk gauge & decision card
│       │   ├── RiskCard.jsx            # 6-step ML lifecycle flow
│       │   ├── StatisticsCard.jsx      # Metrics table, feature importance, clusters
│       │   ├── PredictionHistory.jsx   # Live Excel history table
│       │   └── Footer.jsx              # Academic disclaimer & metadata
│       └── services/
│           └── api.js                  # Frontend HTTP client (fetch)
│
├── README.md                           # Comprehensive documentation
└── .gitignore                          # Excludes venv, node_modules, cache
```

---

## 13. Installation & How to Run in VS Code

### Prerequisites:
- **Python 3.10+** (Tested on Python 3.12 and Python 3.14)
- **Node.js v18+** and **npm**

### Step 1: Open VS Code
Open the project root folder in VS Code:
```bash
cd "C:\Users\Sidhartha\OneDrive\Machine Learning project\Loan Default Prediction"
```

### Step 2: Set Up Python Backend (Terminal 1)
Open a new terminal in VS Code:
```powershell
# 1. Install backend requirements
pip install -r backend/requirements.txt

# 2. (Optional) Re-train the models if you want to regenerate artifacts
python ml/train.py

# 3. (Optional) Run the M4 K-Means clustering analysis
python ml/clustering.py

# 4. Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

### Step 3: Set Up React Frontend (Terminal 2)
Open a second terminal split in VS Code:
```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node dependencies (if not already installed)
npm install

# 3. Launch Vite dev server
npm run dev
```
Open your browser and navigate to the displayed Vite URL:
👉 **`http://localhost:5173`**

---

## 14. Example Prediction Workflow

1. Navigate to `http://localhost:5173`.
2. Notice the live status badge shows **"ML Engine Online"**.
3. Choose one of the sample test presets (e.g. **Prime**, **Moderate**, or **Subprime**) or input custom values.
4. Click **"Predict Loan Default Risk"**.
5. The result card displays:
   - **Decision**: `Eligible for Loan` or `Not Eligible for Loan`
   - **Default Probability**: e.g., `15.13%`
   - **Risk Tier**: `Low`, `Medium`, or `High`
   - **Model Used**: `XGBoost`
6. Scroll down to the **Prediction History Log** section to verify that the check was appended into `data/prediction_history.xlsx`.

---

## 15. Academic Disclaimer & Limitations
- **Educational Scope**: This project is developed strictly for academic demonstration of Machine Learning concepts (M1–M4). It does not constitute commercial banking or credit underwriting advice.
- **Data Limitations**: The underlying historical data reflects macroeconomic lending market conditions between 2007 and 2015.