import { useState } from "react";
import { THEME } from "../config/theme.tsx";
import SectionTitle from "./SectionTitle";

type Armadura = {
  cgX: string;
  cgY: string;
  cgXCalc: number;
  cgYCalc: number;
  area: number;
  diametro: number;
};

type Props = {
  armaduras: Armadura[];
  onArmadurasChange: (armaduras: Armadura[]) => void;
  larguraSecao: number; // a
  alturaSecao: number;  // b
};

export default function ArmadurasManager({ armaduras, onArmadurasChange, larguraSecao, alturaSecao }: Props) {
  const [coordX, setCoordX] = useState<number>(3);
  const [coordY, setCoordY] = useState<number>(3);
  const [diametro, setDiametro] = useState<number>(12.5);

  const adicionarArmadura = () => {
    // Validar se as coordenadas estão dentro da seção
    if (coordX < 0 || coordX > larguraSecao || coordY < 0 || coordY > alturaSecao) {
      alert(`Coordenadas devem estar entre (0,0) e (${larguraSecao},${alturaSecao})`);
      return;
    }

    const novaArmadura: Armadura = {
      cgX: coordX.toString(),
      cgY: coordY.toString(),
      cgXCalc: coordX,
      cgYCalc: coordY,
      area: Math.PI * Math.pow(diametro / 20, 2), // área em cm²
      diametro: diametro
    };

    onArmadurasChange([...armaduras, novaArmadura]);
  };

  const removerArmadura = (index: number) => {
    onArmadurasChange(armaduras.filter((_, i) => i !== index));
  };

  const limparArmaduras = () => {
    onArmadurasChange([]);
  };

  // Configurações para visualização SVG
  const padding = 40;
  const extraSpace = 80; // Espaço extra para cotas
  const scale = Math.min(400 / larguraSecao, 400 / alturaSecao);
  const svgWidth = larguraSecao * scale + 2 * padding + extraSpace;
  const svgHeight = alturaSecao * scale + 2 * padding + extraSpace;

  // Função para converter coordenadas reais em coordenadas SVG
  const toSvgX = (x: number) => padding + x * scale;
  const toSvgY = (y: number) => padding + (alturaSecao - y) * scale; // Inverter Y

  return (
    <div>
      <SectionTitle>Armaduras</SectionTitle>
      
      {/* Formulário de Adição */}
      <div style={{ 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: THEME.canvasBg,
        borderRadius: '8px',
        border: `1px solid ${THEME.border}`
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '15px', 
          marginBottom: '15px' 
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 600,
              fontSize: 14,
              color: THEME.pageText
            }}>
              Coordenada X (cm):
            </label>
            <input
              type="number"
              value={coordX}
              onChange={(e) => setCoordX(Number(e.target.value))}
              min={0}
              max={larguraSecao}
              step={0.1}
              style={{ 
                width: '100%', 
                padding: '8px',
                borderRadius: '8px',
                border: `1px solid ${THEME.border}`,
                background: '#0b1220',
                color: THEME.pageText,
                fontSize: 14
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 600,
              fontSize: 14,
              color: THEME.pageText
            }}>
              Coordenada Y (cm):
            </label>
            <input
              type="number"
              value={coordY}
              onChange={(e) => setCoordY(Number(e.target.value))}
              min={0}
              max={alturaSecao}
              step={0.1}
              style={{ 
                width: '100%', 
                padding: '8px',
                borderRadius: '8px',
                border: `1px solid ${THEME.border}`,
                background: '#0b1220',
                color: THEME.pageText,
                fontSize: 14
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 600,
              fontSize: 14,
              color: THEME.pageText
            }}>
              Diâmetro (mm):
            </label>
            <input
              type="number"
              value={diametro}
              onChange={(e) => setDiametro(Number(e.target.value))}
              min={6}
              max={40}
              step={0.1}
              style={{ 
                width: '100%', 
                padding: '8px',
                borderRadius: '8px',
                border: `1px solid ${THEME.border}`,
                background: '#0b1220',
                color: THEME.pageText,
                fontSize: 14
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={adicionarArmadura}
            style={{
              padding: '8px 16px',
              backgroundColor: '#334155',
              color: THEME.pageText,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            + Adicionar
          </button>

          {armaduras.length > 0 && (
            <button
              onClick={limparArmaduras}
              style={{
                padding: '8px 16px',
                backgroundColor: THEME.canvasBg,
                color: THEME.pageText,
                border: `1px solid ${THEME.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Visualização SVG da Seção Transversal */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: THEME.canvasBg,
        borderRadius: '8px',
        border: `1px solid ${THEME.border}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <svg 
          width={svgWidth} 
          height={svgHeight}
          style={{ 
            backgroundColor: '#0a0f1a',
            borderRadius: '4px'
          }}
        >
          {/* Retângulo da seção */}
          <rect
            x={padding}
            y={padding}
            width={larguraSecao * scale}
            height={alturaSecao * scale}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="2"
          />

          {/* Grid de referência */}
          {[...Array(11)].map((_, i) => {
            const x = padding + (larguraSecao * scale * i) / 10;
            const y = padding + (alturaSecao * scale * i) / 10;
            return (
              <g key={i}>
                {/* Linhas verticais */}
                <line
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={padding + alturaSecao * scale}
                  stroke="#334155"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
                {/* Linhas horizontais */}
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + larguraSecao * scale}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              </g>
            );
          })}

          {/* Dimensões - Largura */}
          <g>
            <line
              x1={padding}
              y1={padding + alturaSecao * scale + 20}
              x2={padding + larguraSecao * scale}
              y2={padding + alturaSecao * scale + 20}
              stroke={THEME.pageText}
              strokeWidth="1"
              markerStart="url(#arrowStart)"
              markerEnd="url(#arrowEnd)"
            />
            <text
              x={padding + (larguraSecao * scale) / 2}
              y={padding + alturaSecao * scale + 35}
              textAnchor="middle"
              fill={THEME.pageText}
              fontSize="12"
              fontWeight="600"
            >
              a = {larguraSecao.toFixed(1)} cm
            </text>
          </g>

          {/* Dimensões - Altura */}
          <g>
            <line
              x1={padding + larguraSecao * scale + 20}
              y1={padding}
              x2={padding + larguraSecao * scale + 20}
              y2={padding + alturaSecao * scale}
              stroke={THEME.pageText}
              strokeWidth="1"
              markerStart="url(#arrowStart)"
              markerEnd="url(#arrowEnd)"
            />
            <text
              x={padding + larguraSecao * scale + 35}
              y={padding + (alturaSecao * scale) / 2}
              textAnchor="middle"
              fill={THEME.pageText}
              fontSize="12"
              fontWeight="600"
              transform={`rotate(-90 ${padding + larguraSecao * scale + 35} ${padding + (alturaSecao * scale) / 2})`}
            >
              b = {alturaSecao.toFixed(1)} cm
            </text>
          </g>

          {/* Armaduras */}
          {armaduras.map((barra, index) => {
            const cx = toSvgX(barra.cgXCalc);
            const cy = toSvgY(barra.cgYCalc);
            const raio = (barra.diametro / 10) * scale * 0.5; // Diâmetro em mm convertido para raio visual

            return (
              <g key={index}>
                {/* Círculo da armadura */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={Math.max(raio, 3)} // Raio mínimo de 3px para visibilidade
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                {/* Número da armadura */}
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fill="#000"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {index + 1}
                </text>
                {/* Coordenadas */}
                <text
                  x={cx}
                  y={cy - raio - 8}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize="9"
                >
                  ({barra.cgXCalc.toFixed(1)}, {barra.cgYCalc.toFixed(1)})
                </text>
              </g>
            );
          })}

          {/* Sistema de coordenadas */}
          <g>
            {/* Origem (0,0) */}
            <circle
              cx={padding}
              cy={padding + alturaSecao * scale}
              r="3"
              fill="#ef4444"
            />
            <text
              x={padding - 5}
              y={padding + alturaSecao * scale + 15}
              textAnchor="end"
              fill="#ef4444"
              fontSize="10"
              fontWeight="600"
            >
              (0, 0)
            </text>
          </g>

          {/* Marcadores de seta */}
          <defs>
            <marker
              id="arrowStart"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="5"
              orient="auto"
            >
              <polygon
                points="10,5 0,0 0,10"
                fill={THEME.pageText}
              />
            </marker>
            <marker
              id="arrowEnd"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="5"
              orient="auto"
            >
              <polygon
                points="0,5 10,0 10,10"
                fill={THEME.pageText}
              />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Tabela de Armaduras */}
      {armaduras.length > 0 && (
        <div style={{
          backgroundColor: THEME.canvasBg,
          borderRadius: '8px',
          border: `1px solid ${THEME.border}`,
          overflow: 'hidden'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: THEME.border,
                borderBottom: `1px solid ${THEME.border}`
              }}>
                <th style={{ 
                  padding: '10px', 
                  textAlign: 'left',
                  color: THEME.pageText,
                  fontWeight: 600,
                  fontSize: 12
                }}>#</th>
                <th style={{ 
                  padding: '10px', 
                  textAlign: 'center',
                  color: THEME.pageText,
                  fontWeight: 600,
                  fontSize: 12
                }}>Coord. X (cm)</th>
                <th style={{ 
                  padding: '10px', 
                  textAlign: 'center',
                  color: THEME.pageText,
                  fontWeight: 600,
                  fontSize: 12
                }}>Coord. Y (cm)</th>
                <th style={{ 
                  padding: '10px', 
                  textAlign: 'center',
                  color: THEME.pageText,
                  fontWeight: 600,
                  fontSize: 12
                }}>Diâmetro (mm)</th>
                <th style={{ 
                  padding: '10px', 
                  textAlign: 'center',
                  color: THEME.pageText,
                  fontWeight: 600,
                  fontSize: 12
                }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {armaduras.map((barra, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: `1px solid ${THEME.border}`
                  }}
                >
                  <td style={{ 
                    padding: '10px',
                    color: THEME.pageText,
                    fontSize: 12
                  }}>{index + 1}</td>
                  <td style={{ 
                    padding: '10px', 
                    textAlign: 'center',
                    color: THEME.pageText,
                    fontSize: 12
                  }}>
                    {barra.cgXCalc.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    textAlign: 'center',
                    color: THEME.pageText,
                    fontSize: 12
                  }}>
                    {barra.cgYCalc.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    textAlign: 'center',
                    color: THEME.pageText,
                    fontSize: 12
                  }}>
                    {barra.diametro}
                  </td>
                  <td style={{ 
                    padding: '10px', 
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => removerArmadura(index)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
