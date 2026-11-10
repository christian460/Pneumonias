"""Generacion de variables predictivas (lags, rolling stats, armonicos) y secuencias temporales."""

import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any
from src.features.transforms import transform_y


FEATURE_COLS = [
    "lag_1", "lag_2", "lag_4", "lag_8", "lag_12", "lag_26", "lag_52",
    "roll_mean_4", "roll_std_4", "roll_mean_8", "roll_std_8", "roll_max_8",
    "roll_mean_12", "roll_max_12",
    "weekofyear", "sin_week", "cos_week"
]


def create_ml_features(df: pd.DataFrame) -> pd.DataFrame:
    """Genera variables de rezagos, estadisticas moviles y componentes ciclicos.
    
    Asegura que las ventanas moviles utilicen exclusivamente informacion pasada (shift(1)).
    """
    out = df.copy().sort_values("date").reset_index(drop=True)
    y_orig = out["incidence_smooth"].astype(float).values
    out["target_model"] = transform_y(y_orig)

    s = out["target_model"]

    # Rezagos temporales
    out["lag_1"] = s.shift(1)
    out["lag_2"] = s.shift(2)
    out["lag_4"] = s.shift(4)
    out["lag_8"] = s.shift(8)
    out["lag_12"] = s.shift(12)
    out["lag_26"] = s.shift(26)
    out["lag_52"] = s.shift(52)

    # Ventanas moviles (estrictamente pasadas)
    out["roll_mean_4"] = s.shift(1).rolling(4).mean()
    out["roll_std_4"] = s.shift(1).rolling(4).std().fillna(0.0)
    out["roll_mean_8"] = s.shift(1).rolling(8).mean()
    out["roll_std_8"] = s.shift(1).rolling(8).std().fillna(0.0)
    out["roll_max_8"] = s.shift(1).rolling(8).max()
    out["roll_mean_12"] = s.shift(1).rolling(12).mean()
    out["roll_max_12"] = s.shift(1).rolling(12).max()

    # Codificacion sinusoidal de semana epidemiologica (1 a 52)
    out["weekofyear"] = out["date"].dt.isocalendar().week.astype(int)
    out["sin_week"] = np.sin(2 * np.pi * out["weekofyear"] / 52.0)
    out["cos_week"] = np.cos(2 * np.pi * out["weekofyear"] / 52.0)

    return out.dropna().reset_index(drop=True)


def make_next_feature_row(y_model_history: List[float], next_date: pd.Timestamp) -> pd.DataFrame:
    """Construye un vector de caracteristicas para inferencia autorregresiva de paso 1."""
    def safe_lag(k: int) -> float:
        return y_model_history[-k] if len(y_model_history) >= k else y_model_history[-1]

    def safe_roll_mean(k: int) -> float:
        return float(np.mean(y_model_history[-k:])) if len(y_model_history) >= k else float(np.mean(y_model_history))

    def safe_roll_std(k: int) -> float:
        if len(y_model_history) >= k and k > 1:
            val = float(np.std(y_model_history[-k:], ddof=1))
            return 0.0 if np.isnan(val) else val
        return 0.0

    def safe_roll_max(k: int) -> float:
        return float(np.max(y_model_history[-k:])) if len(y_model_history) >= k else float(np.max(y_model_history))

    week = int(next_date.isocalendar().week)
    sin_w = float(np.sin(2 * np.pi * week / 52.0))
    cos_w = float(np.cos(2 * np.pi * week / 52.0))

    row_dict = {
        "lag_1": safe_lag(1),
        "lag_2": safe_lag(2),
        "lag_4": safe_lag(4),
        "lag_8": safe_lag(8),
        "lag_12": safe_lag(12),
        "lag_26": safe_lag(26),
        "lag_52": safe_lag(52),
        "roll_mean_4": safe_roll_mean(4),
        "roll_std_4": safe_roll_std(4),
        "roll_mean_8": safe_roll_mean(8),
        "roll_std_8": safe_roll_std(8),
        "roll_max_8": safe_roll_max(8),
        "roll_mean_12": safe_roll_mean(12),
        "roll_max_12": safe_roll_max(12),
        "weekofyear": week,
        "sin_week": sin_w,
        "cos_week": cos_w,
    }

    return pd.DataFrame([row_dict])[FEATURE_COLS]


def create_lstm_sequences(
    target_scaled: np.ndarray,
    exog_values: np.ndarray,
    lookback: int,
    horizon: int
) -> Tuple[np.ndarray, np.ndarray]:
    """Genera tensores tridimensionales (samples, lookback, features) para entrenamiento LSTM."""
    X, y = [], []
    n = len(target_scaled)

    for i in range(lookback, n - horizon + 1):
        target_seq = target_scaled[i - lookback:i, 0].reshape(-1, 1)
        exog_seq = exog_values[i - lookback:i]
        seq = np.concatenate([target_seq, exog_seq], axis=1)
        X.append(seq)
        y.append(target_scaled[i:i + horizon, 0])

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)

