import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  type AnomaliaPoint,
  type AnomalyClassification,
  ANOMALY_COLOR_MAP,
} from "../services/api";

interface AnomaliesChartProps {
  data: AnomaliaPoint[];
  region: string;
}

export default function AnomaliesChart({ data, region }: AnomaliesChartProps) {
  const [filterMode, setFilterMode] = useState<"all" | "recent" | "forecast">("recent");

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">🔍</span>
        <span>No hay datos de anomalías disponibles.</span>
      </div>
    );
  }

  // Filter based on view mode
  const filteredData = data.filter((d) => {
    if (filterMode === "forecast") return d.source === "forecast";
    if (filterMode === "recent") return d.ano >= 2022;
    return true;
  });

  // Calculate statistics counts
  const counts: Record<AnomalyClassification, number> = {
    "Very high": 0,
    "High": 0,
    "Normal": 0,
    "Low": 0,
    "Very low": 0,
  };
  data.forEach((d) => {
    if (counts[d.classification] !== undefined) {
      counts[d.classification]++;
    }
  });

  // Recent extreme anomalies (High & Very High)
  const recentAlerts = [...data]
    .filter((d) => d.classification === "Very high" || d.classification === "High")
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 6);

  return (
    <div className="anomalies-section">
      {/* Classification Summary Badges */}
      <div
        className="anomaly-summary-row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 110px), 1fr))",
          gap: "10px",
          marginBottom: "18px",
        }}
      >
        <div
          className="metric-card"
          style={{ borderLeft: `4px solid ${ANOMALY_COLOR_MAP["Very high"]}`, padding: "10px 12px" }}
        >
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Muy Alto (Z ≥ 2)</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: ANOMALY_COLOR_MAP["Very high"] }}>
            {counts["Very high"]}
          </div>
        </div>
        <div
          className="metric-card"
          style={{ borderLeft: `4px solid ${ANOMALY_COLOR_MAP["High"]}`, padding: "10px 12px" }}
        >
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Alto (1 ≤ Z &lt; 2)</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: ANOMALY_COLOR_MAP["High"] }}>
            {counts["High"]}
          </div>
        </div>
        <div
          className="metric-card"
          style={{ borderLeft: `4px solid ${ANOMALY_COLOR_MAP["Normal"]}`, padding: "10px 12px" }}
        >
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Normal (-1 &lt; Z &lt; 1)</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text-heading)" }}>
            {counts["Normal"]}
          </div>
        </div>
        <div
          className="metric-card"
          style={{ borderLeft: `4px solid ${ANOMALY_COLOR_MAP["Low"]}`, padding: "10px 12px" }}
        >
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Bajo (-2 &lt; Z ≤ -1)</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: ANOMALY_COLOR_MAP["Low"] }}>
            {counts["Low"]}
          </div>
        </div>
        <div
          className="metric-card"
          style={{ borderLeft: `4px solid ${ANOMALY_COLOR_MAP["Very low"]}`, padding: "10px 12px" }}
        >
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Muy Bajo (Z ≤ -2)</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, color: ANOMALY_COLOR_MAP["Very low"] }}>
            {counts["Very low"]}
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
          Desviación de la media histórica estacional (Z-Score)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          <button
            className={`section-tab ${filterMode === "recent" ? "section-tab--active" : ""}`}
            style={{ padding: "5px 10px", fontSize: "11px" }}
            onClick={() => setFilterMode("recent")}
          >
            Reciente (2022–2024)
          </button>
          <button
            className={`section-tab ${filterMode === "forecast" ? "section-tab--active" : ""}`}
            style={{ padding: "5px 10px", fontSize: "11px" }}
            onClick={() => setFilterMode("forecast")}
          >
            Solo Pronóstico (2024)
          </button>
          <button
            className={`section-tab ${filterMode === "all" ? "section-tab--active" : ""}`}
            style={{ padding: "5px 10px", fontSize: "11px" }}
            onClick={() => setFilterMode("all")}
          >
            Todo Histórico
          </button>
        </div>
      </div>

      {/* Anomaly Bar Chart */}
      <div className="chart-container" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 10 }}
              interval={Math.max(1, Math.floor(filteredData.length / 12))}
              tickFormatter={(v: string) => v.substring(0, 7)}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              label={{
                value: "Anomalía (Incidencia - Media Histórica)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "var(--color-text-muted)", fontSize: 11 },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as AnomaliaPoint;
                  return (
                    <div
                      style={{
                        background: "rgba(26, 29, 39, 0.95)",
                        border: `1px solid ${d.color}`,
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "var(--color-text-heading)", marginBottom: "4px" }}>
                        {d.fecha} (Semana {d.semana}) — {d.source === "forecast" ? "Pronóstico" : "Histórico"}
                      </div>
                      <div>
                        Valor: <strong>{d.incidencia.toFixed(3)}</strong>
                      </div>
                      <div>
                        Media Histórica: <strong>{d.historical_mean.toFixed(3)}</strong>
                      </div>
                      <div>
                        Anomalía:{" "}
                        <strong style={{ color: d.anomaly >= 0 ? "#FF4D4D" : "#90EE90" }}>
                          {d.anomaly >= 0 ? `+${d.anomaly.toFixed(3)}` : d.anomaly.toFixed(3)}
                        </strong>
                      </div>
                      <div>
                        Z-Score: <strong>{d.z_score.toFixed(2)}</strong>
                      </div>
                      <div style={{ marginTop: "4px" }}>
                        Clasificación:{" "}
                        <span
                          style={{
                            color: d.color,
                            fontWeight: 700,
                            padding: "2px 6px",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "4px",
                          }}
                        >
                          {d.classification}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
            <Bar dataKey="anomaly" name="Anomalía">
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "16px",
          marginTop: "12px",
          fontSize: "11px",
        }}
      >
        {(Object.entries(ANOMALY_COLOR_MAP) as [AnomalyClassification, string][]).map(([name, color]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                backgroundColor: color,
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--color-text)" }}>{name}</span>
          </div>
        ))}
      </div>

      {/* Recent High Alerts Table */}
      {recentAlerts.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--color-text-heading)" }}>
            Últimas Anomalías Significativas en {region}
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Semana</th>
                  <th>Tipo</th>
                  <th>Incidencia</th>
                  <th>Media Hist.</th>
                  <th>Anomalía</th>
                  <th>Z-Score</th>
                  <th>Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((a, idx) => (
                  <tr key={`alert-${idx}`}>
                    <td>{a.fecha}</td>
                    <td>{a.semana}</td>
                    <td>
                      <span
                        className={`badge ${
                          a.source === "forecast" ? "badge--warning" : "badge--default"
                        }`}
                      >
                        {a.source === "forecast" ? "Pronóstico" : "Histórico"}
                      </span>
                    </td>
                    <td>{a.incidencia.toFixed(3)}</td>
                    <td>{a.historical_mean.toFixed(3)}</td>
                    <td style={{ color: a.anomaly >= 0 ? "#FF4D4D" : "#90EE90", fontWeight: 600 }}>
                      {a.anomaly >= 0 ? `+${a.anomaly.toFixed(3)}` : a.anomaly.toFixed(3)}
                    </td>
                    <td>{a.z_score.toFixed(2)}</td>
                    <td>
                      <span
                        style={{
                          backgroundColor: `${a.color}25`,
                          color: a.color,
                          border: `1px solid ${a.color}60`,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {a.classification}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
