// Mock data structured to match the real Python prediction models.
// Replace with API calls when backend is ready.

export const REGIONS = [
  "AMAZONAS", "ANCASH", "APURIMAC", "AREQUIPA", "AYACUCHO",
  "CAJAMARCA", "CALLAO", "CUSCO", "HUANCAVELICA", "HUANUCO",
  "ICA", "JUNIN", "LA LIBERTAD", "LAMBAYEQUE", "LIMA",
  "LORETO", "MADRE DE DIOS", "MOQUEGUA", "PASCO", "PIURA",
  "PUNO", "SAN MARTIN", "TACNA", "TUMBES", "UCAYALI",
];

export type Categoria = "adults_death" | "adults_hosp" | "children_death" | "children_hosp";

export const CATEGORIAS: { key: Categoria; label: string; poblacion: string; indicador: string }[] = [
  { key: "adults_death", label: "Defunciones Adultos 60+", poblacion: "Adultos", indicador: "Defunciones" },
  { key: "adults_hosp", label: "Hospitalizaciones Adultos 60+", poblacion: "Adultos", indicador: "Hospitalizaciones" },
  { key: "children_death", label: "Defunciones Niños <5", poblacion: "Niños", indicador: "Defunciones" },
  { key: "children_hosp", label: "Hospitalizaciones Niños <5", poblacion: "Niños", indicador: "Hospitalizaciones" },
];

export interface ModeloInfo {
  key: string;
  nombre: string;
  tipo: "estadistico" | "ml";
  descripcion: string;
  categoria: Categoria;
}

export const MODELOS: ModeloInfo[] = [
  // Estadísticos (baseline_stats)
  { key: "naive", nombre: "Naive", tipo: "estadistico", descripcion: "Repite el último valor observado como predicción.", categoria: "adults_death" },
  { key: "seasonal_naive", nombre: "Seasonal Naive", tipo: "estadistico", descripcion: "Repite el valor de la misma semana epidemiológica del periodo anterior.", categoria: "adults_death" },
  { key: "holt_winters", nombre: "Holt-Winters", tipo: "estadistico", descripcion: "Suavizado exponencial triple con tendencia amortiguada y estacionalidad aditiva (periodo=52 semanas).", categoria: "adults_death" },
  { key: "arima", nombre: "ARIMA", tipo: "estadistico", descripcion: "Modelo autorregresivo integrado de media móvil. Se selecciona el mejor orden por AIC entre múltiples candidatos.", categoria: "adults_death" },
  // ML
  { key: "random_forest", nombre: "Random Forest", tipo: "ml", descripcion: "Ensamble de 100 árboles de decisión con features de lag, rolling y estacionalidad.", categoria: "adults_death" },
  { key: "xgboost", nombre: "XGBoost", tipo: "ml", descripcion: "Gradient boosting con 100 estimadores, learning rate 0.03, regularización L1/L2.", categoria: "adults_death" },
];

export interface MetricaModelo {
  region: string;
  categoria: Categoria;
  modelo: string;
  modeloNombre: string;
  tipo: "estadistico" | "ml";
  mae: number;
  rmse: number;
  r2: number;
}

// Seed-based pseudo-random for deterministic mock data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateMetricas(): MetricaModelo[] {
  const rand = seededRandom(42);
  const rows: MetricaModelo[] = [];

  const modelDefs = [
    { key: "naive", nombre: "Naive", tipo: "estadistico" as const },
    { key: "seasonal_naive", nombre: "Seasonal Naive", tipo: "estadistico" as const },
    { key: "holt_winters", nombre: "Holt-Winters", tipo: "estadistico" as const },
    { key: "arima", nombre: "ARIMA", tipo: "estadistico" as const },
    { key: "random_forest", nombre: "Random Forest", tipo: "ml" as const },
    { key: "xgboost", nombre: "XGBoost", tipo: "ml" as const },
  ];

  for (const cat of CATEGORIAS) {
    for (const region of REGIONS) {
      for (const m of modelDefs) {
        const baseMae = m.tipo === "ml" ? 0.3 + rand() * 0.5 : 0.5 + rand() * 1.0;
        const baseRmse = baseMae * (1.1 + rand() * 0.4);
        const baseR2 = m.tipo === "ml" ? 0.65 + rand() * 0.3 : 0.3 + rand() * 0.5;

        rows.push({
          region,
          categoria: cat.key,
          modelo: m.key,
          modeloNombre: m.nombre,
          tipo: m.tipo,
          mae: Math.round(baseMae * 1000) / 1000,
          rmse: Math.round(baseRmse * 1000) / 1000,
          r2: Math.round(Math.min(baseR2, 0.99) * 1000) / 1000,
        });
      }
    }
  }

  return rows;
}

export const METRICAS: MetricaModelo[] = generateMetricas();

export interface DatoHistorico {
  fecha: string;
  semana: number;
  ano: number;
  region: string;
  categoria: Categoria;
  incidencia: number;
}

function generateHistorico(): DatoHistorico[] {
  const rows: DatoHistorico[] = [];

  for (let rIdx = 0; rIdx < REGIONS.length; rIdx++) {
    const region = REGIONS[rIdx];
    const rand = seededRandom(rIdx * 7919 + 123);

    for (const cat of CATEGORIAS) {
      const baseLevel = cat.key.includes("death") ? 1.5 : 8.0;
      const isChildren = cat.key.includes("children");
      const regionalFactor = 0.7 + (rIdx % 7) * 0.1;
      const factor = (isChildren ? 0.6 : 1.0) * regionalFactor;

      for (let year = 2006; year <= 2023; year++) {
        for (let week = 1; week <= 52; week++) {
          const seasonal = Math.sin((2 * Math.PI * week) / 52) * baseLevel * 0.3;
          const trend = (year - 2006) * 0.02;
          const noise = (rand() - 0.5) * baseLevel * 0.2;
          const value = Math.max(0, (baseLevel + seasonal + trend + noise) * factor);

          const date = new Date(year, 0, 1 + (week - 1) * 7);
          rows.push({
            fecha: date.toISOString().split("T")[0],
            semana: week,
            ano: year,
            region,
            categoria: cat.key,
            incidencia: Math.round(value * 1000) / 1000,
          });
        }
      }
    }
  }

  return rows;
}

export const HISTORICO: DatoHistorico[] = generateHistorico();

export interface Prediccion {
  fecha: string;
  region: string;
  categoria: Categoria;
  modelo: string;
  modeloNombre: string;
  actual: number;
  predicho: number;
}

function generatePredicciones(): Prediccion[] {
  const rows: Prediccion[] = [];

  const modelDefs = [
    { key: "naive", nombre: "Naive" },
    { key: "seasonal_naive", nombre: "Seasonal Naive" },
    { key: "holt_winters", nombre: "Holt-Winters" },
    { key: "arima", nombre: "ARIMA" },
    { key: "random_forest", nombre: "Random Forest" },
    { key: "xgboost", nombre: "XGBoost" },
  ];

  for (let rIdx = 0; rIdx < REGIONS.length; rIdx++) {
    const region = REGIONS[rIdx];
    const rand = seededRandom(rIdx * 7919 + 456);

    for (const cat of CATEGORIAS) {
      const baseLevel = cat.key.includes("death") ? 1.5 : 8.0;
      const isChildren = cat.key.includes("children");
      const regionalFactor = 0.7 + (rIdx % 7) * 0.1;
      const factor = (isChildren ? 0.6 : 1.0) * regionalFactor;

      // Future predictions: 52 weeks from end of 2023
      for (let week = 1; week <= 52; week++) {
        const date = new Date(2024, 0, 1 + (week - 1) * 7);
        const fecha = date.toISOString().split("T")[0];
        const seasonal = Math.sin((2 * Math.PI * week) / 52) * baseLevel * 0.3;

        for (const m of modelDefs) {
          const noise = (rand() - 0.5) * baseLevel * 0.15;
          const value = Math.max(0, (baseLevel + seasonal + noise) * factor);

          rows.push({
            fecha,
            region,
            categoria: cat.key,
            modelo: m.key,
            modeloNombre: m.nombre,
            actual: 0,
            predicho: Math.round(value * 1000) / 1000,
          });
        }
      }
    }
  }

  return rows;
}

export const PREDICCIONES: Prediccion[] = generatePredicciones();

// Dashboard summary data
export interface ResumenDashboard {
  categoria: Categoria;
  categoriaLabel: string;
  poblacion: string;
  indicador: string;
  regiones: number;
  periodo: string;
  mejorModelo: string;
  mejorR2: number;
  mejorMAE: number;
  mejorRMSE: number;
}

export function obtenerResumenDashboard(): ResumenDashboard[] {
  return CATEGORIAS.map((cat) => {
    const catMetrics = METRICAS.filter((m) => m.categoria === cat.key);
    const best = catMetrics.reduce((prev, curr) => (curr.r2 > prev.r2 ? curr : prev), catMetrics[0]);

    return {
      categoria: cat.key,
      categoriaLabel: cat.label,
      poblacion: cat.poblacion,
      indicador: cat.indicador,
      regiones: REGIONS.length,
      periodo: "2006 - 2023",
      mejorModelo: best.modeloNombre,
      mejorR2: best.r2,
      mejorMAE: best.mae,
      mejorRMSE: best.rmse,
    };
  });
}

// -------------------------------------------------------------
// Heatmap & Anomalies (matching the Python models logic)
// -------------------------------------------------------------

export interface HeatmapCell {
  year: number;
  week: number;
  value: number | null;
  isForecast: boolean;
}

export interface HeatmapData {
  region: string;
  categoria: Categoria;
  years: number[];
  weeks: number[]; // 1 to 52
  matrix: { year: number; isForecast: boolean; values: (number | null)[] }[];
  minValue: number;
  maxValue: number;
  forecastYear: number;
}

export type AnomalyClassification = "Very high" | "High" | "Normal" | "Low" | "Very low";

export const ANOMALY_COLOR_MAP: Record<AnomalyClassification, string> = {
  "Very high": "#8B0000",
  "High": "#FF4D4D",
  "Normal": "#BDBDBD",
  "Low": "#90EE90",
  "Very low": "#006400",
};

export interface AnomaliaPoint {
  fecha: string;
  semana: number;
  ano: number;
  region: string;
  categoria: Categoria;
  incidencia: number;
  historical_mean: number;
  historical_std: number;
  anomaly: number;
  z_score: number;
  classification: AnomalyClassification;
  color: string;
  source: "historical" | "forecast";
}

export function generateHeatmapData(categoria: Categoria = "adults_death", region: string = "AREQUIPA"): HeatmapData {
  const regNorm = region.trim().toUpperCase();
  const hist = HISTORICO.filter((h) => h.categoria === categoria && h.region.toUpperCase() === regNorm);
  const preds = PREDICCIONES.filter((p) => p.categoria === categoria && p.region.toUpperCase() === regNorm && p.modelo === "xgboost");

  const yearsSet = new Set<number>();
  hist.forEach((h) => yearsSet.add(h.ano));
  const forecastYear = 2024;
  yearsSet.add(forecastYear);

  const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  // Map values
  const histMap = new Map<string, number>();
  hist.forEach((h) => histMap.set(`${h.ano}_${h.semana}`, h.incidencia));

  const predMap = new Map<number, number>();
  preds.forEach((p, idx) => {
    const week = (idx % 52) + 1;
    predMap.set(week, p.predicho);
  });

  let allValues: number[] = [];
  const matrix = sortedYears.map((year) => {
    const isForecast = year === forecastYear;
    const values = weeks.map((w) => {
      if (isForecast) {
        const v = predMap.get(w) ?? null;
        if (v !== null) allValues.push(v);
        return v;
      } else {
        const v = histMap.get(`${year}_${w}`) ?? null;
        if (v !== null) allValues.push(v);
        return v;
      }
    });
    return { year, isForecast, values };
  });

  allValues.sort((a, b) => a - b);
  const p5Index = Math.floor(allValues.length * 0.05);
  const p95Index = Math.floor(allValues.length * 0.95);
  const minValue = allValues.length > 0 ? allValues[p5Index] : 0;
  const maxValue = allValues.length > 0 ? allValues[p95Index] : 10;

  return {
    region: regNorm,
    categoria,
    years: sortedYears,
    weeks,
    matrix,
    minValue: Math.round(minValue * 1000) / 1000,
    maxValue: Math.round(maxValue * 1000) / 1000,
    forecastYear,
  };
}

export function generateAnomaliasData(categoria: Categoria = "adults_death", region: string = "AREQUIPA"): AnomaliaPoint[] {
  const regNorm = region.trim().toUpperCase();
  const hist = HISTORICO.filter((h) => h.categoria === categoria && h.region.toUpperCase() === regNorm);
  const preds = PREDICCIONES.filter((p) => p.categoria === categoria && p.region.toUpperCase() === regNorm && p.modelo === "xgboost");

  // Calculate historical weekly stats (mean & std per week 1..52)
  const weekBuckets: Record<number, number[]> = {};
  for (let w = 1; w <= 52; w++) weekBuckets[w] = [];
  hist.forEach((h) => {
    if (weekBuckets[h.semana]) weekBuckets[h.semana].push(h.incidencia);
  });

  const weeklyStats: Record<number, { mean: number; std: number }> = {};
  for (let w = 1; w <= 52; w++) {
    const vals = weekBuckets[w] || [];
    const count = vals.length;
    const mean = count > 0 ? vals.reduce((a, b) => a + b, 0) / count : 0;
    const variance = count > 1 ? vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (count - 1) : 0;
    const std = Math.sqrt(variance);
    weeklyStats[w] = { mean, std };
  }

  function classify(z: number): AnomalyClassification {
    if (z >= 2) return "Very high";
    if (z >= 1) return "High";
    if (z <= -2) return "Very low";
    if (z <= -1) return "Low";
    return "Normal";
  }

  const results: AnomaliaPoint[] = [];

  // Historical points
  hist.forEach((h) => {
    const stat = weeklyStats[h.semana] || { mean: 0, std: 0 };
    const anomaly = h.incidencia - stat.mean;
    const z_score = stat.std > 0 ? anomaly / stat.std : 0;
    const classification = classify(z_score);
    results.push({
      fecha: h.fecha,
      semana: h.semana,
      ano: h.ano,
      region: h.region,
      categoria: h.categoria,
      incidencia: h.incidencia,
      historical_mean: Math.round(stat.mean * 1000) / 1000,
      historical_std: Math.round(stat.std * 1000) / 1000,
      anomaly: Math.round(anomaly * 1000) / 1000,
      z_score: Math.round(z_score * 1000) / 1000,
      classification,
      color: ANOMALY_COLOR_MAP[classification],
      source: "historical",
    });
  });

  // Forecast points (2024)
  preds.forEach((p, idx) => {
    const week = (idx % 52) + 1;
    const stat = weeklyStats[week] || { mean: 0, std: 0 };
    const anomaly = p.predicho - stat.mean;
    const z_score = stat.std > 0 ? anomaly / stat.std : 0;
    const classification = classify(z_score);
    results.push({
      fecha: p.fecha,
      semana: week,
      ano: 2024,
      region: p.region,
      categoria: p.categoria,
      incidencia: p.predicho,
      historical_mean: Math.round(stat.mean * 1000) / 1000,
      historical_std: Math.round(stat.std * 1000) / 1000,
      anomaly: Math.round(anomaly * 1000) / 1000,
      z_score: Math.round(z_score * 1000) / 1000,
      classification,
      color: ANOMALY_COLOR_MAP[classification],
      source: "forecast",
    });
  });

  return results;
}

export function generateDatosMapa(categoria: Categoria = "adults_death"): Record<string, number> {
  const rand = seededRandom(categoria.length * 17 + 99);
  const mapa: Record<string, number> = {};

  REGIONS.forEach((reg) => {
    // Generate an epidemiological severity/incidence level between 15 and 95 per region
    const base = categoria.includes("death") ? 20 : 35;
    const isCapitalOrCoast = ["LIMA", "CALLAO", "AREQUIPA", "LA LIBERTAD", "PIURA", "LAMBAYEQUE", "CUSCO", "PUNO"].includes(reg);
    const bonus = isCapitalOrCoast ? 25 : 5;
    const variation = rand() * 40;
    const valor = Math.round(Math.min(98, Math.max(10, base + bonus + variation)));
    mapa[reg] = valor;
  });

  return mapa;
}


