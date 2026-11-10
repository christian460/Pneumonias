# Reporte de Refactorización Arquitectónica
## Pneumonias — Repositorio de Predicción Epidemiológica

**Fecha:** Noviembre 2026  
**Autor:** Senior Software Engineer / ML Architect (IA asistida)  
**Repositorio:** `d:\Proyectos\Pneumonias`  
**Rama de trabajo:** `main`

---

## 1. Resumen Ejecutivo

Se realizó una refactorización arquitectónica completa del repositorio, transformando 12 scripts monolíticos con alta duplicación (~9,219 líneas en total) en una arquitectura modular de ~1,401 líneas efectivas de código nuevo.

Los objetivos principales fueron:

- Eliminar la duplicación de código entre los 12 scripts originales
- Corregir tres problemas metodológicos críticos identificados en la auditoría
- Crear un pipeline CLI unificado seleccionable por parámetros
- Garantizar reproducibilidad científica y mantenibilidad

**Resultado:** 15/15 pruebas unitarias superadas. Pipeline funcional verificado para 2 familias (`statistical`, `ml`) y múltiples targets con ejecución end-to-end exitosa.

---

## 2. Estado del Repositorio Antes de la Refactorización

### 2.1 Scripts originales (preservados en `src/models/legacy/`)

| Archivo | Líneas | Responsabilidad |
|---|---|---|
| `adults_death_baseline_stats_final.py` | 703 | Modelos estadísticos — defunciones adultos |
| `adults_death_ml_final.py` | 814 | ML (RF + XGB) — defunciones adultos |
| `adults_death_lstm_final.py` | 747 | LSTM — defunciones adultos |
| `adults_hosp_baseline_stats_final.py` | 703 | Modelos estadísticos — hospitalizados adultos |
| `adults_hosp_ml_final.py` | 892 | ML — hospitalizados adultos |
| `adults_hosp_lstm_final.py` | 754 | LSTM — hospitalizados adultos |
| `children_death_baseline_stats_final.py` | 703 | Modelos estadísticos — defunciones niños |
| `children_death_ml_final.py` | 814 | ML — defunciones niños |
| `children_death_lstm_final.py` | 747 | LSTM — defunciones niños |
| `children_hosp_baseline_stats_final.py` | 703 | Modelos estadísticos — hospitalizados niños |
| `children_hosp_ml_final.py` | 892 | ML — hospitalizados niños |
| `children_hosp_lstm_final.py` | 747 | LSTM — hospitalizados niños |
| **Total** | **9,219** | 12 scripts monolíticos |

> **Nota:** Los scripts originales en `src/models/` **no fueron eliminados**. El directorio `src/models/legacy/` contiene una copia explícita archivada.

### 2.2 Problemas identificados

#### Problemas metodológicos (críticos)

1. **Data Leakage en capping de outliers:** Los percentiles para truncamiento se calculaban sobre la serie completa (incluidos datos de test), introduciendo fuga de información temporal.

2. **Teacher Forcing en backtesting ML:** Durante la evaluación multi-paso, los modelos ML usaban valores reales observados del horizonte como rezagos para pasos posteriores, inflando artificialmente las métricas de validación.

3. **Memory leak en LSTM:** No se llamaba a `tf.keras.backend.clear_session()` entre ventanas de entrenamiento, acumulando grafos de TensorFlow hasta agotar la RAM (los scripts de `children_*` no podían completar ejecución).

#### Problemas estructurales

4. **Duplicación ~89%:** Código casi idéntico entre los 4 targets × 3 familias = 12 scripts. Cambios en un algoritmo debían replicarse manualmente en 3 o 4 archivos.

5. **`requirements.txt` corrupto:** El archivo estaba codificado en UTF-16LE con BOM, causando errores en instalación y lectura por herramientas estándar.

6. **Sin punto de entrada unificado:** Cada script se ejecutaba de forma independiente sin parametrización del target.

7. **Configuración dispersa:** Parámetros (ventana de entrenamiento, horizonte, rutas, semilla) distribuidos en cada archivo sin centralización.

---

## 3. Arquitectura Nueva

### 3.1 Estructura de módulos creados

```
Pneumonias/
├── main.py                          ← Punto de entrada CLI unificado
├── pyproject.toml                   ← Configuración del proyecto y pytest
├── requirements.txt                 ← Reescrito en UTF-8 (TF añadido)
│
├── src/
│   ├── config/
│   │   ├── constants.py             ← REGIONS (25), TARGET_MAPPINGS (4 targets)
│   │   └── settings.py              ← Settings dataclass: rutas, hiperparámetros
│   │
│   ├── data/
│   │   └── preparation.py           ← build_processed_datasets(), load_clean_region_series()
│   │
│   ├── features/
│   │   ├── transforms.py            ← transform_y() / inverse_transform_y() (log1p/expm1)
│   │   └── engineering.py           ← create_ml_features(), make_next_feature_row(), create_lstm_sequences()
│   │
│   ├── evaluation/
│   │   └── metrics.py               ← safe_rmse(), safe_mae(), safe_r2(), compute_metrics_df()
│   │
│   ├── models/
│   │   ├── statistical.py           ← StatisticalForecaster (Naive, Seasonal Naive, HW, ARIMA)
│   │   ├── ml.py                    ← MLForecaster (Random Forest, XGBoost)
│   │   ├── dl.py                    ← LSTMForecaster
│   │   └── legacy/                  ← 12 scripts originales (preservados, sin modificaciones)
│   │
│   ├── pipelines/
│   │   └── runner.py                ← run_pipeline() — orquestador unificado
│   │
│   └── visualization/
│       └── plots.py                 ← plot_predictions(), plot_heatmap(), plot_anomalies()
│
└── tests/
    ├── conftest.py                  ← Fixtures sintéticas (350 semanas)
    ├── test_transforms.py           ← 2 tests
    ├── test_metrics.py              ← 3 tests
    ├── test_features.py             ← 3 tests
    ├── test_leakage.py              ← 2 tests (verificación metodológica)
    ├── test_data_pipeline.py        ← 2 tests
    └── test_models.py               ← 3 tests (Statistical, ML, LSTM)
```

### 3.2 Conteo de líneas — código nuevo vs. código original

| Módulo nuevo | Líneas |
|---|---|
| `src/config/constants.py` | 89 |
| `src/config/settings.py` | 65 |
| `src/data/preparation.py` | 120 |
| `src/features/transforms.py` | 11 |
| `src/features/engineering.py` | 93 |
| `src/evaluation/metrics.py` | 41 |
| `src/models/statistical.py` | 170 |
| `src/models/ml.py` | 135 |
| `src/models/dl.py` | 225 |
| `src/pipelines/runner.py` | 140 |
| `src/visualization/plots.py` | 253 |
| `main.py` | 59 |
| **Total código nuevo** | **1,401** |

**Reducción:** de ~9,219 líneas duplicadas (12 scripts) a 1,401 líneas modulares = **reducción del 84.8%**.  
Los 3 módulos de modelos (`statistical.py`, `ml.py`, `dl.py`) reemplazan con lógica parametrizada a 12 scripts monolíticos.

---

## 4. Correcciones Metodológicas Implementadas

### 4.1 Corrección de Data Leakage — Capping de Outliers

**Problema original:** El percentil 99 para truncamiento se calculaba sobre la serie completa antes de dividir train/test.

```python
# CÓDIGO ORIGINAL (incorrecto)
cap_val = np.percentile(serie_completa, 99)  # Usa datos futuros
train_capped = np.clip(train, 0, cap_val)
```

**Corrección implementada** (`src/models/statistical.py`, `src/models/ml.py`):

```python
# CÓDIGO NUEVO (correcto)
cap_val = np.percentile(train_original, settings.CAP_QUANTILE * 100)  # Solo ventana train
train_clean = np.clip(train_original, 0.0, cap_val)
```

### 4.2 Corrección de Teacher Forcing — ML Backtesting

**Problema original:** En la predicción multi-paso (H=4 semanas), los rezagos de cada paso se tomaban de los valores reales observados:

```python
# CÓDIGO ORIGINAL (Teacher Forcing — incorrecto en evaluación)
for i in range(horizonte):
    X_step = construir_features_desde_datos_reales(test_df.iloc[i])  # usa y_real futuro
    pred = model.predict(X_step)
```

**Corrección implementada** (`src/features/engineering.py`, `src/models/ml.py`):

```python
# CÓDIGO NUEVO (predicción recursiva autorregresiva — correcto)
y_accum = train_df["target_model"].tolist()
for i in range(horizonte):
    X_step = make_next_feature_row(y_accum, test_dates[i])  # solo histórico + predicciones previas
    pred = model.predict(X_step)[0]
    y_accum.append(transform_y([pred])[0])  # retroalimenta con pred, no con real
```

> **IMPORTANTE:** Esta corrección **cambia los valores de métricas** respecto al código original. Las métricas reportadas en la nueva arquitectura son más conservadoras y científicamente válidas.

### 4.3 Corrección de Memory Leak — LSTM

**Problema original:** Cada ventana de entrenamiento en el bucle de backtesting (169 ventanas) acumulaba un grafo TensorFlow en memoria, agotando RAM antes de completar las regiones `children_*`.

**Corrección implementada** (`src/models/dl.py`):

```python
import gc
import tensorflow as tf

# Al final de cada ventana de entrenamiento:
tf.keras.backend.clear_session()
gc.collect()
```

Adicionalmente, se redirige `KERAS_HOME` a un directorio local del proyecto para evitar errores de permisos:

```python
os.environ["KERAS_HOME"] = str(Path(__file__).parents[2] / ".keras")
```

---

## 5. Cambios en Archivos del Proyecto

### 5.1 Archivos nuevos creados

| Archivo | Estado |
|---|---|
| `main.py` | ✅ Creado |
| `pyproject.toml` | ✅ Creado |
| `src/__init__.py` | ✅ Creado |
| `src/config/__init__.py` | ✅ Creado |
| `src/config/constants.py` | ✅ Creado |
| `src/config/settings.py` | ✅ Creado |
| `src/data/__init__.py` | ✅ Creado |
| `src/data/preparation.py` | ✅ Creado |
| `src/features/__init__.py` | ✅ Creado |
| `src/features/transforms.py` | ✅ Creado |
| `src/features/engineering.py` | ✅ Creado |
| `src/evaluation/__init__.py` | ✅ Creado |
| `src/evaluation/metrics.py` | ✅ Creado |
| `src/models/__init__.py` | ✅ Creado |
| `src/models/statistical.py` | ✅ Creado |
| `src/models/ml.py` | ✅ Creado |
| `src/models/dl.py` | ✅ Creado |
| `src/pipelines/__init__.py` | ✅ Creado |
| `src/pipelines/runner.py` | ✅ Creado |
| `src/visualization/__init__.py` | ✅ Creado |
| `src/visualization/plots.py` | ✅ Creado |
| `tests/__init__.py` | ✅ Creado |
| `tests/conftest.py` | ✅ Creado |
| `tests/test_transforms.py` | ✅ Creado |
| `tests/test_metrics.py` | ✅ Creado |
| `tests/test_features.py` | ✅ Creado |
| `tests/test_leakage.py` | ✅ Creado |
| `tests/test_data_pipeline.py` | ✅ Creado |
| `tests/test_models.py` | ✅ Creado |
| `src/models/legacy/` (12 archivos) | ✅ Copiados (preservados) |

### 5.2 Archivos modificados

| Archivo | Cambio |
|---|---|
| `requirements.txt` | Reescrito en UTF-8 (era UTF-16LE con BOM). TensorFlow añadido. Dependencia `python-dotenv` deduplicada. |

### 5.3 Archivos NO modificados

- Todos los scripts en `src/models/` (12 archivos originales, intactos)
- `src/integrity/`, `src/outliers/`, `src/analysis/` (módulos existentes, sin tocar)
- `frontend/` (aplicación React — fuera del alcance)
- `.env` (credenciales — protegido)
- `data/raw/` (datos originales — protegidos)
- `outputs/` (resultados legacy — intactos)

---

## 6. Resultados de Pruebas Unitarias

```
platform win32 — Python 3.14.4, pytest-9.2.0
Entorno virtual: env/ (TensorFlow 2.22.0rc0, Keras-nightly 3.16.0)
```

| Archivo de test | Tests | Resultado |
|---|---|---|
| `tests/test_transforms.py` | 2 | ✅ PASSED |
| `tests/test_metrics.py` | 3 | ✅ PASSED |
| `tests/test_features.py` | 3 | ✅ PASSED |
| `tests/test_leakage.py` | 2 | ✅ PASSED |
| `tests/test_data_pipeline.py` | 2 | ✅ PASSED |
| `tests/test_models.py` | 3 | ✅ PASSED |
| **TOTAL** | **15** | **✅ 15/15 PASSED** |

**Tiempo de ejecución:** 24.72 segundos (suite completa).

### Cobertura de los tests

- `test_transforms.py` — Verifica round-trip `log1p → expm1`, compatibilidad con arrays numpy.
- `test_metrics.py` — Verifica RMSE, MAE, R² con valores conocidos; manejo de NaN; `compute_metrics_df()`.
- `test_features.py` — Verifica generación de lag features, rolling stats con `shift(1)`, `make_next_feature_row()`.
- `test_leakage.py` — Verifica que las rolling stats no utilizan observaciones futuras (`shift(1)` presente); verifica que `make_next_feature_row` construye features solo desde histórico pasado.
- `test_data_pipeline.py` — Verifica carga de parquet, integridad de columnas, cobertura regional.
- `test_models.py` — Verifica instanciación y ejecución de `StatisticalForecaster`, `MLForecaster` y `LSTMForecaster` con 1 ventana/1 época sobre datos sintéticos.

---

## 7. Verificación End-to-End del Pipeline

### 7.1 Ejecuciones verificadas

| Target | Familia | Región | Estado | Tiempo |
|---|---|---|---|---|
| `adults_death` | `statistical` | AREQUIPA | ✅ Completado | ~170s |
| `adults_death` | `ml` | AREQUIPA | ✅ Completado | ~141s |
| `adults_hosp` | `statistical` | LIMA | ✅ Completado | ~170s |

### 7.2 Salidas generadas

Para cada ejecución regional se generan los siguientes archivos en `outputs/{target}_{familia}_optimized/{region}/`:

- `{file_code}_predictions.csv` — Predicciones de backtesting por fecha
- `{file_code}_metrics.csv` — MAE, RMSE, R² por modelo
- `{file_code}_future_predictions.csv` — 52 semanas futuras
- `{file_code}_comparison_predictions.csv` — Comparativa de modelos por fecha
- `{file_code}_plot.png` — Serie temporal + tabla de métricas
- `{target}_heatmap.png` — Mapa de calor semana epidemiológica × año
- `{target}_anomalies.png` — Detección de anomalías (Z-Score)

Adicionalmente, se generan 4 CSVs globales consolidando todas las regiones en `outputs/{target}_{familia}_optimized/`.

---

## 8. Instrucciones de Uso

### 8.1 Requisitos previos

```powershell
# Activar el entorno virtual
.\env\Scripts\Activate.ps1
```

### 8.2 Preparar datos procesados (primera ejecución o tras cambio en raw)

```powershell
.\env\Scripts\python.exe main.py --build-data
```

Genera `data/processed/iras_department_weekly.parquet` con 23,425 registros semanales regionales.

### 8.3 Ejecutar modelos

```powershell
# Modelos estadísticos — un target, una región
.\env\Scripts\python.exe main.py --target adults_death --family statistical --region LIMA

# ML — todas las regiones (25 departamentos)
.\env\Scripts\python.exe main.py --target children_hosp --family ml

# LSTM — sin gráficos (más rápido)
.\env\Scripts\python.exe main.py --target adults_hosp --family lstm --region AREQUIPA --no-plots

# Modo rápido (solo métricas, sin outputs en disco)
.\env\Scripts\python.exe main.py --target adults_death --family statistical --no-csv --no-plots
```

### 8.4 Parámetros de `main.py`

| Parámetro | Opciones | Descripción |
|---|---|---|
| `--target` | `adults_death`, `adults_hosp`, `children_death`, `children_hosp` | Objetivo epidemiológico |
| `--family` | `statistical`, `ml`, `lstm` | Familia de modelos |
| `--region` | Nombre del departamento (ej: LIMA, AREQUIPA) | Si se omite, procesa las 25 regiones |
| `--build-data` | — | Reconstruye el parquet procesado antes de modelar |
| `--no-plots` | — | Omite generación de gráficos |
| `--no-csv` | — | Omite exportación de CSVs |

### 8.5 Ejecutar las pruebas unitarias

```powershell
# Recomendado: ejecutar por archivo (evita timeout por carga de TensorFlow)
.\env\Scripts\python.exe -m pytest tests\test_transforms.py -v
.\env\Scripts\python.exe -m pytest tests\test_metrics.py -v
.\env\Scripts\python.exe -m pytest tests\test_features.py -v
.\env\Scripts\python.exe -m pytest tests\test_leakage.py -v
.\env\Scripts\python.exe -m pytest tests\test_data_pipeline.py -v
.\env\Scripts\python.exe -m pytest tests\test_models.py -v
```

---

## 9. Problemas Conocidos y Pendientes

### 9.1 Validación pendiente

| Combinación | Estado | Notas |
|---|---|---|
| `adults_death` — `statistical` — AREQUIPA | ✅ Verificado | |
| `adults_death` — `ml` — AREQUIPA | ✅ Verificado | |
| `adults_hosp` — `statistical` — LIMA | ✅ Verificado | |
| `children_death` — `statistical` | ⏳ Pendiente | Se espera funcionar (misma implementación) |
| `children_hosp` — `statistical` | ⏳ Pendiente | Se espera funcionar (misma implementación) |
| `adults_hosp` — `ml` | ⏳ Pendiente | |
| `children_*` — `ml` | ⏳ Pendiente | |
| Familia `lstm` — cualquier target | ⏳ Pendiente run completo | ~30-60min por región; fix de memory leak implementado |

### 9.2 Aviso de matplotlib (no crítico)

```
C:\Users\USER\.matplotlib is not a writable directory
```

No afecta la ejecución (matplotlib usa directorio temporal). Para suprimir, añadir en `src/visualization/plots.py`:

```python
_mpl_cache = Path(__file__).parents[2] / ".matplotlib_cache"
_mpl_cache.mkdir(exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(_mpl_cache))
```

### 9.3 Diferencia en métricas respecto a scripts originales

Las métricas de los modelos ML **serán diferentes** (típicamente más conservadoras) respecto a los scripts originales. Esto es **esperado y correcto**: la diferencia refleja la eliminación del Teacher Forcing y del Data Leakage, que inflaban el rendimiento medido artificialmente.

---

## 10. Decisiones Arquitectónicas

| Decisión | Justificación |
|---|---|
| Un `StatisticalForecaster`, un `MLForecaster`, un `LSTMForecaster` | Evita sobre-ingeniería; la diferencia metodológica entre familias justifica clases separadas |
| Target como parámetro en `run_pipeline()`, no en la clase de modelo | Desacopla el objetivo epidemiológico de la implementación del algoritmo |
| `make_next_feature_row()` separada de `create_ml_features()` | Reutilizable tanto en backtesting como en predicción futura |
| `shift(1)` en todas las rolling windows de features | Garantiza ausencia de data leakage en variables derivadas de ventanas móviles |
| `clear_session()` + `gc.collect()` tras cada ventana LSTM | Único mecanismo confiable para liberar el grafo TF en bucles de backtesting largos |
| Scripts originales preservados en `src/models/` y `src/models/legacy/` | Garantía de no pérdida de trabajo previo; `legacy/` es la copia archivada explícita |

---

## 11. Resumen de Métricas de Calidad

| Métrica | Antes | Después |
|---|---|---|
| Scripts de modelos | 12 (1 por target × familia) | 3 (parametrizados por target) |
| Líneas de código (modelos) | ~9,219 | ~530 (`statistical` + `ml` + `dl`) |
| Líneas totales (arquitectura nueva) | 0 | 1,401 |
| Reducción de código duplicado | — | **84.8%** |
| Data leakage en outliers | ❌ Presente | ✅ Eliminado |
| Teacher Forcing en ML backtesting | ❌ Presente | ✅ Eliminado |
| Memory leak LSTM | ❌ Presente | ✅ Corregido |
| Punto de entrada unificado | ❌ No | ✅ `main.py` con CLI argparse |
| Configuración centralizada | ❌ No | ✅ `Settings` dataclass + `constants.py` |
| Tests automatizados | ❌ 0 | ✅ 15 tests (15/15 pasados) |
| Compatibilidad de targets | ❌ Hardcoded | ✅ `TARGET_MAPPINGS` dict configurable |
| `requirements.txt` operativo | ❌ UTF-16LE | ✅ UTF-8, TF incluido |

---

*Reporte generado como entregable de la FASE 5 — Documentación del plan de refactorización acordado.*

