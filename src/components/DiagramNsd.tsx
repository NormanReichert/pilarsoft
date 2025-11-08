import { THEME } from "../config/theme";
import TextLabel from "./TextLabel";
import type { Travamento } from "../compute";

export const GRAPH_CONFIG = {
  gap: 60,        // espaçamento entre gráficos
  scale: .8,      // escala horizontal dos gráficos
  lineWidth: 2,   // espessura da linha do pilar
  height: 400     // nova altura dos containers (era 300)
};

function DiagramNsd({ 
  nsd, 
  travamentos, 
  alturaPilar,
  gama_f = 1
}: { 
  nsd: number;
  travamentos?: Travamento[];
  alturaPilar?: number;
  gama_f?: number;
}) {
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

          {/* Diagrama de cargas com travamentos */}
          {(() => {
            // Se não há travamentos, mostrar carga constante
            if (!travamentos || travamentos.length === 0 || !alturaPilar) {
              return (
                <>
                  {/* Área hachurada constante */}
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
                </>
              );
            }
            
            // Coletar pontos de carga (incluindo travamentos)
            const pontosCarga = [];
            
            // Ponto do topo (carga original)
            pontosCarga.push({ coordenada: alturaPilar, carga: nsd, y: yTop });
            
            // Validar e processar travamentos por coordenada
            const travamentosPorCoordenada = new Map();
            const avisosValidacao: { coordenada: number; texto: string }[] = [];
            
            // Agrupar travamentos por coordenada e direção para validação
            const travamentosPorCoordDir = new Map<number, {x?: number, y?: number}>();
            
            travamentos.forEach(t => {
              const coord = t.coordenada;
              if (!travamentosPorCoordDir.has(coord)) {
                travamentosPorCoordDir.set(coord, {});
              }
              const grupo = travamentosPorCoordDir.get(coord)!;
              grupo[t.direcao] = t.compressao * gama_f; // Majorar a compressão
            });
            
            // Validar e determinar cargas finais por coordenada
            travamentosPorCoordDir.forEach((direcoes, coord) => {
              const temX = direcoes.x !== undefined;
              const temY = direcoes.y !== undefined;
              
              if (temX && temY) {
                // Ambas direções presentes - devem ser iguais
                if (direcoes.x === direcoes.y) {
                  // Iguais: usar o valor (não somar)
                  travamentosPorCoordenada.set(coord, direcoes.x!);
                } else {
                  // Diferentes: emitir aviso e não processar esta coordenada
                  const aviso = { coordenada: coord, texto: `Revisar Nsk` };
                  avisosValidacao.push(aviso);
                  console.warn(aviso.texto);
                  // Não adiciona ao travamentosPorCoordenada para não processar
                }
              } else {
                // Apenas uma direção: usar esse valor
                const valor = direcoes.x !== undefined ? direcoes.x : direcoes.y!;
                travamentosPorCoordenada.set(coord, valor);
              }
            });
            
            // Adicionar pontos dos travamentos
            travamentosPorCoordenada.forEach((compressaoTotal, coordenada) => {
              const y = yBot - (yBot - yTop) * (coordenada / alturaPilar);
              // O valor no travamento é exatamente a compressão inserida pelo usuário
              pontosCarga.push({ coordenada, carga: compressaoTotal, y });
            });
            
            // Determinar carga na base
            let cargaNaBase = nsd; // valor padrão se não houver travamentos
            if (travamentosPorCoordenada.size > 0) {
              // Encontrar o travamento mais próximo da base (menor coordenada)
              const coordenadaMenor = Math.min(...Array.from(travamentosPorCoordenada.keys()));
              cargaNaBase = travamentosPorCoordenada.get(coordenadaMenor);
            }
            
            // Ponto da base (carga do último travamento ou carga do topo)
            pontosCarga.push({ coordenada: 0, carga: cargaNaBase, y: yBot });
            
            // Ordenar por coordenada (do topo para a base)
            pontosCarga.sort((a, b) => b.coordenada - a.coordenada);
            
            // Criar path da linha de carga
            const maxCarga = Math.max(...pontosCarga.map(p => Math.abs(p.carga)));
            const escala = maxCarga > 0 ? lineLength / maxCarga : 1;
            
            // Criar path em formato "escada" com segmentos horizontais e transições verticais
            let pathData = '';
            let areaPathData = '';
            
            if (pontosCarga.length > 0) {
              // Começar com o primeiro ponto
              const primeiroX = axisX + Math.abs(pontosCarga[0].carga) * escala;
              pathData = `M ${primeiroX} ${pontosCarga[0].y}`;
              areaPathData = `M ${axisX} ${yTop} L ${primeiroX} ${pontosCarga[0].y}`;
              
              // Para cada segmento subsequente
              for (let i = 1; i < pontosCarga.length; i++) {
                const pontoAtual = pontosCarga[i];
                const pontoAnterior = pontosCarga[i - 1];
                const xAtual = axisX + Math.abs(pontoAtual.carga) * escala;
                const xAnterior = axisX + Math.abs(pontoAnterior.carga) * escala;
                
                // Linha horizontal (manter a carga do segmento anterior)
                pathData += ` L ${xAnterior} ${pontoAtual.y}`;
                areaPathData += ` L ${xAnterior} ${pontoAtual.y}`;
                
                // Transição vertical (mudança para nova carga)
                pathData += ` L ${xAtual} ${pontoAtual.y}`;
                areaPathData += ` L ${xAtual} ${pontoAtual.y}`;
              }
              
              // Fechar a área
              areaPathData += ` L ${axisX} ${yBot} Z`;
            }
            
            return (
              <>
                {/* Área hachurada */}
                <path
                  d={areaPathData}
                  fill={THEME.msd.fill}
                  stroke={THEME.msd.stroke}
                  strokeWidth={1}
                />
                
                {/* Linha de carga */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={THEME.msd.stroke}
                  strokeWidth={2}
                />
                
                {/* Pontos e valores */}
                {pontosCarga.map((ponto, index) => {
                  const x = axisX + Math.abs(ponto.carga) * escala;
                  return (
                    <g key={index}>
                      <circle cx={x} cy={ponto.y} r={3} fill={THEME.msd.stroke} />
                      <TextLabel
                        x={x + 8}
                        y={ponto.y + (index === 0 ? -6 : index === pontosCarga.length - 1 ? 14 : 3)}
                        text={ponto.carga.toFixed(2)}
                      />
                    </g>
                  );
                })}
                
                {/* Marcadores de travamentos no eixo do pilar */}
                {(() => {
                  // Obter todas as coordenadas únicas de travamentos
                  const coordenadasUnicas = [...new Set(travamentos.map(t => t.coordenada))];
                  
                  return coordenadasUnicas.map(coordenada => {
                    const y = yBot - (yBot - yTop) * (coordenada / alturaPilar);
                    const travamentosNaCoordenada = travamentos.filter(t => t.coordenada === coordenada);
                    
                    // Verificar se há travamentos em ambas direções
                    const temX = travamentosNaCoordenada.some(t => t.direcao === 'x');
                    const temY = travamentosNaCoordenada.some(t => t.direcao === 'y');
                    
                    // Verificar se há problema de validação nesta coordenada
                    const temProblema = avisosValidacao.some(aviso => 
                      aviso.coordenada === coordenada
                    );
                    
                    if (temX && temY) {
                      // Ambas direções: roxa se há problema, azul se está ok
                      const cor = temProblema ? '#6000b9ff' : '#2563eb';
                      return (
                        <circle
                          key={`trav-${coordenada}`}
                          cx={axisX}
                          cy={y}
                          r={4}
                          fill={cor}
                          stroke="white"
                          strokeWidth={2}
                        />
                      );
                    } else {
                      // Uma direção: usar cor específica
                      const cor = temX ? '#2563eb' : '#dc2626';
                      return (
                        <circle
                          key={`trav-${coordenada}`}
                          cx={axisX}
                          cy={y}
                          r={4}
                          fill={cor}
                          stroke="white"
                          strokeWidth={2}
                        />
                      );
                    }
                  });
                })()}
                
                {/* Ícones de aviso para coordenadas com problemas de validação */}
                {avisosValidacao.map((aviso, index) => {
                  const coordenada = aviso.coordenada;
                  const y = yBot - (yBot - yTop) * (coordenada / alturaPilar);
                  
                  return (
                    <g key={`aviso-${index}`}>
                      {/* Triângulo de aviso - posicionado fora do gráfico */}
                      <path
                        d={`M ${axisX + lineLength + 25} ${y - 9} L ${axisX + lineLength + 35.5} ${y + 6} L ${axisX + lineLength + 14.5} ${y + 6} Z`}
                        fill="#fbbf24"
                        stroke="#f59e0b"
                        strokeWidth={1}
                      />
                      {/* Ponto de exclamação */}
                      <text
                        x={axisX + lineLength + 25}
                        y={y + 4}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#92400e"
                        fontWeight="bold"
                      >
                        !
                      </text>
                      {/* Texto do aviso */}
                      <TextLabel
                        x={axisX + lineLength + 45}
                        y={y}
                        text={aviso.texto}
                      />
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

export default DiagramNsd;