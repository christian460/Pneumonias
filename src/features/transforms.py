"""Transformaciones numericas de estabilizacion de varianza para series epidemiologicas."""

import numpy as np
from typing import Union


def transform_y(y: Union[np.ndarray, list, float]) -> np.ndarray:
    """Aplica transformacion logaritmica log(1 + y) garantizando no negatividad."""
    arr = np.asarray(y, dtype=float)
    return np.log1p(np.maximum(0.0, arr))


def inverse_transform_y(y_transf: Union[np.ndarray, list, float]) -> np.ndarray:
    """Invierte la transformacion logaritmica con exp(y) - 1 acotando a cero."""
    arr = np.asarray(y_transf, dtype=float)
    return np.maximum(0.0, np.expm1(arr))

