import { useEffect, useState } from "react";
import { obtenerDatos, obtenerRegiones, obtenerCategorias, type DatoHistorico, type Categoria } from "../services/api";

const PAGE_SIZE = 50;

export default function Datos() {
  const [datos, setDatos] = useState<DatoHistorico[]>([]);
  const [regiones, setRegiones] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<{ key: Categoria; label: string }[]>([]);
  const [region, setRegion] = useState("AREQUIPA");
  const [categoria, setCategoria] = useState<Categoria>("adults_death");
  const [page, setPage] = useState(0);

  useEffect(() => {
    obtenerRegiones().then(setRegiones);
    obtenerCategorias().then((c) => setCategorias(c.map((x: { key: Categoria; label: string }) => ({ key: x.key, label: x.label }))));
  }, []);

  useEffect(() => {
    setPage(0);
    obtenerDatos(categoria, region).then(setDatos);
  }, [categoria, region]);

  const totalPages = Math.ceil(datos.length / PAGE_SIZE);
  const pageData = datos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <h1>Datos Históricos</h1>
        <p>Datos epidemiológicos semanales por región y categoría</p>
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
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {datos.length} registros — {region}
          </span>
        </div>
        {datos.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">📋</span>
            <span>No hay datos disponibles para esta selección</span>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Año</th>
                    <th>Semana</th>
                    <th>Región</th>
                    <th>Incidencia</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((d, i) => (
                    <tr key={`${d.fecha}-${i}`}>
                      <td>{d.fecha}</td>
                      <td>{d.ano}</td>
                      <td>{d.semana}</td>
                      <td>{d.region}</td>
                      <td>{d.incidencia.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                ← Anterior
              </button>
              <span>
                Página {page + 1} de {totalPages}
              </span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                Siguiente →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
