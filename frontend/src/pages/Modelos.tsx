import { useState } from "react";
import { MODELOS } from "../services/mockData";

export default function Modelos() {
  const [tab, setTab] = useState<"estadistico" | "ml">("estadistico");

  const modelosFiltrados = MODELOS.filter((m) => m.tipo === tab);

  // Group unique models (they repeat per categoria, show unique by key)
  const unicos = modelosFiltrados.filter(
    (m, i, arr) => arr.findIndex((x) => x.key === m.key) === i
  );

  return (
    <div>
      <div className="page-header">
        <h1>Modelos</h1>
        <p>Modelos de predicción disponibles en el sistema</p>
      </div>

      <div className="section-tabs">
        <button
          className={`section-tab${tab === "estadistico" ? " section-tab--active" : ""}`}
          onClick={() => setTab("estadistico")}
        >
          Modelos Estadísticos
        </button>
        <button
          className={`section-tab${tab === "ml" ? " section-tab--active" : ""}`}
          onClick={() => setTab("ml")}
        >
          Modelos Machine Learning
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Archivos fuente</th>
              </tr>
            </thead>
            <tbody>
              {unicos.map((m) => (
                <tr key={m.key}>
                  <td style={{ fontWeight: 600, color: "var(--color-text-heading)" }}>
                    {m.nombre}
                  </td>
                  <td>
                    <span className={`badge badge--${m.tipo}`}>
                      {m.tipo === "estadistico" ? "Estadístico" : "ML"}
                    </span>
                  </td>
                  <td>{m.descripcion}</td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {m.tipo === "estadistico" ? (
                      <>
                        adults_death_baseline_stats_final.py<br />
                        adults_hosp_baseline_stats_final.py<br />
                        children_death_baseline_stats_final.py<br />
                        children_hosp_baseline_stats_final.py
                      </>
                    ) : (
                      <>
                        adults_death_ml_final.py<br />
                        adults_hosp_ml_final.py<br />
                        children_death_ml_final.py<br />
                        children_hosp_ml_final.py
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <span className="card-title">Configuración general</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Parámetro</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Periodo de datos</td><td>2006 – 2023</td></tr>
              <tr><td>Ventana de entrenamiento</td><td>5 años (260 semanas)</td></tr>
              <tr><td>Horizonte de predicción</td><td>4 semanas (1 mes)</td></tr>
              <tr><td>Paso de avance</td><td>4 semanas</td></tr>
              <tr><td>Predicción futura</td><td>52 semanas (1 año)</td></tr>
              <tr><td>Periodo estacional</td><td>52 semanas</td></tr>
              <tr><td>Transformación</td><td>log1p / expm1</td></tr>
              <tr><td>Cap outliers</td><td>Percentil 99</td></tr>
              <tr><td>Suavizado</td><td>Media móvil, ventana=3</td></tr>
              <tr><td>Target</td><td>Incidencia por 100,000 habitantes</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
