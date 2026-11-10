"""Calculo de metricas analiticas de desempeno predictivo (MAE, RMSE, R2)."""

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Any


def safe_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calcula Root Mean Squared Error evitando valores negativos por imprecision numerica."""
    if len(y_true) == 0:
        return 0.0
    mse = mean_squared_error(y_true, y_pred)
    return float(np.sqrt(max(0.0, mse)))


def safe_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calcula Mean Absolute Error."""
    if len(y_true) == 0:
        return 0.0
    return float(mean_absolute_error(y_true, y_pred))


def safe_r2(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calcula Coeficiente de Determinacion R2, manejando varianzas nulas."""
    if len(y_true) < 2 or np.var(y_true) == 0:
        return 0.0
    return float(r2_score(y_true, y_pred))


def compute_metrics_df(results_df: pd.DataFrame) -> pd.DataFrame:
    """Agrupa los resultados del backtesting por modelo y calcula MAE, RMSE y R2."""
    if results_df.empty:
        return pd.DataFrame(columns=["model", "mae", "rmse", "r2", "region"])

    metrics_list = []
    region = results_df["region"].iloc[0] if "region" in results_df.columns else "UNKNOWN"

    for model_name, group in results_df.groupby("model"):
        y_true = group["actual"].values
        y_pred = group["predicted"].values

        mae = safe_mae(y_true, y_pred)
        rmse = safe_rmse(y_true, y_pred)
        r2 = safe_r2(y_true, y_pred)

        metrics_list.append({
            "model": model_name,
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
            "region": region,
        })

    return pd.DataFrame(metrics_list).sort_values("rmse").reset_index(drop=True)

