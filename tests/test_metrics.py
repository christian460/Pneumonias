"""Pruebas unitarias para metricas de evaluacion predictiva."""

import numpy as np
import pandas as pd
from src.evaluation.metrics import safe_rmse, safe_mae, safe_r2, compute_metrics_df


def test_metrics_perfect_prediction():
    y_true = np.array([1.0, 2.0, 3.0, 4.0])
    y_pred = np.array([1.0, 2.0, 3.0, 4.0])

    assert safe_mae(y_true, y_pred) == 0.0
    assert safe_rmse(y_true, y_pred) == 0.0
    assert safe_r2(y_true, y_pred) == 1.0


def test_metrics_known_error():
    y_true = np.array([10.0, 20.0])
    y_pred = np.array([12.0, 18.0])

    assert safe_mae(y_true, y_pred) == 2.0
    assert safe_rmse(y_true, y_pred) == 2.0


def test_compute_metrics_df_aggregation():
    results_df = pd.DataFrame({
        "model": ["naive", "naive", "arima", "arima"],
        "actual": [10.0, 12.0, 10.0, 12.0],
        "predicted": [10.0, 10.0, 11.0, 11.0],
        "region": ["AREQUIPA", "AREQUIPA", "AREQUIPA", "AREQUIPA"],
    })

    metrics = compute_metrics_df(results_df)
    assert len(metrics) == 2
    assert set(metrics["model"]) == {"naive", "arima"}
    assert "rmse" in metrics.columns
    assert "mae" in metrics.columns
    assert "r2" in metrics.columns

