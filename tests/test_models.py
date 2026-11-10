"""Pruebas unitarias de ajuste y prediccion de las 3 familias de modelos."""

import pytest
import pandas as pd
from src.config.settings import settings
from src.models.statistical import StatisticalForecaster
from src.models.ml import MLForecaster
from src.models.dl import LSTMForecaster


def test_statistical_forecaster_fit_and_predict(synthetic_region_df):
    forecaster = StatisticalForecaster(synthetic_region_df, "TEST_REGION")
    forecaster.train_backtest(model_names=["naive", "seasonal_naive"])

    res_df = forecaster.results_dataframe()
    assert not res_df.empty
    assert "predicted" in res_df.columns
    assert set(res_df["model"].unique()) == {"naive", "seasonal_naive"}

    fut_df = forecaster.forecast_future("naive")
    assert not fut_df.empty
    assert len(fut_df) == 52


def test_ml_forecaster_fit_and_predict(synthetic_region_df):
    forecaster = MLForecaster(synthetic_region_df, "TEST_REGION")
    forecaster.train_backtest(model_names=["random_forest"])

    res_df = forecaster.results_dataframe()
    assert not res_df.empty
    assert "predicted" in res_df.columns

    fut_df = forecaster.forecast_future("random_forest")
    assert not fut_df.empty
    assert len(fut_df) == 52


def test_lstm_forecaster_fast_window(synthetic_region_df, monkeypatch):
    # Reducir epochs a 1 para prueba unitaria ultrarrapida
    monkeypatch.setattr(settings, "LSTM_EPOCHS", 1)

    forecaster = LSTMForecaster(synthetic_region_df, "TEST_REGION")
    forecaster.train_backtest(max_windows=1)

    res_df = forecaster.results_dataframe()
    assert not res_df.empty
    assert "predicted" in res_df.columns
