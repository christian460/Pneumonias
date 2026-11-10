// API service — uses mock data until a real backend exists.
// Switch USE_MOCK to false and configure API_URL when FastAPI is ready.

import {
  REGIONS,
  CATEGORIAS,
  MODELOS,
  METRICAS,
  HISTORICO,
  PREDICCIONES,
  obtenerResumenDashboard,
  generateHeatmapData,
  generateAnomaliasData,
  generateDatosMapa,
  ANOMALY_COLOR_MAP,
  type Categoria,
  type MetricaModelo,
  type DatoHistorico,
  type Prediccion,
  type ResumenDashboard,
  type ModeloInfo,
  type HeatmapData,
  type AnomaliaPoint,
  type AnomalyClassification,
} from "./mockData";

const API_URL = "http://localhost:8000";
const USE_MOCK = true;

// ---------- API functions ----------

export async function obtenerRegiones(): Promise<string[]> {
  if (USE_MOCK) return REGIONS;

  const res = await fetch(`${API_URL}/api/regiones`);
  if (!res.ok) throw new Error("Error al obtener regiones");
  return res.json();
}

export async function obtenerCategorias() {
  if (USE_MOCK) return CATEGORIAS;

  const res = await fetch(`${API_URL}/api/categorias`);
  if (!res.ok) throw new Error("Error al obtener categorías");
  return res.json();
}

export async function obtenerModelos(): Promise<ModeloInfo[]> {
  if (USE_MOCK) return MODELOS;

  const res = await fetch(`${API_URL}/api/modelos`);
  if (!res.ok) throw new Error("Error al obtener modelos");
  return res.json();
}

export async function obtenerMetricas(
  categoria?: Categoria,
  region?: string
): Promise<MetricaModelo[]> {
  if (USE_MOCK) {
    let data = METRICAS;
    if (categoria) data = data.filter((m) => m.categoria === categoria);
    if (region) {
      const regNorm = region.trim().toUpperCase();
      data = data.filter((m) => m.region.toUpperCase() === regNorm);
    }
    return data;
  }

  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (region) params.set("region", region);

  const res = await fetch(`${API_URL}/api/metricas?${params}`);
  if (!res.ok) throw new Error("Error al obtener métricas");
  return res.json();
}

export async function obtenerDatos(
  categoria?: Categoria,
  region?: string
): Promise<DatoHistorico[]> {
  if (USE_MOCK) {
    let data = HISTORICO;
    if (categoria) data = data.filter((d) => d.categoria === categoria);
    if (region) {
      const regNorm = region.trim().toUpperCase();
      data = data.filter((d) => d.region.toUpperCase() === regNorm);
    }
    return data;
  }

  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (region) params.set("region", region);

  const res = await fetch(`${API_URL}/api/datos?${params}`);
  if (!res.ok) throw new Error("Error al obtener datos");
  return res.json();
}

export async function obtenerPredicciones(
  categoria?: Categoria,
  region?: string,
  modelo?: string
): Promise<Prediccion[]> {
  if (USE_MOCK) {
    let data = PREDICCIONES;
    if (categoria) data = data.filter((p) => p.categoria === categoria);
    if (region) {
      const regNorm = region.trim().toUpperCase();
      data = data.filter((p) => p.region.toUpperCase() === regNorm);
    }
    if (modelo) data = data.filter((p) => p.modelo === modelo);
    return data;
  }

  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (region) params.set("region", region);
  if (modelo) params.set("modelo", modelo);

  const res = await fetch(`${API_URL}/api/predicciones?${params}`);
  if (!res.ok) throw new Error("Error al obtener predicciones");
  return res.json();
}

export async function obtenerResumen(): Promise<ResumenDashboard[]> {
  if (USE_MOCK) return obtenerResumenDashboard();

  const res = await fetch(`${API_URL}/api/resumen`);
  if (!res.ok) throw new Error("Error al obtener resumen");
  return res.json();
}

export async function obtenerHeatmap(
  categoria: Categoria = "adults_death",
  region: string = "AREQUIPA"
): Promise<HeatmapData> {
  if (USE_MOCK) return generateHeatmapData(categoria, region);

  const params = new URLSearchParams({ categoria, region });
  const res = await fetch(`${API_URL}/api/heatmap?${params}`);
  if (!res.ok) throw new Error("Error al obtener mapa de calor");
  return res.json();
}

export async function obtenerAnomalias(
  categoria: Categoria = "adults_death",
  region: string = "AREQUIPA"
): Promise<AnomaliaPoint[]> {
  if (USE_MOCK) return generateAnomaliasData(categoria, region);

  const params = new URLSearchParams({ categoria, region });
  const res = await fetch(`${API_URL}/api/anomalias?${params}`);
  if (!res.ok) throw new Error("Error al obtener anomalías");
  return res.json();
}

export async function obtenerDatosMapa(
  categoria: Categoria = "adults_death"
): Promise<Record<string, number>> {
  if (USE_MOCK) return generateDatosMapa(categoria);

  const params = new URLSearchParams({ categoria });
  const res = await fetch(`${API_URL}/api/mapa-peru?${params}`);
  if (!res.ok) throw new Error("Error al obtener datos del mapa");
  return res.json();
}

export {
  ANOMALY_COLOR_MAP,
  type Categoria,
  type MetricaModelo,
  type DatoHistorico,
  type Prediccion,
  type ResumenDashboard,
  type ModeloInfo,
  type HeatmapData,
  type AnomaliaPoint,
  type AnomalyClassification,
};