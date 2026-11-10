"""Punto de entrada unificado para el sistema de prediccion epidemiologica."""

import argparse
import sys
from src.config.constants import TARGET_MAPPINGS, REGIONS
from src.data.preparation import build_processed_datasets
from src.pipelines.runner import run_pipeline


def main():
    parser = argparse.ArgumentParser(
        description="Sistema Predictivo de Hospitalizaciones y Defunciones por Neumonias e IRAs (UNSA & Oklahoma)"
    )

    parser.add_argument(
        "--target",
        type=str,
        default="adults_death",
        choices=list(TARGET_MAPPINGS.keys()),
        help="Objetivo epidemiologico a modelar (adults_death, adults_hosp, children_death, children_hosp)",
    )

    parser.add_argument(
        "--family",
        type=str,
        default="statistical",
        choices=["statistical", "ml", "lstm"],
        help="Familia de modelos (statistical, ml, lstm)",
    )

    parser.add_argument(
        "--region",
        type=str,
        default="all",
        help="Region a procesar (ej: LIMA, AREQUIPA) o 'all' para los 25 departamentos (default: all)",
    )

    parser.add_argument(
        "--build-data",
        action="store_true",
        help="Fuerza la reconstruccion del dataset procesado semanal desde los datos crudos",
    )

    parser.add_argument(
        "--no-plots",
        action="store_true",
        help="Deshabilita la generacion de graficos PNG para acelerar ejecucion",
    )

    parser.add_argument(
        "--no-csv",
        action="store_true",
        help="Deshabilita la exportacion de archivos CSV",
    )

    args = parser.parse_args()

    if args.build_data:
        print("🔨 Reconstruyendo datos procesados...")
        build_processed_datasets(force=True)

    regions_to_run = "all" if args.region.lower() == "all" else args.region.upper()

    run_pipeline(
        target_key=args.target,
        family=args.family,
        regions=regions_to_run,
        save_plots=not args.no_plots,
        save_csvs=not args.no_csv,
    )


if __name__ == "__main__":
    main()

