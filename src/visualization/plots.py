"""Generacion unificada de graficos y reportes visuales con Matplotlib."""

import os
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import pandas as pd

# Redirigir cache de matplotlib a directorio local para evitar warning de permisos
_mpl_cache = Path(__file__).parents[2] / ".matplotlib_cache"
_mpl_cache.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(_mpl_cache))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from src.config.constants import MODEL_COLORS


def plot_predictions(
    historical_df: pd.DataFrame,
    backtest_df: pd.DataFrame,
    future_df: pd.DataFrame,
    metrics_df: pd.DataFrame,
    region_name: str,
    target_info: Dict[str, Any],
    output_png: Path,
) -> None:
    """Genera la figura compuesta: serie temporal arriba y tabla de metricas abajo."""
    output_png.parent.mkdir(parents=True, exist_ok=True)

    actual_df = historical_df[["date", "incidence_smooth"]].copy()
    actual_df["date"] = pd.to_datetime(actual_df["date"])
    actual_df = actual_df.rename(columns={"incidence_smooth": "actual"}).sort_values("date")

    last_actual_date = actual_df["date"].max()
    last_actual_value = actual_df["actual"].iloc[-1]

    fig, (ax_plot, ax_table) = plt.subplots(
        2, 1, figsize=(18, 14), gridspec_kw={"height_ratios": [4, 2.8]}
    )

    # 1. Graficar serie real
    ax_plot.plot(
        actual_df["date"], actual_df["actual"],
        label="Actual", color=MODEL_COLORS.get("actual", "black"), linewidth=2.5
    )

    # 2. Graficar backtest y futuro por cada modelo
    if not backtest_df.empty:
        b_df = backtest_df.copy()
        b_df["date"] = pd.to_datetime(b_df["date"])

        for model_name in b_df["model"].unique():
            color = MODEL_COLORS.get(model_name, "tab:gray")
            temp = b_df[b_df["model"] == model_name].sort_values("date")

            ax_plot.plot(
                temp["date"], temp["predicted"],
                label=model_name, color=color, linewidth=2
            )

            if not future_df.empty and "model" in future_df.columns:
                fut = future_df[future_df["model"] == model_name].sort_values("date").copy()
                if not fut.empty:
                    fut["date"] = pd.to_datetime(fut["date"])
                    fut_connected = pd.concat([
                        pd.DataFrame({
                            "date": [last_actual_date],
                            "predicted": [last_actual_value],
                            "model": [model_name]
                        }),
                        fut
                    ], ignore_index=True)

                    ax_plot.plot(
                        fut_connected["date"], fut_connected["predicted"],
                        label=f"{model_name} - Future", color=color,
                        linestyle="--", linewidth=2
                    )

    xlim_end = pd.to_datetime(future_df["date"]).max() if not future_df.empty else last_actual_date
    ax_plot.set_xlim(actual_df["date"].min(), xlim_end)
    ax_plot.axvline(last_actual_date, color="gray", linestyle=":", linewidth=1.5)

    display_name = target_info.get("display_name", "Target")
    short_title = target_info.get("short_title", "Predictions")

    ax_plot.set_title(
        f"{region_name} | {display_name} | Multi-horizon Forecast | "
        f"Future predictions of {short_title} (per 100,000 inhabitants)",
        fontsize=14, fontweight="bold", pad=12
    )
    ax_plot.set_xlabel("Date", fontsize=11)
    ax_plot.set_ylabel("Incidence per 100,000 inhabitants", fontsize=11)
    ax_plot.grid(True, linestyle="--", alpha=0.4)
    ax_plot.legend(loc="upper left", frameon=True, fontsize=10)

    # 3. Tabla inferior de metricas
    ax_table.axis("off")
    if not metrics_df.empty:
        cols_show = ["model", "mae", "rmse", "r2"]
        cols_present = [c for c in cols_show if c in metrics_df.columns]
        table_data = metrics_df[cols_present].values

        col_labels = [c.upper() for c in cols_present]
        table = ax_table.table(
            cellText=table_data,
            colLabels=col_labels,
            loc="center",
            cellLoc="center"
        )
        table.auto_set_font_size(False)
        table.set_fontsize(11)
        table.scale(1.0, 1.8)

        # Estilo de encabezado de tabla
        for (row, col), cell in table.get_celld().items():
            if row == 0:
                cell.set_facecolor("#2b5c8f")
                cell.set_text_props(color="white", weight="bold")
            else:
                cell.set_facecolor("#f9f9f9" if row % 2 == 0 else "#ffffff")

    plt.tight_layout()
    plt.savefig(output_png, dpi=300, bbox_inches="tight")
    plt.close()


def plot_heatmap(
    historical_df: pd.DataFrame,
    future_df: pd.DataFrame,
    best_model: str,
    region_name: str,
    target_info: Dict[str, Any],
    output_png: Path,
) -> None:
    """Genera el heatmap estacional año x semana epidemiológica."""
    output_png.parent.mkdir(parents=True, exist_ok=True)

    hist = historical_df.copy()
    hist["date"] = pd.to_datetime(hist["date"])
    hist = hist[["date", "incidence_smooth"]].copy()

    fut = future_df.copy()
    if not fut.empty:
        fut["date"] = pd.to_datetime(fut["date"])
        if "model" in fut.columns and best_model in fut["model"].values:
            fut = fut[fut["model"] == best_model].copy()
        fut = fut.rename(columns={"predicted": "incidence_smooth"})
        fut = fut[["date", "incidence_smooth"]].copy()
        df = pd.concat([hist, fut], ignore_index=True)
    else:
        df = hist

    df["year"] = df["date"].dt.year
    df["week"] = df["date"].dt.isocalendar().week.astype(int)

    heatmap = (
        df.pivot_table(index="year", columns="week", values="incidence_smooth", aggfunc="mean")
        .sort_index()
    )
    heatmap = heatmap.reindex(columns=range(1, 53))

    fig, ax = plt.subplots(figsize=(18, 8))

    valid_vals = heatmap.values[~np.isnan(heatmap.values)]
    vmin = float(np.percentile(valid_vals, 5)) if len(valid_vals) > 0 else 0.0
    vmax = float(np.percentile(valid_vals, 95)) if len(valid_vals) > 0 else 1.0

    img = ax.imshow(
        heatmap, aspect="auto", cmap="YlOrRd", interpolation="nearest",
        origin="upper", vmin=vmin, vmax=vmax
    )

    heatmap_title = target_info.get("heatmap_title", "Weekly Incidence Heatmap")
    ax.set_title(f"{region_name}\n{heatmap_title}", fontsize=14, fontweight="bold")
    ax.set_xlabel("Epidemiological Week", fontsize=11)
    ax.set_ylabel("Year", fontsize=11)

    xticks = np.arange(0, 52, 4)
    ax.set_xticks(xticks)
    ax.set_xticklabels([str(i + 1) for i in xticks])

    ax.set_yticks(np.arange(len(heatmap.index)))
    ax.set_yticklabels(heatmap.index.astype(str))

    last_hist_year = hist["date"].dt.year.max()
    forecast_year = last_hist_year + 1 if not fut.empty else None

    if forecast_year is not None and forecast_year in heatmap.index:
        idx = list(heatmap.index).index(forecast_year)
        ax.axhline(idx - 0.5, color="black", linestyle="--", linewidth=2)
        ax.text(52.5, idx, "Forecast", fontsize=10, fontweight="bold", va="center")

    cbar = plt.colorbar(img, ax=ax)
    cbar.set_label("Incidence per 100,000 inhabitants", fontsize=11)

    plt.tight_layout()
    plt.savefig(output_png, dpi=300, bbox_inches="tight")
    plt.close()


def plot_anomalies(
    historical_df: pd.DataFrame,
    future_df: pd.DataFrame,
    best_model: str,
    region_name: str,
    target_info: Dict[str, Any],
    output_png: Path,
) -> None:
    """Genera el gráfico de anomalías epidemiológicas basado en Z-Score."""
    output_png.parent.mkdir(parents=True, exist_ok=True)

    hist = historical_df.copy()
    hist["date"] = pd.to_datetime(hist["date"])
    hist["week"] = hist["date"].dt.isocalendar().week.astype(int)
    hist = hist[["date", "week", "incidence_smooth"]].copy()
    hist["source"] = "historical"

    # Estadisticas por semana epidemiologica
    weekly_stats = (
        hist.groupby("week")["incidence_smooth"]
        .agg(["mean", "std"])
        .reset_index()
        .rename(columns={"mean": "historical_mean", "std": "historical_std"})
    )
    weekly_stats["historical_std"] = weekly_stats["historical_std"].fillna(0.0)

    fut = future_df.copy()
    if not fut.empty:
        fut["date"] = pd.to_datetime(fut["date"])
        if "model" in fut.columns and best_model in fut["model"].values:
            fut = fut[fut["model"] == best_model].copy()
        fut["week"] = fut["date"].dt.isocalendar().week.astype(int)
        fut = fut.rename(columns={"predicted": "incidence_smooth"})
        fut = fut[["date", "week", "incidence_smooth"]].copy()
        fut["source"] = "forecast"
        df = pd.concat([hist, fut], ignore_index=True)
    else:
        df = hist

    df = df.merge(weekly_stats, on="week", how="left")
    df["anomaly"] = df["incidence_smooth"] - df["historical_mean"]
    df["z_score"] = np.where(
        df["historical_std"] > 0,
        df["anomaly"] / df["historical_std"],
        0.0
    )

    def classify_z(z: float) -> str:
        if z >= 2.0:
            return "Very high"
        elif z >= 1.0:
            return "High"
        elif z <= -2.0:
            return "Very low"
        elif z <= -1.0:
            return "Low"
        return "Normal"

    df["classification"] = df["z_score"].apply(classify_z)

    color_map = {
        "Very high": "#8B0000",
        "High": "#FF4D4D",
        "Normal": "#BDBDBD",
        "Low": "#90EE90",
        "Very low": "#006400",
    }
    df["color"] = df["classification"].map(color_map)

    hist_df = df[df["source"] == "historical"].copy()
    fore_df = df[df["source"] == "forecast"].copy()

    fig, ax = plt.subplots(figsize=(18, 8))

    if not hist_df.empty:
        ax.bar(
            hist_df["date"], hist_df["anomaly"], color=hist_df["color"],
            width=5, alpha=0.85, label="Historical"
        )
    if not fore_df.empty:
        ax.bar(
            fore_df["date"], fore_df["anomaly"], color=fore_df["color"],
            width=5, alpha=0.45, hatch="//", label="Forecast"
        )
        ax.axvline(hist_df["date"].max(), color="black", linestyle="--", linewidth=1.5)

    ax.axhline(0, color="black", linewidth=1)

    anomaly_title = target_info.get("anomaly_title", "Epidemiological Anomalies")
    ax.set_title(f"{region_name} | {anomaly_title}", fontsize=14, fontweight="bold")
    ax.set_xlabel("Date", fontsize=11)
    ax.set_ylabel("Anomaly (Incidence - Historical Weekly Mean)", fontsize=11)
    ax.grid(True, linestyle="--", alpha=0.3)

    # Leyenda personalizada de severidad
    from matplotlib.patches import Patch
    legend_elements = [
        Patch(facecolor="#8B0000", label="Very high (Z >= 2)"),
        Patch(facecolor="#FF4D4D", label="High (Z >= 1)"),
        Patch(facecolor="#BDBDBD", label="Normal (-1 < Z < 1)"),
        Patch(facecolor="#90EE90", label="Low (Z <= -1)"),
        Patch(facecolor="#006400", label="Very low (Z <= -2)"),
    ]
    ax.legend(handles=legend_elements, loc="upper left", fontsize=10)

    plt.tight_layout()
    plt.savefig(output_png, dpi=300, bbox_inches="tight")
    plt.close()

