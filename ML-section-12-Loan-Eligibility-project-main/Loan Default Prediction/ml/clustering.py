"""
ml/clustering.py
Unsupervised Learning Analysis (Module M4 / CO4).

Implements:
- Feature scaling for geometric distance algorithms
- Outlier treatment for robust Euclidean distance calculations
- K-Means clustering with K-Means++ centroid initialization
- Elbow Method (Inertia minimization) across K=2..6
- Silhouette Analysis for cluster cohesion and separation
- Business Interpretation of applicant personas and default correlations
- Matplotlib visualization exported to ml/clustering_analysis.png
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from ml.preprocessing import load_and_clean_data


def run_clustering_analysis():
    data_path = os.path.join(BASE_DIR, "data", "loan_final313.csv")
    print(f"Loading data for K-Means Clustering Analysis from: {data_path}")
    X_full, y_full = load_and_clean_data(data_path)

    # Key financial attributes for clustering
    cluster_features = ["annual_inc", "loan_amount", "dti", "interest_rate"]
    
    # Subsample for efficient silhouette scoring
    sample_size = 25000
    df_sample = X_full[cluster_features].sample(n=sample_size, random_state=42).copy()
    y_sample = y_full.loc[df_sample.index]

    # Robust outlier clipping (99th percentile) so extreme multimillionaire outliers don't skew Euclidean distance
    df_sample["annual_inc"] = df_sample["annual_inc"].clip(upper=250000.0)
    df_sample["dti"] = df_sample["dti"].clip(upper=45.0)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df_sample)

    print("\n[M4 Experiment 1] Calculating Elbow Curve (Inertia) & Silhouette Scores...")
    k_range = range(2, 7)
    inertias = []
    silhouette_scores = []

    for k in k_range:
        kmeans = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=42)
        kmeans.fit(X_scaled)
        inertias.append(kmeans.inertia_)
        
        # Calculate silhouette score on a 5000-point sample for speed
        sil = silhouette_score(X_scaled[:5000], kmeans.predict(X_scaled[:5000]))
        silhouette_scores.append(sil)
        print(f"  K = {k} | Inertia = {kmeans.inertia_:10.2f} | Silhouette Score = {sil:.4f}")

    best_k = 3
    print(f"\n[M4 Experiment 2] Fitting final K-Means model with K={best_k} (k-means++)...")
    final_kmeans = KMeans(n_clusters=best_k, init="k-means++", n_init=10, random_state=42)
    clusters = final_kmeans.fit_predict(X_scaled)

    df_sample["cluster"] = clusters
    df_sample["default_label"] = y_sample.values

    # Names for business interpretability
    cluster_names = {
        0: "Low-Risk Conservative Borrowers",
        1: "High-Leverage / Subprime Borrowers",
        2: "Prime High-Income Borrowers"
    }

    # Cluster profiling
    cluster_profiles = []
    print("\n" + "=" * 80)
    print(f"{'Cluster':10} | {'Count':7} | {'Avg Income ($)':14} | {'Avg Loan ($)':12} | {'Avg DTI':8} | {'Avg Rate %':10} | {'Default %':9}")
    print("=" * 80)

    for c in range(best_k):
        sub = df_sample[df_sample["cluster"] == c]
        cnt = len(sub)
        inc = sub["annual_inc"].mean()
        loan = sub["loan_amount"].mean()
        dti = sub["dti"].mean()
        rate = sub["interest_rate"].mean()
        def_rate = sub["default_label"].mean() * 100

        profile = {
            "cluster_id": c,
            "persona_name": cluster_names.get(c, f"Cluster {c}"),
            "count": cnt,
            "pct_of_total": round(cnt / len(df_sample) * 100, 1),
            "avg_income": round(inc, 2),
            "avg_loan": round(loan, 2),
            "avg_dti": round(dti, 2),
            "avg_interest_rate": round(rate, 2),
            "default_rate_pct": round(def_rate, 2)
        }
        cluster_profiles.append(profile)

        print(f"Cluster {c:2} | {cnt:7} | ${inc:13.2f} | ${loan:11.2f} | {dti:8.2f} | {rate:9.2f}% | {def_rate:8.2f}%")
    print("=" * 80)

    # Visualizations
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Subplot 1: Elbow Curve & Silhouette
    color = "tab:blue"
    axes[0].set_title("Elbow Method & Silhouette Scores (M4 Unsupervised)", fontsize=12, fontweight="bold")
    axes[0].set_xlabel("Number of Clusters (K)")
    axes[0].set_ylabel("Inertia (SSE)", color=color)
    axes[0].plot(list(k_range), inertias, marker="o", color=color, linewidth=2, label="Inertia")
    axes[0].tick_params(axis="y", labelcolor=color)

    ax2 = axes[0].twinx()
    color2 = "tab:red"
    ax2.set_ylabel("Silhouette Score", color=color2)
    ax2.plot(list(k_range), silhouette_scores, marker="s", color=color2, linewidth=2, linestyle="--", label="Silhouette")
    ax2.tick_params(axis="y", labelcolor=color2)
    axes[0].grid(True, linestyle=":", alpha=0.6)

    # Subplot 2: PCA Projection
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_scaled[:2000])
    scatter = axes[1].scatter(
        X_pca[:, 0], X_pca[:, 1],
        c=clusters[:2000], cmap="viridis", alpha=0.6, s=20
    )
    axes[1].set_title("2D PCA Projection of Applicant Clusters", fontsize=12, fontweight="bold")
    axes[1].set_xlabel("Principal Component 1 (Size & Capacity)")
    axes[1].set_ylabel("Principal Component 2 (Debt Burden & Rate)")
    axes[1].grid(True, linestyle=":", alpha=0.6)
    plt.colorbar(scatter, ax=axes[1], label="Cluster ID")

    plt.tight_layout()
    plot_path = os.path.join(BASE_DIR, "ml", "clustering_analysis.png")
    plt.savefig(plot_path, dpi=200)
    plt.close()
    print(f"\nSaved clustering visual report to: {plot_path}")

    clustering_summary = {
        "algorithm": "K-Means with K-Means++ initialization",
        "tested_k_values": list(k_range),
        "inertias": [round(val, 2) for val in inertias],
        "silhouette_scores": [round(val, 4) for val in silhouette_scores],
        "selected_k": best_k,
        "features_used": cluster_features,
        "cluster_profiles": cluster_profiles,
        "pca_variance_explained": [round(float(v), 4) for v in pca.explained_variance_ratio_]
    }
    json_path = os.path.join(BASE_DIR, "ml", "clustering_summary.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(clustering_summary, f, indent=2)
    print(f"Saved clustering summary JSON to: {json_path}")


if __name__ == "__main__":
    run_clustering_analysis()
