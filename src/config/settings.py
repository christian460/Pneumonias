"""Configuracion centralizada de rutas, parametros de series temporales y entorno."""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Tuple

PROJ_ROOT = Path(__file__).resolve().parents[2]


@dataclass
class Settings:
    # Rutas base
    ROOT_DIR: Path = PROJ_ROOT
    DATA_RAW_DIR: Path = PROJ_ROOT / "data" / "raw"
    DATA_PROCESSED_DIR: Path = PROJ_ROOT / "data" / "processed"
    OUTPUTS_DIR: Path = PROJ_ROOT / "outputs"
    REPORTS_DIR: Path = PROJ_ROOT / "reports"

    # Ficheros de datos
    RAW_IRA_TEMP_PATH: Path = DATA_RAW_DIR / "iras_data_raw_temp.parquet"
    RAW_IRA_PATH: Path = DATA_RAW_DIR / "iras_data_raw.parquet"
    RAW_POPULATION_PATH: Path = DATA_RAW_DIR / "population_dept_long.parquet"
    PROCESSED_WEEKLY_PATH: Path = DATA_PROCESSED_DIR / "iras_department_weekly.parquet"

    # Parametros temporales y epidemiologicos
    START_YEAR: int = 2006
    END_YEAR: int = 2023
    SMOOTH_WINDOW: int = 3
    SEASONAL_PERIOD: int = 52

    # Parametros de validacion temporal y backtesting
    TRAIN_WINDOW_WEEKS: int = 5 * 52  # 260 semanas (5 anios)
    FORECAST_HORIZON: int = 4         # 4 semanas
    STEP_WEEKS: int = 4               # Avance de 4 semanas
    FUTURE_WEEKS: int = 52            # 52 semanas hacia el futuro (1 anio)
    
    @property
    def FUTURE_BLOCKS(self) -> int:
        return self.FUTURE_WEEKS // self.FORECAST_HORIZON

    # Outliers y preprocesamiento
    CAP_OUTLIERS: bool = True
    CAP_QUANTILE: float = 0.99
    USE_LOG_TARGET: bool = True

    # Parametros ARIMA
    ARIMA_ORDERS: List[Tuple[int, int, int]] = field(
        default_factory=lambda: [
            (1, 1, 1),
            (2, 1, 1),
            (1, 1, 2),
            (2, 1, 2),
            (3, 1, 1),
        ]
    )

    # Parametros LSTM
    LSTM_LOOKBACK: int = 52
    LSTM_VAL_WEEKS: int = 52
    LSTM_UNITS_1: int = 64
    LSTM_UNITS_2: int = 32
    LSTM_DROPOUT_RATE: float = 0.2
    LSTM_EPOCHS: int = 50
    LSTM_BATCH_SIZE: int = 16
    LSTM_PATIENCE: int = 8

    # Reproducibilidad
    RANDOM_SEED: int = 42

    def __post_init__(self):
        self.DATA_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
        self.REPORTS_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()

