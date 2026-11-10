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

import MetricCard from "../components/MetricCard";
import Heatmap from "../components/Heatmap";
import PeruHeatMap from "../components/PeruHeatMap";

import {
  obtenerResumen,
  obtenerDatos,
  obtenerHeatmap,
  obtenerAnomalias,
  obtenerCategorias,
  obtenerRegiones,
  obtenerDatosMapa,
  type ResumenDashboard,
  type HeatmapData,
  type AnomaliaPoint,
  type DatoHistorico,
  type Categoria,
} from "../services/api";

const ANIOS_DISPONIBLES = Array.from(
  { length: 2023 - 2006 + 1 },
  (_, i) => 2006 + i
);

export default function Dashboard() {
  const [resumen, setResumen] = useState<ResumenDashboard[]>([]);
  const [rawDatos, setRawDatos] = useState<DatoHistorico[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [anomalias, setAnomalias] = useState<AnomaliaPoint[]>([]);

  const [region, setRegion] = useState("AREQUIPA");
  const [categoria, setCategoria] =
    useState<Categoria>("adults_death");

  const [anioInicio, setAnioInicio] = useState(2006);
  const [anioFin, setAnioFin] = useState(2023);

  const [categoriasList, setCategoriasList] = useState<
    { key: Categoria; label: string }[]
  >([]);

  const [regionesList, setRegionesList] = useState<string[]>([]);
  const [datosMapa, setDatosMapa] = useState<Record<string, number>>({});

  /*
   * Carga inicial del dashboard
   */
  useEffect(() => {
    obtenerResumen().then(setResumen);

    obtenerCategorias().then((c) =>
      setCategoriasList(
        c.map((x: { key: Categoria; label: string }) => ({
          key: x.key,
          label: x.label,
        }))
      )
    );

    obtenerRegiones().then(setRegionesList);
  }, []);

  /*
   * Actualización del mapa según categoría
   */
  useEffect(() => {
    obtenerDatosMapa(categoria).then(setDatosMapa);
  }, [categoria]);

  /*
   * Actualización de datos cuando cambia
   * la categoría o la región.
   */
  useEffect(() => {
    obtenerDatos(categoria, region).then(setRawDatos);
    obtenerHeatmap(categoria, region).then(setHeatmapData);
    obtenerAnomalias(categoria, region).then(setAnomalias);
  }, [categoria, region]);

  /*
   * Rango de años normalizado
   */
  const desde = Math.min(anioInicio, anioFin);
  const hasta = Math.max(anioInicio, anioFin);
  const periodoTexto = desde === hasta ? `${desde}` : `${desde}–${hasta}`;
  const totalAnios = hasta - desde + 1;

  /*
   * Filtrado de Serie Histórica
   */
  const datosFiltrados = rawDatos.filter((d) => {
    const anio = Number(d.fecha.substring(0, 4));
    return anio >= desde && anio <= hasta;
  });

  const samplingStep = hasta - desde <= 1 ? 1 : hasta - desde <= 4 ? 2 : 4;
  const chartData = datosFiltrados
    .filter((_, i) => i % samplingStep === 0)
    .map((d) => ({
      fecha: d.fecha,
      incidencia: d.incidencia,
    }));

  /*
   * Filtrado de Heatmap
   */
  const filteredHeatmapData: HeatmapData | null = heatmapData
    ? {
        ...heatmapData,
        years: heatmapData.years.filter(
          (y) => (y >= desde && y <= hasta) || y === heatmapData.forecastYear
        ),
        matrix: heatmapData.matrix.filter(
          (row) =>
            (row.year >= desde && row.year <= hasta) ||
            row.year === heatmapData.forecastYear
        ),
      }
    : null;

  /*
   * Filtrado de Anomalías
   */
  const anomaliasFiltradas = anomalias.filter((a) => {
    const anio = a.ano ?? Number(a.fecha.substring(0, 4));
    return (anio >= desde && anio <= hasta) || a.source === "forecast";
  });

  const highAlerts = anomaliasFiltradas.filter(
    (a) =>
      a.classification === "Very high" ||
      a.classification === "High"
  );

  const recentHighAlerts = [...highAlerts]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 4);

  /*
   * Nombre visible de la categoría seleccionada
   */
  const selectedCatLabel =
    categoriasList.find((c) => c.key === categoria)?.label ||
    categoria;

  /*
   * Cuando se selecciona un departamento desde el mapa,
   * se actualiza el mismo estado utilizado por los filtros.
   */
  const handleRegionChange = (nuevaRegion: string | null) => {
    if (!nuevaRegion) {
      return;
    }

    const regionNormalizada =
      regionesList.find(
        (r) => r.toUpperCase() === nuevaRegion.toUpperCase()
      ) || nuevaRegion.toUpperCase();

    setRegion(regionNormalizada);
  };

  return (
    <div>
      {/* =========================================================
          ENCABEZADO
      ========================================================= */}
      <div className="page-header">
        <h1>Dashboard Epidemiológico</h1>

        <p>
          Resumen general del sistema de predicción, anomalías y
          análisis de calor — Perú, {periodoTexto}
        </p>
      </div>

      {/* =========================================================
          MÉTRICAS GENERALES
      ========================================================= */}
      <div className="metrics-grid">
        <MetricCard
          titulo="Regiones Evaluadas"
          valor="25"
          subtitulo="Departamentos del Perú"
        />

        <MetricCard
          titulo="Periodo Histórico"
          valor={periodoTexto}
          subtitulo={`${totalAnios} año${totalAnios > 1 ? "s" : ""} de datos semanales`}
        />

        <MetricCard
          titulo="Modelos Integrados"
          valor="6"
          subtitulo="4 Estadísticos + 2 Machine Learning"
        />

        <MetricCard
          titulo="Alertas de Anomalía"
          valor={highAlerts.length.toString()}
          subtitulo={`${region} (${periodoTexto}) — Semanas con Z ≥ 1`}
          acento
        />
      </div>

      {/* =========================================================
          FILTROS GENERALES
      ========================================================= */}
      <div className="filters mb-24">
        <div className="filter-group">
          <label>Región</label>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {regionesList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Indicador Epidemiológico</label>

          <select
            value={categoria}
            onChange={(e) =>
              setCategoria(e.target.value as Categoria)
            }
          >
            {categoriasList.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Desde</label>

          <select
            value={anioInicio}
            onChange={(e) => setAnioInicio(Number(e.target.value))}
          >
            {ANIOS_DISPONIBLES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Hasta</label>

          <select
            value={anioFin}
            onChange={(e) => setAnioFin(Number(e.target.value))}
          >
            {ANIOS_DISPONIBLES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================
          MAPA DE PERÚ
      ========================================================= */}
      <div className="card mb-24">
        <div className="card-header">
          <div>
            <span className="card-title">
              Mapa epidemiológico del Perú
            </span>

            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                marginTop: "2px",
              }}
            >
              Seleccione un departamento para filtrar el dashboard
            </div>
          </div>
        </div>

        <PeruHeatMap
          datos={datosMapa}
          regionSeleccionada={region}
          onRegionChange={handleRegionChange}
        />
      </div>

      {/* =========================================================
          REGIÓN SELECCIONADA
      ========================================================= */}
      <div
        className="card mb-24"
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-text-muted)",
            }}
          >
            Departamento seleccionado
          </span>

          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--color-text-heading)",
              marginTop: "2px",
            }}
          >
            {region}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRegion("AREQUIPA")}
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-2)",
            color: "var(--color-text-heading)",
            borderRadius: "6px",
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 500,
            transition: "all var(--transition)",
          }}
        >
          Restablecer región
        </button>
      </div>

      {/* =========================================================
          MONITOR DE ANOMALÍAS
      ========================================================= */}
      <div
        className="card mb-24"
        style={{
          borderLeft: "4px solid var(--color-danger)",
        }}
      >
        <div className="card-header">
          <div>
            <span className="card-title">
              ⚠️ Monitor de Anomalías Recientes —{" "}
              {selectedCatLabel} ({region}, {periodoTexto})
            </span>

            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                marginTop: "2px",
              }}
            >
              Desviaciones significativas sobre la línea base
              histórica estacional en el periodo seleccionado
            </div>
          </div>
        </div>

        {recentHighAlerts.length === 0 ? (
          <div
            style={{
              padding: "12px",
              color: "var(--color-text-muted)",
              fontSize: "13px",
            }}
          >
            No se registran anomalías elevadas en el periodo seleccionado.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            {recentHighAlerts.map((alert, i) => (
              <div
                key={`dash-alert-${i}`}
                style={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius)",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {alert.fecha} (Sem {alert.semana})
                  </span>

                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: alert.color,
                      background: `${alert.color}20`,
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {alert.classification}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Incidencia:{" "}
                  <strong
                    style={{
                      color: "var(--color-text-heading)",
                    }}
                  >
                    {alert.incidencia.toFixed(2)}
                  </strong>{" "}
                  | Media: {alert.historical_mean.toFixed(2)}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color:
                      alert.anomaly >= 0
                        ? "#FF4D4D"
                        : "#90EE90",
                  }}
                >
                  Anomalía:{" "}
                  {alert.anomaly >= 0
                    ? `+${alert.anomaly.toFixed(2)}`
                    : alert.anomaly.toFixed(2)}{" "}
                  (Z: {alert.z_score.toFixed(2)})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================
          HEATMAP SEMANAL
      ========================================================= */}
      <div className="card mb-24">
        <div className="card-header">
          <div>
            <span className="card-title">
              🔥 Mapa de Calor Semanal — {selectedCatLabel} (
              {region}, {periodoTexto})
            </span>

            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                marginTop: "2px",
              }}
            >
              Distribución temporal de la incidencia por año
              ({periodoTexto}) y pronóstico 2024
            </div>
          </div>
        </div>

        <Heatmap data={filteredHeatmapData} compact={true} />
      </div>

      {/* =========================================================
          RESUMEN DE CATEGORÍAS
      ========================================================= */}
      <div className="summary-grid mb-24">
        {resumen.map((r) => (
          <div key={r.categoria} className="summary-card">
            <div className="summary-card__title">
              {r.categoriaLabel}
            </div>

            <div className="summary-card__row">
              <span className="summary-card__label">
                Población
              </span>

              <span className="summary-card__value">
                {r.poblacion}
              </span>
            </div>

            <div className="summary-card__row">
              <span className="summary-card__label">
                Indicador
              </span>

              <span className="summary-card__value">
                {r.indicador}
              </span>
            </div>

            <div className="summary-card__row">
              <span className="summary-card__label">
                Periodo
              </span>

              <span className="summary-card__value">
                {r.periodo}
              </span>
            </div>

            <div className="summary-card__row">
              <span className="summary-card__label">
                Mejor modelo
              </span>

              <span className="summary-card__value text-primary">
                {r.mejorModelo}
              </span>
            </div>

            <div className="summary-card__row">
              <span className="summary-card__label">
                R²
              </span>

              <span className="summary-card__value">
                {r.mejorR2}
              </span>
            </div>

            <div className="summary-card__row">
              <span className="summary-card__label">
                MAE
              </span>

              <span className="summary-card__value">
                {r.mejorMAE}
              </span>
            </div>

            <div className="summary-card__row">
              <span className="summary-card__label">
                RMSE
              </span>

              <span className="summary-card__value">
                {r.mejorRMSE}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================
          SERIE HISTÓRICA
      ========================================================= */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Histórico de Incidencia — {selectedCatLabel} (
            {region}, {periodoTexto})
          </span>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.3}
              />

              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) =>
                  v.substring(0, 7)
                }
                interval={Math.max(
                  1,
                  Math.floor(chartData.length / 8)
                )}
              />

              <YAxis
                tick={{ fontSize: 10 }}
                label={{
                  value: "Incidencia por 100k hab.",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fill: "var(--color-text-muted)",
                    fontSize: 11,
                  },
                }}
              />

              <Tooltip
                labelFormatter={(l) => `Fecha: ${l}`}
                formatter={(v) => [
                  Number(v).toFixed(3),
                  "Incidencia",
                ]}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="incidencia"
                name="Incidencia por 100,000 hab."
                stroke="#6366f1"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}