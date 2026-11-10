# Glosario Exhaustivo de Comandos del Sistema

Este documento proporciona una referencia unificada de los comandos operativos para la gestión, procesamiento, modelado, prueba y visualización del sistema de predicción epidemiológica.

Los comandos están redactados para **PowerShell en sistemas Windows**.

### Leyenda de Estado y Costo

| Símbolo | Significado de "En este repo" |
| :---: | :--- |
| **✅** | **Disponible aquí:** Funcional y operable directamente en esta estructura. |
| **⚠️** | **Requiere dependencias adicionales:** Comando del sistema que requiere recursos o configuraciones complementarias. |
| **🧭** | **Propuesto / No implementado:** Componente de arquitectura futura documentado pero no construido. |

| Símbolo | Significado de "Costo" |
| :---: | :--- |
| **🟢** | **Gratis / Rápido:** Ejecución inmediata en segundos, nulo o mínimo consumo de cómputo. |
| **🟡** | **Moderado:** Tiempo de cómputo medio (~2 a 3 minutos por región sanitaria). |
| **🔴** | **Alto:** Consumo computacional elevado (~30 a 60 minutos por región, o alta carga de CPU/GPU). |

---

## A. Entorno Python y Configuración del Sistema

Comandos para la preparación del entorno virtual, directorios locales y dependencias del motor analítico.

| Comando exacto | Qué hace | Cuándo usarlo | Costo | En este repo |
| :--- | :--- | :--- | :---: | :---: |
| `mkdir data/raw, data/processed, data/external, notebooks, models -Force` | Crea la jerarquía de directorios requerida para datos y artefactos de modelos. | En la configuración inicial del proyecto antes de procesar o entrenar. | 🟢 | ✅ |
| `python -m venv venv` | Crea un entorno virtual estándar denominado `venv`. | Durante la configuración inicial del entorno de desarrollo. | 🟢 | ✅ |
| `virtualenv .` | Crea un entorno virtual en la raíz utilizando `virtualenv`. | Alternativa en entornos donde se use virtualenv. | 🟢 | ✅ |
| `.\venv\Scripts\Activate.ps1` | Activa el entorno virtual estándar `venv` en la sesión actual de PowerShell. | Antes de ejecutar scripts de Python o instalar paquetes en `venv`. | 🟢 | ✅ |
| `.\env\Scripts\Activate.ps1` | Activa la variante de entorno virtual denominada `env` (usada si el entorno se nombró `env`). | Cuando el entorno local se haya creado bajo la carpeta `env` en lugar de `venv`. | 🟢 | ✅ |
| `pip install -r requirements.txt` | Instala las dependencias analíticas (Pandas, Polars, Scikit-Learn, XGBoost, TensorFlow, etc.) codificadas en UTF-8. *(Nota: versiones como Python 3.14.4, TensorFlow 2.22.0rc0, Keras-nightly 3.16.0, Polars 1.40.1, Pandas 3.0.2, Numpy 2.4.4 representan builds de referencia [POR CONFIRMAR en producción]).* | Al configurar o actualizar dependencias de Python. | 🟡 | ✅ |
| `python -m compileall -q main.py src tests` | Compila todos los archivos de Python a bytecode para verificar sintaxis e imports sin ejecutar cómputo. | Para verificación estática de integridad del código. | 🟢 | ✅ |

---

## B. Datos Locales y Procesamiento

El sistema trabaja exclusivamente con datos locales versionados en `data/` sin dependencias de bases de datos externas.

| Comando exacto | Qué hace | Cuándo usarlo | Costo | En este repo |
| :--- | :--- | :--- | :---: | :---: |
| `Get-ChildItem data\raw` | Lista los archivos Parquet crudos disponibles (`iras_data_raw_temp.parquet`, `population_dept_long.parquet`, etc.). | Para verificar la presencia de los insumos locales. | 🟢 | ✅ |
| `Get-ChildItem data\processed` | Lista el dataset procesado consolidado (`iras_department_weekly.parquet`). | Para verificar que el dataset procesado esté disponible. | 🟢 | ✅ |
| `python main.py --build-data` | Transforma y agrega los datos crudos locales generando el dataset `data/processed/iras_department_weekly.parquet` (23,425 registros semanales). *(No ejecutado al preparar el repositorio).* | Cuando se requiera regenerar el dataset procesado desde los Parquet crudos. | 🟡 | ✅ |
| `python -m src.integrity.validation` *(POR CONFIRMAR: sin CLI formal expuesto)* | Ejecuta la auditoría de esquemas, coherencia epidemiológica y silencios de reporte sobre los Parquet locales. | Auditorías de calidad de datos previas a la limpieza. | 🟢 | ✅ |
| `python -m src.integrity.cleaning` *(POR CONFIRMAR: sin CLI formal expuesto)* | Aplica las reglas de deduplicación y saneamiento sobre los datos locales. | Depuración y saneamiento de series. | 🟡 | ✅ |
| `python -m src.outliers.detection` *(POR CONFIRMAR: sin CLI formal expuesto)* | Aplica los 5 algoritmos de detección de valores atípicos (IQR, MAD, Rolling, Seasonal, IForest) sobre las series locales. | Análisis exploratorio de anomalías históricas. | 🟡 | ✅ |

---

## C. Ejecución de Modelos Predictivos

Plantilla general de invocación:
```powershell
python main.py --target <TARGET> --family <FAMILIA> [--region <DEPARTAMENTO>] [--no-plots] [--no-csv] [--build-data]
```

### Parámetros Disponibles

* `--target`: `adults_death`, `adults_hosp`, `children_death`, `children_hosp`.
* `--family`: `statistical` (Naive, Seasonal Naive, Holt-Winters, ARIMA), `ml` (Random Forest, XGBoost), `lstm` (Deep Learning).
* `--region`: Nombre en mayúsculas del departamento (ej. `LIMA`, `AREQUIPA`). Si se omite o se indica `all`, procesa secuencialmente los 25 departamentos del Perú.
* `--no-plots`: Omite la renderización de figuras PNG para acelerar el procesamiento.
* `--no-csv`: Omite la persistencia de tablas CSV.
* `--build-data`: Fuerza la reconstrucción previa del parquet semanal procesado a partir de los datos crudos locales.

### Matriz Completa de Comandos (4 Targets × 3 Familias)

| N° | Objetivo (`--target`) | Familia (`--family`) | Comando sugerido | Costo por región | En este repo | Estado de validación empírica |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| 1 | `adults_death` | `statistical` | `python main.py --target adults_death --family statistical --region AREQUIPA` | 🟡 (~170 s) | ✅ | ✅ Verificado end-to-end |
| 2 | `adults_death` | `ml` | `python main.py --target adults_death --family ml --region AREQUIPA` | 🟡 (~141 s) | ✅ | ✅ Verificado end-to-end |
| 3 | `adults_death` | `lstm` | `python main.py --target adults_death --family lstm --region AREQUIPA --no-plots` | 🔴 (~30–60 min) | ✅ | ⏳ Pendiente corrida completa |
| 4 | `adults_hosp` | `statistical` | `python main.py --target adults_hosp --family statistical --region LIMA` | 🟡 (~170 s) | ✅ | ✅ Verificado end-to-end |
| 5 | `adults_hosp` | `ml` | `python main.py --target adults_hosp --family ml --region LIMA` | 🟡 (~141 s) | ✅ | ⏳ Pendiente corrida regional |
| 6 | `adults_hosp` | `lstm` | `python main.py --target adults_hosp --family lstm --region LIMA --no-plots` | 🔴 (~30–60 min) | ✅ | ⏳ Pendiente corrida completa |
| 7 | `children_death` | `statistical` | `python main.py --target children_death --family statistical --region LIMA` | 🟡 (~170 s) | ✅ | ⏳ Configuración verificada |
| 8 | `children_death` | `ml` | `python main.py --target children_death --family ml --region LIMA` | 🟡 (~141 s) | ✅ | ⏳ Configuración verificada |
| 9 | `children_death` | `lstm` | `python main.py --target children_death --family lstm --region LIMA --no-plots` | 🔴 (~30–60 min) | ✅ | ⏳ Pendiente corrida completa |
| 10 | `children_hosp` | `statistical` | `python main.py --target children_hosp --family statistical --region LIMA` | 🟡 (~170 s) | ✅ | ⏳ Configuración verificada |
| 11 | `children_hosp` | `ml` | `python main.py --target children_hosp --family ml --region LIMA` | 🟡 (~141 s) | ✅ | ⏳ Configuración verificada |
| 12 | `children_hosp` | `lstm` | `python main.py --target children_hosp --family lstm --region LIMA --no-plots` | 🔴 (~30–60 min) | ✅ | ⏳ Pendiente corrida completa |

### Ejemplos Prácticos de Ejecución

* **Ejecución rápida de prueba (sin gráficos ni CSVs):**
  ```powershell
  python main.py --target adults_death --family statistical --region LIMA --no-plots --no-csv
  ```
* **Ejecución de ML sobre las 25 regiones sanitarias:**
  ```powershell
  python main.py --target children_hosp --family ml
  ```
* **Ejecución de Deep Learning en Arequipa sin gráficos:**
  ```powershell
  python main.py --target adults_death --family lstm --region AREQUIPA --no-plots
  ```

### Estructura de Salidas Generadas

Cada ejecución regional exitosa almacena sus artefactos en:  
`outputs/{target}_{familia}_optimized/{region}/`
- `{file_code}_predictions.csv`: Predicciones del backtesting temporal por fecha.
- `{file_code}_metrics.csv`: MAE, RMSE y $R^2$ por modelo.
- `{file_code}_future_predictions.csv`: Proyección autorregresiva a 52 semanas.
- `{file_code}_comparison_predictions.csv`: Matriz comparativa alineada por fecha.
- `{file_code}_plot.png`: Curva temporal histórica vs pronóstico con tabla de métricas.
- `{target}_heatmap.png`: Mapa de calor estacional año × semana epidemiológica.
- `{target}_anomalies.png`: Gráfico de clasificación de anomalías epidemiológicas (Z-Score).

Adicionalmente, se consolidan 4 archivos CSV globales en la raíz de `outputs/{target}_{familia}_optimized/`.

---

## D. Pruebas Automatizadas (Testing)

Para evitar demoras o saturación de memoria por la carga de TensorFlow, se recomienda ejecutar las pruebas de forma modular por archivo:

| Comando exacto | Qué verifica | Costo | En este repo |
| :--- | :--- | :---: | :---: |
| `python -m pytest tests\test_transforms.py -v` | Inversión matemática `log1p` / `expm1` y estabilidad numérica. | 🟢 (~1 s) | ✅ |
| `python -m pytest tests\test_metrics.py -v` | Cálculo correcto de MAE, RMSE y $R^2$, gestión de nulos y tolerancia a cero. | 🟢 (~1 s) | ✅ |
| `python -m pytest tests\test_features.py -v` | Creación de lags, estadísticas móviles y vector de inferencia recursiva. | 🟢 (~1 s) | ✅ |
| `python -m pytest tests\test_leakage.py -v` | Ausencia estricta de fuga temporal (*lookahead bias* en rolling stats y autorregresión). | 🟢 (~1 s) | ✅ |
| `python -m pytest tests\test_data_pipeline.py -v` | Carga de datos, esquema de columnas y consistencia regional sobre datos locales. | 🟢 (~2 s) | ✅ |
| `python -m pytest tests\test_models.py -v` | Instanciación y fit de `StatisticalForecaster`, `MLForecaster` y `LSTMForecaster`. | 🔴 (~20 s, carga TF) | ✅ |
| `python -m pytest tests\ -v` | Suite completa de 15 pruebas unitarias e integración (~25 segundos). | 🟡 (~25 s) | ✅ |

---

## E. Frontend (React + Vite + TypeScript)

Comandos para la instalación, desarrollo y compilación de la interfaz de usuario en `frontend/`.

| Comando exacto | Qué hace | Cuándo usarlo | Costo | En este repo |
| :--- | :--- | :--- | :---: | :---: |
| `npm install` | Instala las dependencias del frontend registradas en `package.json` y `package-lock.json`. | Configuración inicial del frontend o tras modificar dependencias. | 🟢 | ✅ |
| `npm run dev` | Inicia el servidor local de desarrollo de Vite con recarga rápida (HMR), habitualmente en `http://localhost:5173`. | Durante el desarrollo o visualización del dashboard. Funciona con `USE_MOCK = true` sin backend. | 🟢 | ✅ |
| `npm run build` | Ejecuta la verificación de tipos TypeScript (`tsc -b`) y empaqueta la aplicación optimizada en `frontend/dist/`. | Verificación de compilación antes de publicar o desplegar. | 🟢 | ✅ |
| `npm run preview` | Levanta un servidor HTTP local para servir el contenido estático generado en `dist/`. | Para probar localmente la versión de producción empaquetada. | 🟢 | ✅ |
| `npm run lint` | Ejecuta el linter ESLint sobre los archivos de código fuente (`.ts`, `.tsx`). | Control estático de calidad y estilo de código. | 🟢 | ✅ |

### Integración con Backend Real (Arquitectura Futura)

1. En `frontend/src/services/api.ts`, cambiar `const USE_MOCK = false;`.
2. El cliente enviará peticiones HTTP al microservicio FastAPI en `http://localhost:8000/api`:
   - `/api/regiones`: Lista de los 25 departamentos.
   - `/api/categorias`: Objetivos disponibles (`adults_death`, etc.).
   - `/api/modelos`: Metadatos de algoritmos implementados.
   - `/api/metricas`, `/api/datos`, `/api/predicciones`, `/api/heatmap`, `/api/anomalias`, `/api/mapa-peru`.
3. Comando propuesto para iniciar el backend FastAPI *(🧭 Propuesto / No implementado aún)*:
   ```powershell
   uvicorn src.api.main:app --reload --port 8000
   ```

---

## F. Control de Versiones (Git)

Comandos para la administración segura del repositorio.

| Comando exacto | Qué hace | Cuándo usarlo | Costo | En este repo |
| :--- | :--- | :--- | :---: | :---: |
| `git status` | Muestra el estado del árbol de trabajo y archivos preparados. | Antes y después de cualquier modificación. | 🟢 | ✅ |
| `git add <archivo>` / `git add .` | Añade cambios al área de preparación (stage). | Al preparar commits puntuales. | 🟢 | ✅ |
| `git commit -m "Mensaje descriptivo"` | Registra un commit con mensaje neutral y atómico. | Tras completar una tarea o corrección verificada. | 🟢 | ✅ |
| `git log --oneline -n 10` | Muestra el historial compacto de los últimos 10 commits. | Verificación de la cronología de cambios. | 🟢 | ✅ |
| `git remote -v` | Muestra las URLs de los repositorios remotos configurados. | Verificación de sincronización remota. | 🟢 | ✅ |

> **Regla de seguridad:** Nunca versionar archivos `.env`, modelos compilados en `models/`, carpetas de salida `outputs/`, `reports/` ni entornos virtuales en `env/` o `venv/`. Los datos en `data/` se encuentran versionados localmente.

---

## G. Resolución de Problemas Frecuentes (Troubleshooting)

### 1. Error de Política de Ejecución de Scripts en PowerShell
* **Síntoma:** `.\Activate.ps1 : no se puede cargar porque la ejecución de scripts está deshabilitada en este sistema`.
* **Solución:** Habilitar la ejecución para el proceso en curso sin alterar la configuración del sistema global:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```

### 2. Advertencia de Directorio no Escribible en Matplotlib
* **Síntoma:** `C:\Users\...\.matplotlib is not a writable directory`.
* **Causa:** En entornos restringidos, el directorio home no tiene permisos de escritura.
* **Solución:** Definir la variable `MPLCONFIGDIR` hacia una carpeta temporal o local en el script:
  ```powershell
  $env:MPLCONFIGDIR = "$PWD\.matplotlib_cache"
  ```

### 3. Error de Permisos en Configuración de Keras
* **Síntoma:** `PermissionError: [Errno 13] Permission denied: '...\.keras\keras.json'`.
* **Solución:** Redirigir `KERAS_HOME` hacia el espacio de trabajo local antes de importar TensorFlow:
  ```python
  import os
  from pathlib import Path
  os.environ["KERAS_HOME"] = str(Path.cwd() / ".keras")
  ```

### 4. Pip Falla con Error de Decodificación en `requirements.txt`
* **Síntoma:** `UnicodeDecodeError: 'utf-8' codec can't decode byte ...` al ejecutar `pip install`.
* **Causa:** Archivo guardado originalmente en UTF-16LE con BOM.
* **Solución:** Reconvertir el archivo a UTF-8 estándar sin BOM mediante PowerShell:
  ```powershell
  $content = Get-Content requirements.txt -Encoding Unicode
  Set-Content -Path requirements.txt -Value $content -Encoding UTF8
  ```

### 5. Puerto 5173 u 8000 en Uso (Vite o FastAPI)
* **Síntoma:** `Port 5173 is in use, trying another one...` o `EADDRINUSE`.
* **Solución:** Identificar el proceso que ocupa el puerto y finalizarlo, o arrancar en un puerto alternativo:
  ```powershell
  # Para Vite
  npm run dev -- --port 5174
  ```

### 6. Errores de CORS al Cambiar a `USE_MOCK = false`
* **Síntoma:** `Access to fetch at 'http://localhost:8000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy`.
* **Solución:** Configurar `CORSMiddleware` en el servicio FastAPI autorizando `http://localhost:5173`.

### 7. Timeout o Demora Prolongada en Pytest
* **Síntoma:** `pytest` tarda más de un minuto o se congela durante la recolección de pruebas.
* **Causa:** La importación de TensorFlow y Keras genera una sobrecarga en la inicialización de módulos.
* **Solución:** Ejecutar los archivos de prueba individualmente:
  ```powershell
  python -m pytest tests\test_transforms.py tests\test_metrics.py tests\test_features.py -v
  ```
