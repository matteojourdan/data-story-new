import scanpy as sc
import pandas as pd
import numpy as np

# Load the h5ad file
print("Loading h5ad file...")
adata = sc.read_h5ad(r"C:\Users\Matis Ribadeau Dumas\Downloads\haniffa21.processed.h5ad")

# Load the CSV with cell type scores
print("Loading CSV...")
scores_df = pd.read_csv(r"assets\data\ct_scores_reduced.csv")

# Get unique patient IDs from the CSV
patient_ids = scores_df["patient_id"].tolist()

# Check what columns are available in obs
print("\nAvailable columns in adata.obs:")
print(adata.obs.columns.tolist())

# Extract patient-level metadata from adata.obs
# Adjust column names based on actual h5ad structure
obs_df = adata.obs.copy()

# Common column names - adjust if needed after seeing the output
patient_col = "patient_id"  # or 'patient_id', 'donor_id'
severity_col = "Worst_Clinical_Status"  # or 'Status', 'severity'
days_col = "Days_from_onset"  # or 'days_from_onset', 'onset_days'

# Get unique patient metadata
patient_meta = obs_df.drop_duplicates(subset=[patient_col])[[patient_col, severity_col, days_col]].copy()
patient_meta = patient_meta.rename(columns={patient_col: "patient_id"})

print(f"\nFound {len(patient_meta)} unique patients in h5ad")
print(f"Matching with {len(patient_ids)} patients in CSV")

# Define binning functions
def bin_days(days):
    """Bin days from onset into time bins"""
    if pd.isna(days):
        return None
    # Handle non-numeric values like "Healthy"
    try:
        days = float(days)
    except (ValueError, TypeError):
        return None
    if days <= 6:
        return "0–6"
    elif days <= 10:
        return "7–10"
    elif days <= 14:
        return "11–14"
    elif days <= 21:
        return "15–21"
    else:
        return "22+"

def bin_severity(sev):
    """Bin severity into 3 groups, return None for unknown values"""
    if pd.isna(sev):
        return None
    sev = str(sev).lower()
    if "asymp" in sev or "mild" in sev:
        return "Mild-Asym."
    elif "moderate" in sev:
        return "Moderate"
    elif "severe" in sev or "crit" in sev or "death" in sev:
        return "Severe-Crit."
    else:
        return None  # Ignore values not in our bins

# Apply binning
patient_meta["day_bin"] = patient_meta[days_col].apply(bin_days)
patient_meta["sev_bin"] = patient_meta[severity_col].apply(bin_severity)

# Merge with scores dataframe
merged_df = scores_df.merge(patient_meta[["patient_id", "day_bin", "sev_bin"]], on="patient_id", how="left")

# Remove rows with missing sev_bin (unknown severity values)
merged_df = merged_df.dropna(subset=["sev_bin"])

# Check the result
print("\nMerged data preview:")
print(merged_df[["patient_id", "day_bin", "sev_bin"]].head(10))
print(f"\nPatients with missing day_bin: {merged_df['day_bin'].isna().sum()}")
print(f"Patients with missing sev_bin: {merged_df['sev_bin'].isna().sum()}")

# Save to CSV
output_path = r"assets\data\ct_scores_with_bins.csv"
merged_df.to_csv(output_path, index=False)
print(f"\nSaved to {output_path}")
