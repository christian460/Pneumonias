import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  obtenerPredicciones,
  obtenerRegiones,
  obtenerCategorias,
  obtenerHeatmap,
  obtenerAnomalias,
  obtenerDatosMapa,
  type Prediccion,
  type Categoria,
  type HeatmapData,
  type AnomaliaPoint,
} from "../services/api";
import Heatmap from "../components/Heatmap";
import AnomaliesChart from "../components/AnomaliesChart";
import PeruHeatMap from "../components/PeruHeatMap";

const MODEL_COLORS: Record<string, string> = {
  naive: "#3b82f6",
  seasonal_naive: "#f59e0b",
  holt_winters: "#22c55e",
  arima: "#ef4444",
  random_forest: "#8b5cf6",
  xgboost: "#ec4899",
};

export default function Predicciones() {
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [anomaliasData, setAnomaliasData] = useState<AnomaliaPoint[]>([]);
  const [datosMapa, setDatosMapa] = useState<Record<string, number>>({});
  const [regiones, setRegiones] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<{ key: Categoria; label: string }[]>([]);
  const [region, setRegion] = useState("AREQUIPA");
  const [categoria, setCategoria] = useState<Categoria>("adults_death");
  const [modelosSeleccionados, setModelosSeleccionados] = useState<string[]>([
    "holt_winters",
    "xgboost",
  ]);
  const [activeTab, setActiveTab] = useState<
    "integral" | "mapa" | "pronosticos" | "heatmap" | "anomalias"
  >("integral");

  useEffect(() => {
    obtenerRegiones().then(setRegiones);
    obtenerCategorias().then((c) =>
      setCategorias(c.map((x: { key: Categoria; label: string }) => ({ key: x.key, label: x.label })))
    );
  }, []);

  useEffect(() => {
    obtenerDatosMapa(categoria).then(setDatosMapa);
  }, [categoria]);

  useEffect(() => {
    obtenerPredicciones(categoria, region).then(setPredicciones);
    obtenerHeatmap(categoria, region).then(setHeatmapData);
    obtenerAnomalias(categoria, region).then(setAnomaliasData);
  }, [categoria, region]);

  const toggleModelo = (m: string) => {
    setModelosSeleccionados((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleRegionChange = (nuevaRegion: string | null) => {
    if (!nuevaRegion) return;
    const norm =
      regiones.find((r) => r.toUpperCase() === nuevaRegion.toUpperCase()) ||
      nuevaRegion.toUpperCase();
    setRegion(norm);
  };

  // Pivot data for chart: one row per fecha, one key per model
  const modelosDisponibles = [...new Set(predicciones.map((p) => p.modelo))];

  const chartData = (() => {
    const byDate: Record<string, Record<string, number>> = {};
    for (const p of predicciones) {
      if (!modelosSeleccionados.includes(p.modelo)) continue;
      if (!byDate[p.fecha]) byDate[p.fecha] = {};
      byDate[p.fecha][p.modelo] = p.predicho;
    }
    return Object.entries(byDate)
      .map(([fecha, models]) => ({ fecha, ...models }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  })();

  const selectedCategoryLabel =
    categorias.find((c) => c.key === categoria)?.label || categoria;

  return (
    <div>
      <div className="page-header">
        <h1>Predicciones, Heatmaps y Anomalías</h1>
        <p>
          Visualización epidemiológica integrada generada por los modelos predictivos — {region}
        </p>
      </div>

      {/* Primary Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Región / Departamento</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {regiones.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Población e Indicador</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
          >
            {categorias.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="section-tabs" style={{ marginBottom: "20px" }}>
        <button
          className={`section-tab ${activeTab === "integral" ? "section-tab--active" : ""}`}
          onClick={() => setActiveTab("integral")}
        >
          📊 Vista Completa
        </button>
        <button
          className={`section-tab ${activeTab === "mapa" ? "section-tab--active" : ""}`}
          onClick={() => setActiveTab("mapa")}
        >
          🗺️ Mapa Perú
        </button>
        <button
          className={`section-tab ${activeTab === "pronosticos" ? "section-tab--active" : ""}`}
          onClick={() => setActiveTab("pronosticos")}
        >
          📈 Pronósticos (Series)
        </button>
        <button
          className={`section-tab ${activeTab === "heatmap" ? "section-tab--active" : ""}`}
          onClick={() => setActiveTab("heatmap")}
        >
          🔥 Mapa de Calor (Heatmap)
        </button>
        <button
          className={`section-tab ${activeTab === "anomalias" ? "section-tab--active" : ""}`}
          onClick={() => setActiveTab("anomalias")}
        >
          ⚠️ Detección de Anomalías
        </button>
      </div>

      {/* Section: Peru Regional Heat Map */}
      {(activeTab === "integral" || activeTab === "mapa") && (
        <div className="card mb-24">
          <div className="card-header">
            <div>
              <span className="card-title">
                Distribución Geográfica y Gravedad — {selectedCategoryLabel}
              </span>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                Selecciona cualquier departamento en el mapa para cargar automáticamente sus predicciones
              </div>
            </div>
          </div>
          <PeruHeatMap
            datos={datosMapa}
            regionSeleccionada={region}
            onRegionChange={handleRegionChange}
            titulo="Mapa Departamental de Gravedad"
            subtitulo="Haz clic en una región para explorar sus predicciones y series temporales"
          />
        </div>
      )}

      {/* Section 1: Forecast Chart */}
      {(activeTab === "integral" || activeTab === "pronosticos") && (
        <div className="card mb-24">
          <div className="card-header">
            <div>
              <span className="card-title">
                Proyecciones Semanales 2024 — {selectedCategoryLabel} ({region})
              </span>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                Comparación temporal de predicciones entre modelos estadísticos y Machine Learning
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "8px" }}>
              Seleccionar modelos para superponer en el gráfico:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {modelosDisponibles.map((m) => {
                const nombre = predicciones.find((p) => p.modelo === m)?.modeloNombre || m;
                const active = modelosSeleccionados.includes(m);
                return (
                  <button
                    key={m}
                    className="section-tab"
                    style={{
                      borderBottom: "none",
                      borderRadius: "var(--radius)",
                      border: `1px solid ${
                        active ? MODEL_COLORS[m] || "#6366f1" : "var(--color-border)"
                      }`,
                      background: active ? `${MODEL_COLORS[m] || "#6366f1"}25` : "transparent",
                      color: active ? MODEL_COLORS[m] || "#6366f1" : "var(--color-text)",
                      padding: "4px 12px",
                      fontSize: "12px",
                      fontWeight: active ? 600 : 400,
                    }}
                    onClick={() => toggleModelo(m)}
                  >
                    {nombre}
                  </button>
                );
              })}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">🔮</span>
              <span>Selecciona al menos un modelo para ver predicciones</span>
            </div>
          ) : (
            <div className="chart-container" style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.substring(5)}
                    interval={Math.floor(chartData.length / 10)}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    label={{
                      value: "Incidencia predicha por 100k hab.",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fill: "var(--color-text-muted)", fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    labelFormatter={(l) => `Fecha: ${l}`}
                    formatter={(v, name) => {
                      const label =
                        predicciones.find((p) => p.modelo === name)?.modeloNombre || name;
                      return [Number(v).toFixed(3), label];
                    }}
                  />
                  <Legend
                    formatter={(value: string) =>
                      predicciones.find((p) => p.modelo === value)?.modeloNombre || value
                    }
                  />
                  {modelosSeleccionados.map((m) => (
                    <Line
                      key={m}
                      type="monotone"
                      dataKey={m}
                      stroke={MODEL_COLORS[m] || "#6366f1"}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Section 2: Heatmap */}
      {(activeTab === "integral" || activeTab === "heatmap") && (
        <div className="card mb-24">
          <div className="card-header">
            <div>
              <span className="card-title">
                Matriz de Calor Epidemiológico — {region}
              </span>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                Eje Y: Años (2006–2023 Histórico + 2024 Pronóstico) | Eje X: Semanas Epidemiológicas (1 a 52)
              </div>
            </div>
          </div>
          <Heatmap data={heatmapData} />
        </div>
      )}

      {/* Section 3: Anomalies */}
      {(activeTab === "integral" || activeTab === "anomalias") && (
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">
                Análisis de Anomalías y Z-Scores — {region}
              </span>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                Identificación de desviaciones sobre la línea base histórica estacional
              </div>
            </div>
          </div>
          <AnomaliesChart data={anomaliasData} region={region} />
        </div>
      )}
    </div>
  );
}
