"""Fixtures de Pytest con datos sinteticos controlados para pruebas ultrarrapidas."""

import os
from pathlib import Path

_KERAS_DIR = Path(__file__).resolve().parents[1] / ".keras"
_KERAS_DIR.mkdir(parents=True, exist_ok=True)
os.environ["KERAS_HOME"] = str(_KERAS_DIR)
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import pytest
import numpy as np
import pandas as pd


@pytest.fixture
def synthetic_region_df():
    """Genera 350 semanas de datos sinteticos para una region de prueba."""
    np.random.seed(42)
    n_weeks = 350
    dates = pd.date_range(start="2010-01-04", periods=n_weeks, freq="W-MON")

    # Serie con estacionalidad anual y ruido
    t = np.arange(n_weeks)
    seasonal = 10.0 + 5.0 * np.sin(2 * np.pi * t / 52.0)
    noise = np.random.normal(0, 1.5, size=n_weeks)
    raw = np.maximum(0.1, seasonal + noise)

    smooth = pd.Series(raw).rolling(window=3, min_periods=1).mean().values

    df = pd.DataFrame({
        "date": dates,
        "year": dates.year,
        "departamento": "TEST_REGION",
        "incidence_raw": raw,
        "incidence_smooth": smooth,
    })
    return df
