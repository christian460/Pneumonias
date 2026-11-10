"""Pruebas del pipeline de preparacion de datos epidemiologicos."""

import pytest
from src.config.constants import TARGET_MAPPINGS, REGIONS
from src.data.preparation import load_clean_region_series


def test_target_mappings_integrity():
    required_keys = ["adults_death", "adults_hosp", "children_death", "children_hosp"]
    for key in required_keys:
        assert key in TARGET_MAPPINGS
        info = TARGET_MAPPINGS[key]
        assert "column" in info
        assert "display_name" in info
        assert "output_prefix" in info


def test_load_clean_region_series_schema():
    df = load_clean_region_series("adults_death", "AMAZONAS")
    assert not df.empty
    expected_cols = ["date", "year", "departamento", "incidence_raw", "incidence_smooth"]
    assert list(df.columns) == expected_cols
    assert (df["incidence_raw"] >= 0.0).all()
    assert (df["incidence_smooth"] >= 0.0).all()

