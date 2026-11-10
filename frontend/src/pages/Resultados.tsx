import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  obtenerMetricas, obtenerRegiones, obtenerCategorias,
  type MetricaModelo, type Categoria,
} from "../services/api";

export default function Resultados() {
  const [metricas, setMetricas] = useState<MetricaModelo[]>([]);
  const [regiones, setRegiones] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<{ key: Categoria; label: string }[]>([]);
  const [region, setRegion] = useState("AREQUIPA");
  const [categoria, setCategoria] = useState<Categoria>("adults_death");
  const [metricaChart, setMetricaChart] = useState<"mae" | "rmse" | "r2">("r2");

  useEffect(() => {
    obtenerRegiones().then(setRegiones);
    obtenerCategorias().then((c) => setCategorias(c.map((x: { key: Categoria; label: string }) => ({ key: x.key, label: x.label }))));
  }, []);

  useEffect(() => {
    obtenerMetricas(categoria, region).then(setMetricas);
  }, [categoria, region]);

  const chartData = metricas.map((m) => ({
    modelo: m.modeloNombre,
    valor: m[metricaChart],
    tipo: m.tipo,
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Resultados</h1>
        <p>Métricas de evaluación de los modelos de predicción</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Región</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {regiones.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Categoría</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
            {categorias.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Métrica en gráfico</label>
          <select value={metricaChart} onChange={(e) => setMetricaChart(e.target.value as "mae" | "rmse" | "r2")}>
            <option value="r2">R²</option>
            <option value="mae">MAE</option>
            <option value="rmse">RMSE</option>
          </select>
        </div>
      </div>

      <div className="card mb-24">
        <div className="card-header">
          <span className="card-title">Tabla de métricas — {region}</span>
        </div>
        {metricas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">📈</span>
            <span>No hay métricas para esta selección</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Tipo</th>
                  <th>MAE</th>
                  <th>RMSE</th>
                  <th>R²</th>
                </tr>
              </thead>
              <tbody>
                {metricas.map((m) => (
                  <tr key={m.modelo}>
                    <td style={{ fontWeight: 600, color: "var(--color-text-heading)" }}>
                      {m.modeloNombre}
                    </td>
                    <td>
                      <span className={`badge badge--${m.tipo}`}>
                        {m.tipo === "estadistico" ? "Estadístico" : "ML"}
                      </span>
                    </td>
                    <td>{m.mae}</td>
                    <td>{m.rmse}</td>
                    <td
                      style={{
                        color:
                          m.r2 >= 0.8
                            ? "var(--color-success)"
                            : m.r2 >= 0.5
                            ? "var(--color-warning)"
                            : "var(--color-danger)",
                        fontWeight: 600,
                      }}
                    >
                      {m.r2}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Comparación — {metricaChart.toUpperCase()} por modelo
          </span>
        </div>
        {chartData.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">📊</span>
            <span>Sin datos para graficar</span>
          </div>
        ) : (
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="modelo" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v) => [Number(v).toFixed(3), metricaChart.toUpperCase()]}
                />
                <Legend />
                <Bar
                  dataKey="valor"
                  name={metricaChart.toUpperCase()}
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
