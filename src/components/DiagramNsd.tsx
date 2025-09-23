import { THEME } from "../config/theme";
import TextLabel from "./TextLabel";

export const GRAPH_CONFIG = {
  gap: 60,        // espaçamento entre gráficos
  scale: .5,      // escala horizontal dos gráficos
  lineWidth: 2,   // espessura da linha do pilar
  height: 400     // nova altura dos containers (era 300)
};

function DiagramNsd({ nsd }: { nsd: number }) {
  const w = 420,
    h = GRAPH_CONFIG.height,
    pad = 20,
    axisX = w / 2,
    lineLength = 40;

  const yTop = pad,
    yBot = h - pad;  // removido yMid pois não é usado

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: THEME.pageText }}>Nsd (kN)</div>
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
              L ${axisX + lineLength} ${yTop}
              L ${axisX + lineLength} ${yBot}
              L ${axisX} ${yBot}
              Z
            `}
            fill={THEME.msd.fill}
            stroke={THEME.msd.stroke}
            strokeWidth={1}
          />

          {/* Pontos nos extremos */}
          <circle cx={axisX + lineLength} cy={yTop} r={4} fill={THEME.msd.stroke} />
          <circle cx={axisX + lineLength} cy={yBot} r={4} fill={THEME.msd.stroke} />

          {/* Valores no topo e base */}
          <TextLabel
            x={axisX + lineLength + 8}
            y={yTop - 6}
            text={Number.isFinite(nsd) ? nsd.toFixed(2) : "—"}
          />
          <TextLabel
            x={axisX + lineLength + 8}
            y={yBot + 14}
            text={Number.isFinite(nsd) ? nsd.toFixed(2) : "—"}
          />
        </svg>
      </div>
    </div>
  );
}

export default DiagramNsd;