"""Pruebas unitarias de transformaciones numericas."""

import numpy as np
import pytest
from src.features.transforms import transform_y, inverse_transform_y


def test_transform_roundtrip():
    """Comprueba que inverse_transform_y(transform_y(x)) == x para valores positivos."""
    x = np.array([0.0, 1.5, 10.0, 100.25, 5000.0])
    y = transform_y(x)
    recovered = inverse_transform_y(y)
    np.testing.assert_allclose(x, recovered, rtol=1e-5)


def test_transform_non_negative():
    """Garantiza que valores negativos se acotan a cero."""
    x = np.array([-10.0, -0.5, 0.0])
    y = transform_y(x)
    assert np.all(y >= 0.0)
    recovered = inverse_transform_y(y)
    assert np.all(recovered >= 0.0)

