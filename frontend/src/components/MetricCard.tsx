interface MetricCardProps {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  acento?: boolean;
}

export default function MetricCard({ titulo, valor, subtitulo, acento }: MetricCardProps) {
  return (
    <div className={`metric-card${acento ? " metric-card--accent" : ""}`}>
      <span className="metric-card__title">{titulo}</span>
      <span className="metric-card__value">{valor}</span>
      {subtitulo && <span className="metric-card__sub">{subtitulo}</span>}
    </div>
  );
}
