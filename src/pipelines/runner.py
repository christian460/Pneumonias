"""Orquestador unificado de entrenamiento, evaluacion y persistencia de pronosticos epidemiologicos."""

import time
from pathlib import Path
from typing import List, Optional, Union, Dict, Any
import pandas as pd

from src.config.settings import settings
from src.config.constants import REGIONS, TARGET_MAPPINGS
from src.data.preparation import load_clean_region_series
from src.models.statistical import StatisticalForecaster
from src.models.ml import MLForecaster
from src.models.dl import LSTMForecaster
from src.visualization.plots import plot_predictions, plot_heatmap, plot_anomalies


def get_family_output_dir(target_key: str, family: str) -> Path:
    """Mapea target y familia al directorio original en outputs/ para paridad de rutas."""
    family_norm = "stat" if family == "statistical" else ("ml" if family == "ml" else "lstm")
    folder_name = f"{target_key}_{family_norm}_optimized"
    return settings.OUTPUTS_DIR / folder_name


def run_pipeline(
    target_key: str,
    family: str,
    regions: Optional[Union[str, List[str]]] = None,
    save_plots: bool = True,
    save_csvs: bool = True,
    max_windows: Optional[int] = None,
) -> Dict[str, Any]:
    """Ejecuta el pipeline completo de modelado para un objetivo, familia y regiones especificas."""
    if target_key not in TARGET_MAPPINGS:
        raise ValueError(f"Objetivo '{target_key}' no valido. Disponibles: {list(TARGET_MAPPINGS.keys())}")

    target_info = TARGET_MAPPINGS[target_key]
    prefix = target_info["output_prefix"]

    family_clean = family.lower().strip()
    if family_clean in ["dl", "deep_learning"]:
        family_clean = "lstm"
    elif family_clean in ["stats", "stat"]:
        family_clean = "statistical"

    if family_clean not in ["statistical", "ml", "lstm"]:
        raise ValueError(f"Familia '{family}' no valida. Opciones: ['statistical', 'ml', 'lstm']")

    out_dir = get_family_output_dir(target_key, family_clean)
    out_dir.mkdir(parents=True, exist_ok=True)

    target_regions: List[str] = (
        REGIONS if (regions is None or regions == "all")
        else ([regions] if isinstance(regions, str) else regions)
    )

    print(f"\n🚀 Iniciando Pipeline | Target: {target_key} | Familia: {family_clean} | Regiones: {len(target_regions)}")
    t0 = time.perf_counter()

    all_results, all_metrics, all_future, all_comparisons = [], [], [], []

    for reg_idx, region in enumerate(target_regions, 1):
        reg_start = time.perf_counter()
        region_upper = region.strip().upper()
        reg_dir = out_dir / region_upper.lower()
        reg_dir.mkdir(parents=True, exist_ok=True)

        print(f"[{reg_idx}/{len(target_regions)}] Procesando {region_upper}...")

        # 1. Cargar serie limpia
        region_df = load_clean_region_series(target_key, region_upper)

        # 2. Entrenar y proyectar segun familia
        if family_clean == "statistical":
            forecaster = StatisticalForecaster(region_df, region_upper)
            forecaster.train_backtest()

            fut_dfs = []
            for m_name in forecaster.AVAILABLE_MODELS:
                fut_dfs.append(forecaster.forecast_future(m_name))
            future_df = pd.concat(fut_dfs, ignore_index=True) if fut_dfs else pd.DataFrame()
            best_model_for_plot = "holt_winters"
            file_code = f"{prefix}_baseline_stat"

        elif family_clean == "ml":
            forecaster = MLForecaster(region_df, region_upper)
            forecaster.train_backtest()

            fut_dfs = []
            for m_name in forecaster.AVAILABLE_MODELS:
                fut_dfs.append(forecaster.forecast_future(m_name))
            future_df = pd.concat(fut_dfs, ignore_index=True) if fut_dfs else pd.DataFrame()
            best_model_for_plot = "xgboost"
            file_code = f"{prefix}_ml"

        elif family_clean == "lstm":
            forecaster = LSTMForecaster(region_df, region_upper)
            forecaster.train_backtest(max_windows=max_windows)
            future_df = forecaster.forecast_future()
            best_model_for_plot = "lstm"
            file_code = f"{prefix}_lstm"

        res_df = forecaster.results_dataframe()
        met_df = forecaster.metrics_dataframe()
        comp_df = forecaster.comparison_dataframe()

        all_results.append(res_df)
        all_metrics.append(met_df)
        all_future.append(future_df)
        all_comparisons.append(comp_df)

        # 3. Exportar CSVs regionales
        if save_csvs:
            res_df.to_csv(reg_dir / f"{file_code}_predictions.csv", index=False)
            met_df.to_csv(reg_dir / f"{file_code}_metrics.csv", index=False)
            future_df.to_csv(reg_dir / f"{file_code}_future_predictions.csv", index=False)
            comp_df.to_csv(reg_dir / f"{file_code}_comparison_predictions.csv", index=False)

        # 4. Generar graficos regionales
        if save_plots:
            plot_predictions(
                historical_df=region_df,
                backtest_df=res_df,
                future_df=future_df,
                metrics_df=met_df,
                region_name=region_upper,
                target_info=target_info,
                output_png=reg_dir / f"{file_code}_plot.png",
            )
            plot_heatmap(
                historical_df=region_df,
                future_df=future_df,
                best_model=best_model_for_plot,
                region_name=region_upper,
                target_info=target_info,
                output_png=reg_dir / f"{prefix}_heatmap.png",
            )
            plot_anomalies(
                historical_df=region_df,
                future_df=future_df,
                best_model=best_model_for_plot,
                region_name=region_upper,
                target_info=target_info,
                output_png=reg_dir / f"{prefix}_anomalies.png",
            )

        elapsed_reg = time.perf_counter() - reg_start
        print(f"   ✓ {region_upper} completado en {elapsed_reg:.2f}s")

    # 5. Consolidar CSVs globales
    global_res = pd.concat(all_results, ignore_index=True) if all_results else pd.DataFrame()
    global_met = pd.concat(all_metrics, ignore_index=True) if all_metrics else pd.DataFrame()
    global_fut = pd.concat(all_future, ignore_index=True) if all_future else pd.DataFrame()
    global_cmp = pd.concat(all_comparisons, ignore_index=True) if all_comparisons else pd.DataFrame()

    if save_csvs:
        global_res.to_csv(out_dir / f"all_regions_{file_code}_predictions.csv", index=False)
        global_met.to_csv(out_dir / f"all_regions_{file_code}_metrics.csv", index=False)
        global_fut.to_csv(out_dir / f"all_regions_{file_code}_future_predictions.csv", index=False)
        global_cmp.to_csv(out_dir / f"all_regions_{file_code}_comparison_predictions.csv", index=False)

    total_time = time.perf_counter() - t0
    print(f"\n🏁 Pipeline finalizado con exito en {total_time:.2f}s. Salidas en: {out_dir}")

    return {
        "results": global_res,
        "metrics": global_met,
        "future": global_fut,
        "comparison": global_cmp,
        "output_dir": out_dir,
    }

