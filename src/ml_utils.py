"""
Reusable ML utilities for column detection, preprocessing, and data loading.
"""
import json
import os
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# ---------------------------------------------------------------------------
# Column type detection
# ---------------------------------------------------------------------------

def detect_column_types(
    df: pd.DataFrame,
    target_col: Optional[str] = None,
    categorical_threshold: int = 20,
) -> Dict[str, List[str]]:
    """
    Detect numerical and categorical columns in a DataFrame.

    Args:
        df: Input DataFrame.
        target_col: Column to exclude from feature lists.
        categorical_threshold: Max unique values to treat an int/float col
            as categorical.

    Returns:
        Dict with keys 'numerical' and 'categorical'.
    """
    exclude = {target_col} if target_col else set()
    numerical, categorical = [], []

    for col in df.columns:
        if col in exclude:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            if df[col].nunique() <= categorical_threshold and df[col].nunique() < len(df) * 0.05:
                categorical.append(col)
            else:
                numerical.append(col)
        else:
            categorical.append(col)

    return {"numerical": numerical, "categorical": categorical}


# ---------------------------------------------------------------------------
# Preprocessor builder
# ---------------------------------------------------------------------------

def build_preprocessor(
    numerical_cols: List[str],
    categorical_cols: List[str],
) -> ColumnTransformer:
    """
    Build a standard sklearn ColumnTransformer pipeline.

    Numerical: median imputation + StandardScaler.
    Categorical: most_frequent imputation + OneHotEncoder (unknown → ignore).
    """
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    transformers = []
    if numerical_cols:
        transformers.append(("num", num_pipeline, numerical_cols))
    if categorical_cols:
        transformers.append(("cat", cat_pipeline, categorical_cols))

    return ColumnTransformer(transformers=transformers, remainder="drop")


# ---------------------------------------------------------------------------
# Train/test split
# ---------------------------------------------------------------------------

def safe_split(
    df: pd.DataFrame,
    target_col: str,
    test_size: float = 0.2,
    random_state: int = 42,
    stratify: bool = True,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Split DataFrame into train/test sets before any preprocessing.

    Args:
        df: Full DataFrame.
        target_col: Name of the target column.
        test_size: Proportion for test set.
        random_state: Random seed.
        stratify: Whether to stratify by target (classification).

    Returns:
        X_train, X_test, y_train, y_test
    """
    from sklearn.model_selection import train_test_split

    X = df.drop(columns=[target_col])
    y = df[target_col]

    stratify_col = y if stratify else None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=stratify_col,
    )
    return X_train, X_test, y_train, y_test


# ---------------------------------------------------------------------------
# EDA report loader
# ---------------------------------------------------------------------------

def load_eda_report(path: str = ".claude/eda_report.json") -> Optional[Dict]:
    """Load an EDA report JSON if it exists."""
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None
