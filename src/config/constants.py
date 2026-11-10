"""Constantes inmutables del dominio epidemiologico y de modelado."""

from typing import Dict, Any, List

# 25 Departamentos oficiales del Peru
REGIONS: List[str] = [
    "AMAZONAS",
    "ANCASH",
    "APURIMAC",
    "AREQUIPA",
    "AYACUCHO",
    "CAJAMARCA",
    "CALLAO",
    "CUSCO",
    "HUANCAVELICA",
    "HUANUCO",
    "ICA",
    "JUNIN",
    "LA LIBERTAD",
    "LAMBAYEQUE",
    "LIMA",
    "LORETO",
    "MADRE DE DIOS",
    "MOQUEGUA",
    "PASCO",
    "PIURA",
    "PUNO",
    "SAN MARTIN",
    "TACNA",
    "TUMBES",
    "UCAYALI",
]

# Definicion y mapeo de los 4 objetivos epidemiologicos
TARGET_MAPPINGS: Dict[str, Dict[str, Any]] = {
    "adults_death": {
        "key": "adults_death",
        "column": "defunciones_60mas",
        "display_name": "Adults 60+ Deaths",
        "short_title": "Deaths in adults 60+",
        "indicator_type": "death",
        "age_group": "adults_60mas",
        "output_prefix": "adults_death",
        "heatmap_title": "Weekly Deaths Incidence Heatmap (Historical + Forecast)",
        "anomaly_title": "Epidemiological Anomalies in Deaths of Adults 60+",
    },
    "adults_hosp": {
        "key": "adults_hosp",
        "column": "hospitalizados_60mas",
        "display_name": "Adults 60+ Hospitalizations",
        "short_title": "Hospitalizations in adults 60+",
        "indicator_type": "hosp",
        "age_group": "adults_60mas",
        "output_prefix": "adults_hosp",
        "heatmap_title": "Weekly Hospitalization Incidence Heatmap (Historical + Forecast)",
        "anomaly_title": "Epidemiological Anomalies in Hospitalizations of Adults 60+",
    },
    "children_death": {
        "key": "children_death",
        "column": "defunciones_men5",
        "display_name": "Children 5- Deaths",
        "short_title": "Deaths in children 5-",
        "indicator_type": "death",
        "age_group": "children_men5",
        "output_prefix": "children_death",
        "heatmap_title": "Weekly Deaths Incidence Heatmap (Historical + Forecast)",
        "anomaly_title": "Epidemiological Anomalies in Deaths of Children 5-",
    },
    "children_hosp": {
        "key": "children_hosp",
        "column": "hospitalizados_men5",
        "display_name": "Children 5- Hospitalizations",
        "short_title": "Hospitalizations in children 5-",
        "indicator_type": "hosp",
        "age_group": "children_men5",
        "output_prefix": "children_hosp",
        "heatmap_title": "Weekly Hospitalization Incidence Heatmap (Historical + Forecast)",
        "anomaly_title": "Epidemiological Anomalies in Hospitalizations of Children 5-",
    },
}

MODEL_FAMILIES = ["statistical", "ml", "dl"]

# Paleta de colores consistente
MODEL_COLORS: Dict[str, str] = {
    "actual": "black",
    "naive": "tab:blue",
    "seasonal_naive": "tab:orange",
    "holt_winters": "tab:green",
    "arima": "tab:red",
    "random_forest": "tab:purple",
    "xgboost": "tab:brown",
    "lstm": "tab:red",
}

