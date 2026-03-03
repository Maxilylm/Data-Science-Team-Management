"""
Feature engineering pipeline for the Titanic dataset.

Pipeline steps
--------------
1. Load raw data
2. Drop low-signal / high-leakage columns
3. Engineer domain-informed features (BEFORE splitting to keep code clean;
   all features are derived from raw inputs only – no target information used)
4. Split into train / test  ← split happens HERE, before any fitting
5. Build sklearn ColumnTransformer (imputation + encoding + scaling)
6. Fit on train, transform both splits   ← NO leakage: fit on train only
7. Add interaction features (post-transform, train-fit only)
8. Save processed splits to data/processed/

Data-leakage checklist
----------------------
[x] Split BEFORE fitting any transformer
[x] fit_transform() only on training data
[x] transform() (not fit_transform) on test data
[x] Target column excluded from all features
[x] No future/external information used
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split

from src.ml_utils import load_eda_report

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

RAW_DATA_PATH = "Titanic-Dataset.csv"
OUTPUT_DIR = Path("data/processed")
TARGET_COL = "Survived"
TEST_SIZE = 0.2
RANDOM_STATE = 42

# Columns to drop before modelling:
#   - PassengerId  → arbitrary identifier, no signal
#   - Name         → free text (title is extracted as a feature below)
#   - Ticket       → high-cardinality text, hard to generalise
#   - Cabin        → >77 % missing; deck letter extracted where available
COLS_TO_DROP = ["PassengerId", "Name", "Ticket", "Cabin"]


# ---------------------------------------------------------------------------
# Step 1 – Load raw data
# ---------------------------------------------------------------------------

def load_raw(path: str = RAW_DATA_PATH) -> pd.DataFrame:
    """Load the raw CSV and return a DataFrame."""
    df = pd.read_csv(path)
    print(f"[load] Loaded {df.shape[0]} rows × {df.shape[1]} columns")

    eda = load_eda_report()
    if eda:
        print(f"[load] Found EDA report – {eda['shape']['rows']} rows, "
              f"{len(eda.get('quality_issues', []))} quality issues noted")

    return df


# ---------------------------------------------------------------------------
# Step 2 – Feature engineering (raw → enriched, NO fitting)
# ---------------------------------------------------------------------------

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create domain-informed features from raw columns.

    All transformations use only the row's own values (no aggregation across
    rows that would cause leakage when applied to the test set independently).
    """
    df = df.copy()

    # --- Title extracted from Name (strong social-status signal) ------------
    df["Title"] = df["Name"].str.extract(r",\s*([^\.]+)\.", expand=False).str.strip()
    # Consolidate rare titles
    common_titles = {"Mr", "Miss", "Mrs", "Master"}
    df["Title"] = df["Title"].apply(lambda t: t if t in common_titles else "Rare")

    # --- Cabin deck (first letter of Cabin, 'Unknown' when missing) ----------
    df["Deck"] = df["Cabin"].str[0].fillna("Unknown")

    # --- Family size ---------------------------------------------------------
    df["FamilySize"] = df["SibSp"] + df["Parch"] + 1   # self included

    # --- Is the passenger travelling alone? ----------------------------------
    # Kept as float64 so it routes through the NUMERICAL pipeline and is
    # accessible as "num__IsAlone" for interaction features.
    df["IsAlone"] = (df["FamilySize"] == 1).astype(float)

    # --- Fare per person (avoids large family fares inflating individual fare)
    df["FarePerPerson"] = df["Fare"] / df["FamilySize"]

    # --- Age band (ordinal bucket, imputed later via pipeline) ---------------
    # We keep Age as numeric so the pipeline handles the ~20 % missings.
    # AgeBand is a secondary view useful for interaction features.
    df["AgeBand"] = pd.cut(
        df["Age"],
        bins=[0, 12, 18, 35, 60, 120],
        labels=["Child", "Teen", "YoungAdult", "Adult", "Senior"],
    ).astype(str).replace("nan", "Unknown")

    # Drop raw columns we won't use further
    df = df.drop(columns=COLS_TO_DROP, errors="ignore")

    print(f"[engineer] Shape after feature engineering: {df.shape}")
    return df


# ---------------------------------------------------------------------------
# Step 3 – Train / test split  (BEFORE any fitting)
# ---------------------------------------------------------------------------

def split_data(
    df: pd.DataFrame,
    target_col: str = TARGET_COL,
    test_size: float = TEST_SIZE,
    random_state: int = RANDOM_STATE,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Separate features from target and create stratified train/test splits.

    Splitting happens BEFORE any transformer is fitted to prevent data leakage.
    """
    X = df.drop(columns=[target_col])
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,          # preserve class balance
    )

    print(f"[split] Train: {X_train.shape[0]} rows | Test: {X_test.shape[0]} rows")
    print(f"[split] Survival rate – train: {y_train.mean():.3f} | test: {y_test.mean():.3f}")
    return X_train, X_test, y_train, y_test


# ---------------------------------------------------------------------------
# Step 4 – Build preprocessing pipeline
# ---------------------------------------------------------------------------

def build_pipeline(
    numerical_cols: list[str],
    categorical_cols: list[str],
) -> ColumnTransformer:
    """
    Construct a ColumnTransformer that handles:
      • Numerical: median imputation → StandardScaler
      • Categorical: most-frequent imputation → OneHotEncoder
    """
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        (
            "encoder",
            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
        ),
    ])

    transformers = []
    if numerical_cols:
        transformers.append(("num", num_pipeline, numerical_cols))
    if categorical_cols:
        transformers.append(("cat", cat_pipeline, categorical_cols))

    return ColumnTransformer(transformers=transformers, remainder="drop")


def identify_column_types(
    X: pd.DataFrame,
    categorical_threshold: int = 15,
) -> tuple[list[str], list[str]]:
    """
    Heuristically separate numerical and categorical feature columns.

    Integer columns with few unique values are treated as categorical.
    """
    numerical, categorical = [], []
    for col in X.columns:
        if pd.api.types.is_numeric_dtype(X[col]):
            n_unique = X[col].nunique()
            if n_unique <= categorical_threshold and n_unique < len(X) * 0.05:
                categorical.append(col)
            else:
                numerical.append(col)
        else:
            categorical.append(col)

    print(f"[types] Numerical ({len(numerical)}): {numerical}")
    print(f"[types] Categorical ({len(categorical)}): {categorical}")
    return numerical, categorical


# ---------------------------------------------------------------------------
# Step 5 – Interaction features (post-transform, train-statistics only)
# ---------------------------------------------------------------------------

def add_interaction_features(
    X_arr: np.ndarray,
    feature_names: list[str],
) -> tuple[np.ndarray, list[str]]:
    """
    Add hand-crafted interaction columns to an already-transformed array.

    Only indices derived from the TRAINING feature names are used, so no
    additional fitting is required and the function is safe to apply to both
    train and test arrays using the same indices.

    Interactions added
    ------------------
    • Pclass × FarePerPerson  – wealth proxy
    • IsAlone × Age           – lone-traveller age effect
    """
    X_df = pd.DataFrame(X_arr, columns=feature_names)

    interactions: list[tuple[str, str]] = [
        ("num__Pclass", "num__FarePerPerson"),
        ("num__IsAlone", "num__Age"),
    ]
    new_names = list(feature_names)

    for col_a, col_b in interactions:
        if col_a in X_df.columns and col_b in X_df.columns:
            new_col = f"interact__{col_a}_x_{col_b}"
            X_df[new_col] = X_df[col_a] * X_df[col_b]
            new_names.append(new_col)
            print(f"[interact] Added {new_col}")
        else:
            print(f"[interact] Skipped {col_a} × {col_b} – column not found")

    return X_df.values, new_names


# ---------------------------------------------------------------------------
# Step 6 – Save processed data
# ---------------------------------------------------------------------------

def save_splits(
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: pd.Series,
    y_test: pd.Series,
    feature_names: list[str],
    output_dir: Path = OUTPUT_DIR,
) -> None:
    """Persist train/test splits to CSV files."""
    output_dir.mkdir(parents=True, exist_ok=True)

    train_df = pd.DataFrame(X_train, columns=feature_names)
    train_df[TARGET_COL] = y_train.values

    test_df = pd.DataFrame(X_test, columns=feature_names)
    test_df[TARGET_COL] = y_test.values

    train_path = output_dir / "train.csv"
    test_path = output_dir / "test.csv"

    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)

    print(f"[save] Train → {train_path}  ({train_df.shape})")
    print(f"[save] Test  → {test_path}  ({test_df.shape})")


# ---------------------------------------------------------------------------
# Main pipeline entry point
# ---------------------------------------------------------------------------

def run_pipeline(
    raw_path: str = RAW_DATA_PATH,
    output_dir: Path = OUTPUT_DIR,
) -> dict:
    """
    Execute the full preprocessing pipeline and return metadata.

    Returns
    -------
    dict with keys: feature_names, n_train, n_test, preprocessor
    """
    print("=" * 60)
    print("Feature Engineering Pipeline – Titanic")
    print("=" * 60)

    # 1. Load
    df = load_raw(raw_path)

    # 2. Engineer features (no fitting – row-level transforms only)
    df = engineer_features(df)

    # 3. Split BEFORE any fitting (anti-leakage)
    X_train, X_test, y_train, y_test = split_data(df)

    # 4. Identify column types from the training set only
    numerical_cols, categorical_cols = identify_column_types(X_train)

    # 5. Build and FIT pipeline on TRAIN only
    preprocessor = build_pipeline(numerical_cols, categorical_cols)
    X_train_arr = preprocessor.fit_transform(X_train)   # fit + transform train
    X_test_arr = preprocessor.transform(X_test)         # transform only (no fit)

    # Derive feature names from the fitted pipeline
    feature_names: list[str] = preprocessor.get_feature_names_out().tolist()
    print(f"[pipeline] Features after encoding: {len(feature_names)}")

    # 6. Add interaction features using train-derived indices
    # Snapshot base names BEFORE the train call mutates feature_names so the
    # test call uses the identical base list (not a fragile slice of the result).
    base_feature_names = list(feature_names)
    X_train_arr, feature_names = add_interaction_features(X_train_arr, base_feature_names)
    X_test_arr, _ = add_interaction_features(X_test_arr, base_feature_names)

    # 7. Save
    save_splits(X_train_arr, X_test_arr, y_train, y_test, feature_names, output_dir)

    print("\n[done] Pipeline complete.")
    print(f"       Final feature count : {len(feature_names)}")
    print(f"       Train rows          : {X_train_arr.shape[0]}")
    print(f"       Test rows           : {X_test_arr.shape[0]}")
    print("=" * 60)

    return {
        "preprocessor": preprocessor,
        "feature_names": feature_names,
        "n_train": X_train_arr.shape[0],
        "n_test": X_test_arr.shape[0],
    }


if __name__ == "__main__":
    run_pipeline()
