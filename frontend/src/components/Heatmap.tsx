import { useState } from "react";
import type { HeatmapData } from "../services/api";

interface HeatmapProps {
  data: HeatmapData | null;
  compact?: boolean;
}

// Colormap interpolation matching YlOrRd
function getYlOrRdColor(value: number | null, min: number, max: number): string {
  if (value === null || isNaN(value)) return "rgba(255,255,255,0.05)";
  if (max === min) return "#feb24c";

  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Color stops: 0 -> #ffffb2 (light yellow), 0.35 -> #fecc5c, 0.6 -> #fd8d3c, 0.8 -> #f03b20, 1 -> #bd0026 (deep red)
  if (t < 0.25) {
    // #ffffb2 to #fed976
    return `rgba(255, 237, 160, ${0.4 + t * 2.4})`;
  } else if (t < 0.5) {
    // #feb24c
    return `rgb(${Math.round(254)}, ${Math.round(217 - (t - 0.25) * 4 * 39)}, ${Math.round(118 - (t - 0.25) * 4 * 42)})`;
  } else if (t < 0.75) {
    // #fd8d3c to #f03b20
    const factor = (t - 0.5) / 0.25;
    return `rgb(${Math.round(253 - factor * 13)}, ${Math.round(141 - factor * 82)}, ${Math.round(60 - factor * 28)})`;
  } else {
    // #bd0026
    const factor = (t - 0.75) / 0.25;
    return `rgb(${Math.round(240 - factor * 51)}, ${Math.round(59 - factor * 59)}, ${Math.round(32 + factor * 6)})`;
  }
}

export default function Heatmap({ data, compact = false }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    year: number;
    week: number;
    value: number | null;
    isForecast: boolean;
    x: number;
    y: number;
  } | null>(null);

  if (!data) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">⏳</span>
        <span>Cargando mapa de calor...</span>
      </div>
    );
  }

  const { matrix, minValue, maxValue, forecastYear, region } = data;
  const xTicks = [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 52];

  return (
    <div className={`heatmap-wrapper ${compact ? "heatmap-wrapper--compact" : ""}`}>
      <div className="heatmap-header">
        <div className="heatmap-title">
          <span className="badge badge--primary">Mapa de Calor Semanal</span>
          <h4>{region} — Incidencia Semanal por 100,000 hab. (Histórico + Pronóstico)</h4>
        </div>
      </div>

      <div className="heatmap-container" style={{ position: "relative", overflowX: "auto" }}>
        <div
          className="heatmap-grid"
          style={{
            display: "grid",
            gridTemplateColumns: `54px repeat(52, minmax(${compact ? "8px" : "14px"}, 1fr))`,
            gap: "2px",
            minWidth: compact ? "500px" : "800px",
          }}
        >
          {/* Top-left empty corner */}
          <div className="heatmap-axis-label heatmap-axis-label--corner">Año / Sem</div>

          {/* Week column headers */}
          {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
            <div
              key={`hdr-${w}`}
              className="heatmap-week-header"
              style={{
                fontSize: compact ? "9px" : "10px",
                textAlign: "center",
                color: xTicks.includes(w) ? "var(--color-text)" : "transparent",
                fontWeight: xTicks.includes(w) ? "600" : "normal",
                userSelect: "none",
                paddingBottom: "4px",
              }}
            >
              {xTicks.includes(w) ? w : ""}
            </div>
          ))}

          {/* Rows: One per year */}
          {matrix.map((row) => {
            const isForecast = row.year === forecastYear;
            return (
              <div key={`row-${row.year}`} style={{ display: "contents" }}>
                {/* Year label */}
                <div
                  className={`heatmap-year-label ${isForecast ? "heatmap-year-label--forecast" : ""}`}
                  style={{
                    fontSize: compact ? "10px" : "11px",
                    fontWeight: isForecast ? "700" : "500",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingRight: "6px",
                    color: isForecast ? "var(--color-warning)" : "var(--color-text-muted)",
                  }}
                >
                  <span>{row.year}</span>
                  {isForecast && (
                    <span
                      style={{
                        fontSize: "8px",
                        background: "rgba(245, 158, 11, 0.2)",
                        color: "#f59e0b",
                        padding: "1px 3px",
                        borderRadius: "3px",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                      }}
                    >
                      P
                    </span>
                  )}
                </div>

                {/* Week cells */}
                {row.values.map((val, wIdx) => {
                  const week = wIdx + 1;
                  const bg = getYlOrRdColor(val, minValue, maxValue);
                  return (
                    <div
                      key={`cell-${row.year}-${week}`}
                      className="heatmap-cell"
                      style={{
                        backgroundColor: bg,
                        height: compact ? "14px" : "20px",
                        borderRadius: "2px",
                        cursor: "pointer",
                        outline: isForecast ? "1px dashed rgba(245, 158, 11, 0.5)" : "none",
                        transition: "transform 100ms ease, box-shadow 100ms ease",
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredCell({
                          year: row.year,
                          week,
                          value: val,
                          isForecast,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Hover Floating Tooltip */}
        {hoveredCell && (
          <div
            className="heatmap-tooltip"
            style={{
              position: "fixed",
              left: Math.max(120, Math.min(window.innerWidth - 120, hoveredCell.x)),
              top: Math.max(40, hoveredCell.y),
              transform: "translate(-50%, -100%)",
              pointerEvents: "none",
              zIndex: 9999,
              background: "rgba(26, 29, 39, 0.96)",
              backdropFilter: "blur(8px)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "11px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--color-text-heading)", marginBottom: "2px" }}>
              Año {hoveredCell.year} — Sem. {hoveredCell.week}
              {hoveredCell.isForecast && (
                <span style={{ marginLeft: "6px", color: "var(--color-warning)", fontWeight: 700 }}>
                  (Pronóstico)
                </span>
              )}
            </div>
            <div style={{ color: "var(--color-text)" }}>
              Incidencia:{" "}
              <strong style={{ color: "var(--color-info)" }}>
                {hoveredCell.value !== null ? Number(hoveredCell.value).toFixed(3) : "N/D"}
              </strong>{" "}
              / 100k hab.
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className="heatmap-legend"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: "1px solid var(--color-border)",
          fontSize: "11px",
          color: "var(--color-text-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span>Baja ({minValue})</span>
          <div
            style={{
              width: "100px",
              height: "10px",
              borderRadius: "4px",
              background: "linear-gradient(to right, #ffffb2, #fecc5c, #fd8d3c, #f03b20, #bd0026)",
            }}
          />
          <span>Alta ({maxValue})</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                border: "1px dashed #f59e0b",
                display: "inline-block",
              }}
            />
            <span>Año Pronóstico ({forecastYear})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
