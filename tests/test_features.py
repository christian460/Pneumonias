"""Pruebas unitarias de ingenieria de caracteristicas y secuencias."""

import numpy as np
import pandas as pd
from src.features.engineering import create_ml_features, make_next_feature_row, create_lstm_sequences, FEATURE_COLS


def test_create_ml_features_structure(synthetic_region_df):
    df_feat = create_ml_features(synthetic_region_df)

    assert not df_feat.empty
    for col in FEATURE_COLS:
        assert col in df_feat.columns, f"Falta la columna {col}"

    # Validar que no contenga valores NaN tras el dropna
    assert df_feat[FEATURE_COLS].isna().sum().sum() == 0


def test_make_next_feature_row():
    history = [1.0, 2.0, 3.0, 4.0, 5.0]
    next_date = pd.Timestamp("2020-06-01")

    row = make_next_feature_row(history, next_date)
    assert isinstance(row, pd.DataFrame)
    assert len(row) == 1
    assert row["lag_1"].iloc[0] == 5.0
    assert row["lag_2"].iloc[0] == 4.0


def test_create_lstm_sequences():
    target = np.arange(100).reshape(-1, 1).astype(float)
    exog = np.ones((100, 2))

    lookback = 10
    horizon = 4

    X, y = create_lstm_sequences(target, exog, lookback, horizon)

    expected_samples = 100 - lookback - horizon + 1
    assert X.shape == (expected_samples, lookback, 3)
    assert y.shape == (expected_samples, horizon)

