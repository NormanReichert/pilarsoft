import { THEME } from "../config/theme";
import { GRAPH_CONFIG } from "./DiagramNsd";
import TextLabel from "./TextLabel";

type DiagramMomentoProps = {
  title: string;
  top: number;    // Msd topo
  bottom: number; // Msd base
  m2d?: number;   // M2d (marcador meia-altura)
  m2dPoints?: Array<{ centroCm: number; value: number }>; // centro do segmento (cm), valor M2d
};

function DiagramMomento({
  title,
  top,
  bottom,
  m2d,
  m2dPoints,
}: DiagramMomentoProps) {
  const w = 420,
    h = GRAPH_CONFIG.height,
    pad = 22,
    axisX = w / 2;

  // Ajuste do fator de escala
  const maxAbs = Math.max(1, Math.abs(top), Math.abs(bottom), Math.abs(m2d || 0));
  const k = Math.min((w / 2 - pad), (w / 2 - pad)) / maxAbs * GRAPH_CONFIG.scale;

  const yTop = pad,
    yMid = h / 2,
    yBot = h - pad;
  const xTop = axisX + (top || 0) * k;
  const xM2d = axisX + (m2d || 0) * k;
  const xBot = axisX + (bottom || 0) * k;

  const anchor = (x: number) => (x >= axisX ? "start" : "end") as "start" | "end";
  const dx = (x: number) => (x >= axisX ? 2 : -2);

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: THEME.pageText }}>{title}</div>
      <div style={{
        borderRadius: 12,
        border: `1px solid ${THEME.border}`,
        overflow: 'hidden',
        background: THEME.canvasBg,
        height: h // forçar altura do container
      }}>
        <svg width={w} height={h} style={{ display: 'block', width: '100%', height: '100%' }}>
          {/* Linha vertical do pilar */}
          <line
            x1={axisX}
            y1={pad}
            x2={axisX}
            y2={h - pad}
            stroke={THEME.axis.stroke}
            strokeWidth={GRAPH_CONFIG.lineWidth}
          />

          {/* Área hachurada */}
          <path
            d={`
              M ${axisX} ${yTop}
              L ${xTop} ${yTop}
              L ${xM2d} ${yMid}
              L ${xBot} ${yBot}
              L ${axisX} ${yBot}
              Z
            `}
            fill={THEME.msd.fill}
            stroke={THEME.msd.stroke}
            strokeWidth={1}
          />

          {/* Linha direta entre topo e base */}
          <line
            x1={xTop}
            y1={yTop}
            x2={xBot}
            y2={yBot}
            stroke={THEME.msd.stroke}
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Pontos nos momentos */}
          <circle cx={xTop} cy={yTop} r={4} fill={THEME.msd.stroke} />
          <circle cx={xM2d} cy={yMid} r={4} fill={THEME.msd.stroke} />
          <circle cx={xBot} cy={yBot} r={4} fill={THEME.msd.stroke} />

          {/* Rótulos apenas com valores */}
          <TextLabel
            x={xTop + dx(xTop)}
            y={yTop - 6}
            text={Number(top).toFixed(2)}
            anchor={anchor(xTop)}
          />
          <TextLabel
            x={xM2d + dx(xM2d)}
            y={yMid - 6}
            text={Number(m2d).toFixed(2)}
            anchor={anchor(xM2d)}
          />
          <TextLabel
            x={xBot + dx(xBot)}
            y={yBot + 14}
            text={Number(bottom).toFixed(2)}
            anchor={anchor(xBot)}
          />

          {/* Pontos M2d por segmento (se fornecidos) */}
          {m2dPoints?.map((p, i) => {
            const y = yTop + (yBot - yTop) * (p.centroCm / GRAPH_CONFIG.height);
            const x = axisX + (p.value || 0) * k;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={3} fill={THEME.m2.stroke} />
                <TextLabel x={x + (x >= axisX ? 4 : -4)} y={y - 6} text={Number(p.value).toFixed(2)} anchor={anchor(x)} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
export default DiagramMomento;