"""Pruebas de ausencia de fuga de informacion (Data Leakage & Teacher Forcing)."""

import numpy as np
import pandas as pd
from src.features.engineering import create_ml_features, make_next_feature_row
from src.features.transforms import transform_y


def test_no_future_data_in_recursive_forecasting():
    """Verifica que el generador recursivo no utilice informacion futura."""
    history_model = [1.0, 1.2, 1.1, 1.3, 1.5]
    future_actual = 999.0  # Dato anomalo futuro que el modelo no debe conocer

    next_date = pd.Timestamp("2020-01-05")
    row_t1 = make_next_feature_row(history_model, next_date)

    # lag_1 debe ser el ultimo valor del historico, nunca el valor futuro
    assert row_t1["lag_1"].iloc[0] == 1.5
    assert 999.0 not in row_t1.values


def test_rolling_features_use_past_only(synthetic_region_df):
    """Garantiza que las estadisticas moviles aplican shift(1)."""
    df = synthetic_region_df.copy()
    df_feat = create_ml_features(df)

    # roll_mean_4 en el indice i debe ser el promedio de target_model en i-4 a i-1
    target = df_feat["target_model"].values
    roll_mean = df_feat["roll_mean_4"].values

    for i in range(10, 15):
        expected_mean = np.mean(target[i - 4:i])
        np.testing.assert_allclose(roll_mean[i], expected_mean, rtol=1e-5)

