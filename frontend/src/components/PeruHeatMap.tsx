import { useMemo, useState } from "react";
import peruGeoJSON from "../data/peru_departamental_simple.geojson.json";
import "./PeruHeatMap.css";

interface Departamento {
  nombre: string;
  valor: number | null;
  path: string;
}

interface PeruHeatMapProps {
  datos?: Record<string, number>;
  regionSeleccionada: string | null;
  onRegionChange: (region: string | null) => void;
  titulo?: string;
  subtitulo?: string;
}

interface GeoJSONFeature {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: {
    type: string;
    coordinates: unknown;
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

const geoJSON = peruGeoJSON as GeoJSONData;

function obtenerNombreDepartamento(feature: GeoJSONFeature): string {
  const properties = feature.properties ?? {};
  return String(
    properties.NOMBDEP ??
      properties.NOMBRE_DPT ??
      properties.NOMBRE ??
      properties.name ??
      properties.NAME_1 ??
      properties.departamento ??
      properties.Departamento ??
      "Sin nombre"
  ).trim();
}

function crearProyeccion(
  features: GeoJSONFeature[],
  width: number,
  height: number
) {
  const coordenadas: [number, number][] = [];

  const extraerCoordenadas = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;

    if (
      coords.length >= 2 &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      coordenadas.push([coords[0], coords[1]]);
      return;
    }

    coords.forEach(extraerCoordenadas);
  };

  features.forEach((feature) => {
    if (feature.geometry?.coordinates) {
      extraerCoordenadas(feature.geometry.coordinates);
    }
  });

  const longitudes = coordenadas.map(([lon]) => lon);
  const latitudes = coordenadas.map(([, lat]) => lat);

  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);

  const padding = 20;

  const escalaX = (width - padding * 2) / (maxLon - minLon);
  const escalaY = (height - padding * 2) / (maxLat - minLat);
  const escala = Math.min(escalaX, escalaY);

  const mapaWidth = (maxLon - minLon) * escala;
  const mapaHeight = (maxLat - minLat) * escala;

  const offsetX = (width - mapaWidth) / 2;
  const offsetY = (height - mapaHeight) / 2;

  return ([lon, lat]: [number, number]) => {
    const x = offsetX + (lon - minLon) * escala;
    const y = height - offsetY - (lat - minLat) * escala;
    return [x, y] as [number, number];
  };
}

function geometriaAPath(
  geometry: GeoJSONFeature["geometry"],
  proyectar: (coordenada: [number, number]) => [number, number]
): string {
  if (!geometry || !geometry.coordinates) return "";

  const anilloAPath = (anillo: [number, number][]): string => {
    return (
      anillo
        .map((coordenada, index) => {
          const [x, y] = proyectar(coordenada);
          return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ") + " Z"
    );
  };

  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates as [number, number][][];
    return rings.map(anilloAPath).join(" ");
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates as [number, number][][][];
    return polygons.flatMap((poligono) => poligono.map(anilloAPath)).join(" ");
  }

  return "";
}

function obtenerColor(
  valor: number | null,
  min: number,
  max: number
): string {
  if (valor === null || isNaN(valor)) {
    return "#334155";
  }

  const range = max - min || 1;
  const t = Math.max(0, Math.min(1, (valor - min) / range));

  // Color gradient: Light Peach (#fef0d9) -> Orange (#fd8d3c) -> Red (#e31a1c) -> Dark Burgundy (#7f1d1d)
  if (t < 0.25) {
    // 0 to 0.25
    const f = t / 0.25;
    return `rgb(${Math.round(254 - f * 2)}, ${Math.round(217 - f * 40)}, ${Math.round(142 - f * 42)})`;
  } else if (t < 0.5) {
    // 0.25 to 0.5
    const f = (t - 0.25) / 0.25;
    return `rgb(${Math.round(252 - f * 4)}, ${Math.round(177 - f * 36)}, ${Math.round(100 - f * 40)})`;
  } else if (t < 0.75) {
    // 0.5 to 0.75
    const f = (t - 0.5) / 0.25;
    return `rgb(${Math.round(248 - f * 21)}, ${Math.round(141 - f * 82)}, ${Math.round(60 - f * 32)})`;
  } else {
    // 0.75 to 1.0
    const f = (t - 0.75) / 0.25;
    return `rgb(${Math.round(227 - f * 100)}, ${Math.round(59 - f * 30)}, ${Math.round(28 + f * 1)})`;
  }
}

function obtenerNivel(
  valor: number | null,
  min: number,
  max: number
): string {
  if (valor === null) return "Sin datos";
  const range = max - min || 1;
  const t = (valor - min) / range;
  if (t >= 0.8) return "Muy alto";
  if (t >= 0.6) return "Alto";
  if (t >= 0.4) return "Moderado";
  if (t >= 0.2) return "Bajo";
  return "Muy bajo";
}

export default function PeruHeatMap({
  datos = {},
  regionSeleccionada,
  onRegionChange,
  titulo = "Mapa Epidemiológico Regional del Perú",
  subtitulo = "Haz clic sobre un departamento para filtrar predicciones y anomalías",
}: PeruHeatMapProps) {
  const [departamentoHover, setDepartamentoHover] = useState<Departamento | null>(null);

  const width = 600;
  const height = 750;

  const features = geoJSON.features;

  const proyectar = useMemo(
    () => crearProyeccion(features, width, height),
    [features]
  );

  // Normalize data keys to uppercase
  const normalizedData = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(datos).forEach(([k, v]) => {
      map[k.trim().toUpperCase()] = v;
    });
    return map;
  }, [datos]);

  const { minVal, maxVal } = useMemo(() => {
    const vals = Object.values(normalizedData).filter((v) => typeof v === "number" && !isNaN(v));
    if (vals.length === 0) return { minVal: 0, maxVal: 100 };
    return {
      minVal: Math.min(...vals),
      maxVal: Math.max(...vals),
    };
  }, [normalizedData]);

  const departamentos = useMemo(() => {
    return features.map((feature) => {
      const nombre = obtenerNombreDepartamento(feature);
      const nombreKey = nombre.toUpperCase();
      const valor = normalizedData[nombreKey] ?? null;

      return {
        nombre,
        valor,
        path: geometriaAPath(feature.geometry, proyectar),
      };
    });
  }, [features, normalizedData, proyectar]);

  const selectedNorm = regionSeleccionada ? regionSeleccionada.trim().toUpperCase() : null;

  return (
    <div className="peru-map-card">
      <div className="peru-map-header">
        <div>
          <h2>{titulo}</h2>
          <p>{subtitulo}</p>
        </div>

        {regionSeleccionada && (
          <button
            className="clear-region-button"
            onClick={() => onRegionChange(null)}
          >
            Ver todo el Perú
          </button>
        )}
      </div>

      <div className="peru-map-content">
        <div className="peru-map-wrapper">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="peru-map-svg"
          >
            {departamentos.map(({ nombre, valor, path }) => {
              const seleccionado = selectedNorm === nombre.toUpperCase();
              const fillColor = obtenerColor(valor, minVal, maxVal);

              return (
                <path
                  key={nombre}
                  d={path}
                  fill={fillColor}
                  className={`peru-department ${seleccionado ? "selected" : ""}`}
                  onMouseEnter={() =>
                    setDepartamentoHover({
                      nombre,
                      valor,
                      path,
                    })
                  }
                  onMouseLeave={() => setDepartamentoHover(null)}
                  onClick={() => onRegionChange(nombre)}
                />
              );
            })}
          </svg>

          {departamentoHover && (
            <div className="peru-tooltip">
              <strong>{departamentoHover.nombre}</strong>
              <span>
                Valor:{" "}
                {departamentoHover.valor !== null
                  ? departamentoHover.valor.toFixed(2)
                  : "Sin datos"}
              </span>
              <span>
                Nivel: {obtenerNivel(departamentoHover.valor, minVal, maxVal)}
              </span>
            </div>
          )}
        </div>

        <div className="peru-map-legend">
          <div className="legend-title">Nivel de Incidencia / Gravedad</div>
          <div className="legend-gradient" />
          <div className="legend-labels">
            <span>Bajo ({minVal.toFixed(0)})</span>
            <span>Alto ({maxVal.toFixed(0)})</span>
          </div>

          <div className="legend-items">
            <div>
              <span className="legend-color" style={{ background: "#7f1d1d" }} />
              <span>Muy alto</span>
            </div>
            <div>
              <span className="legend-color" style={{ background: "#e31a1c" }} />
              <span>Alto</span>
            </div>
            <div>
              <span className="legend-color" style={{ background: "#fd8d3c" }} />
              <span>Moderado</span>
            </div>
            <div>
              <span className="legend-color" style={{ background: "#fed976" }} />
              <span>Bajo</span>
            </div>
          </div>

          {regionSeleccionada && (
            <div className="selected-region-indicator">
              <span>Seleccionado:</span>
              <strong>{regionSeleccionada}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}