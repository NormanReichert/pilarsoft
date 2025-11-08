import { THEME } from "../config/theme";
import { GRAPH_CONFIG } from "./DiagramNsd";
import TextLabel from "./TextLabel";
import type { Travamento } from "../compute";

type DiagramMomentoProps = {
  title: string;
  top: number;    // Msd topo
  bottom: number; // Msd base
  m2d?: number;   // M2d (marcador meia-altura)
  m2dPoints?: Array<{ centroCm: number; value: number; Mbase: number; Mtop: number }>; // centro do segmento (cm), valor M2d e momentos das extremidades
  travamentos?: Travamento[]; // lista de travamentos
  alturaPilar?: number; // altura total do pilar em cm
  direcao?: 'x' | 'y'; // direção do diagrama para filtrar travamentos
  escalaGlobal?: number; // escala global para manter consistência entre diagramas X e Y
  gama_f?: number; // coeficiente de majoração das ações
};

function DiagramMomento({
  title,
  top,
  bottom,
  m2d,
  m2dPoints,
  travamentos,
  alturaPilar,
  direcao,
  escalaGlobal,
  gama_f = 1,
}: DiagramMomentoProps) {
  const w = 420,
    h = GRAPH_CONFIG.height,
    pad = 22,
    axisX = w / 2;

  // Ajuste do fator de escala
  // Usar escala global se fornecida, senão calcular baseado nos valores locais
  const maxAbs = escalaGlobal || Math.max(1, Math.abs(top), Math.abs(bottom), Math.abs(m2d || 0));
  const k = Math.min((w / 2 - pad), (w / 2 - pad)) / maxAbs * GRAPH_CONFIG.scale;

  // Determinar o sinal do M2d baseado no momento de maior magnitude nas extremidades
  const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
    return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
  };
  
  // Ajustar sinal do M2d global
  const maiorMomento = getMaiorMomento(top, bottom);
  const m2dAjustado = m2d !== undefined ? Math.abs(m2d) * Math.sign(maiorMomento) : m2d;

  const yTop = pad,
    yMid = h / 2,
    yBot = h - pad;
  const xTop = axisX + (top || 0) * k;
  const xM2d = axisX + (m2dAjustado || 0) * k;
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

          {/* Área hachurada e linha do diagrama */}
          {(() => {
            // Coletar todos os pontos do diagrama
            const pontos = [];
            
            // Ponto do topo
            pontos.push({ y: yTop, x: xTop, coordenada: alturaPilar || GRAPH_CONFIG.height });
            
            // Pontos dos travamentos (se houver)
            if (travamentos && direcao && alturaPilar) {
              travamentos
                .filter(t => t.direcao === direcao)
                .forEach(travamento => {
                  const yTrav = yBot - (yBot - yTop) * (travamento.coordenada / alturaPilar);
                  // Momento superior (majorado)
                  const xMomentoSup = axisX + (travamento.momentoSuperior * gama_f) * k;
                  pontos.push({ y: yTrav, x: xMomentoSup, coordenada: travamento.coordenada });
                  // Momento inferior (majorado)
                  const xMomentoInf = axisX + (travamento.momentoInferior * gama_f) * k;
                  pontos.push({ y: yTrav, x: xMomentoInf, coordenada: travamento.coordenada });
                });
            }
            
            // Pontos M2d por segmento (se houver travamentos)
            if (travamentos && direcao && travamentos.some(t => t.direcao === direcao) && m2dPoints && alturaPilar) {
              m2dPoints.forEach(p => {
                const alturaReferencia = alturaPilar || GRAPH_CONFIG.height;
                const y = yBot - (yBot - yTop) * (p.centroCm / alturaReferencia);
                const maiorMomentoSegmento = getMaiorMomento(p.Mtop, p.Mbase);
                const m2dSegmentoAjustado = Math.abs(p.value) * Math.sign(maiorMomentoSegmento);
                const x = axisX + m2dSegmentoAjustado * k;
                pontos.push({ y, x, coordenada: p.centroCm });
              });
            }
            
            // M2d global (se não houver travamentos)
            if (!travamentos || !direcao || !travamentos.some(t => t.direcao === direcao)) {
              pontos.push({ y: yMid, x: xM2d, coordenada: (alturaPilar || GRAPH_CONFIG.height) / 2 });
            }
            
            // Ponto da base
            pontos.push({ y: yBot, x: xBot, coordenada: 0 });
            
            // Ordenar pontos por coordenada (do topo para a base)
            pontos.sort((a, b) => b.coordenada - a.coordenada);
            
            // Criar path da linha do diagrama
            const pathData = pontos.reduce((path, ponto, index) => {
              if (index === 0) {
                return `M ${ponto.x} ${ponto.y}`;
              }
              return `${path} L ${ponto.x} ${ponto.y}`;
            }, '');
            
            // Criar path da área hachurada
            const areaPathData = `
              M ${axisX} ${yTop}
              ${pathData.substring(1)}
              L ${axisX} ${yBot}
              Z
            `;
            
            return (
              <>
                {/* Área hachurada */}
                <path
                  d={areaPathData}
                  fill={THEME.msd.fill}
                  stroke={THEME.msd.stroke}
                  strokeWidth={1}
                />
                
                {/* Linha do diagrama */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={THEME.msd.stroke}
                  strokeWidth={2}
                />
              </>
            );
          })()}

          {/* Pontos nos momentos */}
          <circle cx={xTop} cy={yTop} r={4} fill={THEME.msd.stroke} />
          {/* M2d global só é mostrado se não houver travamentos na direção */}
          {(!travamentos || !direcao || !travamentos.some(t => t.direcao === direcao)) && (
            <circle cx={xM2d} cy={yMid} r={4} fill={THEME.msd.stroke} />
          )}
          <circle cx={xBot} cy={yBot} r={4} fill={THEME.msd.stroke} />

          {/* Rótulos apenas com valores */}
          <TextLabel
            x={xTop + dx(xTop)}
            y={yTop - 6}
            text={Number(top).toFixed(2)}
            anchor={anchor(xTop)}
          />
          {/* Rótulo M2d global só é mostrado se não houver travamentos na direção */}
          {(!travamentos || !direcao || !travamentos.some(t => t.direcao === direcao)) && (
            <TextLabel
              x={xM2d + dx(xM2d)}
              y={yMid - 6}
              text={Number(m2dAjustado).toFixed(2)}
              anchor={anchor(xM2d)}
            />
          )}
          <TextLabel
            x={xBot + dx(xBot)}
            y={yBot + 14}
            text={Number(bottom).toFixed(2)}
            anchor={anchor(xBot)}
          />

          {/* Pontos M2d por segmento (só mostrados quando há travamentos) */}
          {(travamentos && direcao && travamentos.some(t => t.direcao === direcao)) && 
            m2dPoints?.map((p, i) => {
              // Usar alturaPilar se disponível, senão usar GRAPH_CONFIG.height como fallback
              const alturaReferencia = alturaPilar || GRAPH_CONFIG.height;
              // Corrigir coordenada: 0 é na base (yBot), alturaReferencia é no topo (yTop)
              const y = yBot - (yBot - yTop) * (p.centroCm / alturaReferencia);
              
              // Debug: log dos valores
              console.log(`Segmento ${i}: Mtop=${p.Mtop}, Mbase=${p.Mbase}, M2d original=${p.value}`);
              
              // Ajustar sinal do M2d do segmento baseado no maior momento das extremidades
              const maiorMomentoSegmento = getMaiorMomento(p.Mtop, p.Mbase);
              const m2dSegmentoAjustado = Math.abs(p.value) * Math.sign(maiorMomentoSegmento);
              
              console.log(`Maior momento: ${maiorMomentoSegmento}, M2d ajustado: ${m2dSegmentoAjustado}`);
              
              const x = axisX + m2dSegmentoAjustado * k;
              
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={3} fill={THEME.m2.stroke} />
                  <TextLabel x={x + (x >= axisX ? 4 : -4)} y={y - 6} text={Number(m2dSegmentoAjustado).toFixed(2)} anchor={anchor(x)} />
                </g>
              );
            })
          }

          {/* Travamentos (se fornecidos) */}
          {travamentos && alturaPilar && direcao && travamentos
            .filter(t => t.direcao === direcao)
            .map((travamento, i) => {
              // Calcular a posição Y do travamento com base na coordenada (corrigido: 0 na base, alturaPilar no topo)
              const yTrav = yBot - (yBot - yTop) * (travamento.coordenada / alturaPilar);
              
              // Calcular posições X dos momentos usando a mesma escala (majorados)
              const xMomentoSup = axisX + (travamento.momentoSuperior * gama_f) * k;
              const xMomentoInf = axisX + (travamento.momentoInferior * gama_f) * k;
              
              return (
                <g key={`trav-${i}`}>
                  {/* Ponto do travamento no eixo */}
                  <circle
                    cx={axisX}
                    cy={yTrav}
                    r={4}
                    fill={direcao === 'x' ? '#2563eb' : '#dc2626'}
                    stroke="white"
                    strokeWidth={2}
                  />
                  
                  {/* Momento Superior - bolinha branca */}
                  <circle
                    cx={xMomentoSup}
                    cy={yTrav}
                    r={3}
                    fill="white"
                    stroke={THEME.msd.stroke}
                    strokeWidth={1}
                  />
                  <TextLabel
                    x={xMomentoSup + (xMomentoSup >= axisX ? 2 : -2)}
                    y={yTrav - 6}
                    text={`${(travamento.momentoSuperior * gama_f).toFixed(1)}`}
                    anchor={xMomentoSup >= axisX ? "start" : "end"}
                  />
                  
                  {/* Momento Inferior - bolinha branca */}
                  <circle
                    cx={xMomentoInf}
                    cy={yTrav}
                    r={3}
                    fill="white"
                    stroke={THEME.msd.stroke}
                    strokeWidth={1}
                  />
                  <TextLabel
                    x={xMomentoInf + (xMomentoInf >= axisX ? 2 : -2)}
                    y={yTrav + 14}
                    text={`${(travamento.momentoInferior * gama_f).toFixed(1)}`}
                    anchor={xMomentoInf >= axisX ? "start" : "end"}
                  />
                </g>
              );
            })}
        </svg>
      </div>
    </div>
  );
}
export default DiagramMomento;