// KappaCalc.tsx — Header fixo full-width (título+abas), tema escuro,
// gráficos lado a lado, rótulos próximos e "Dados brutos" em duas tabelas.

import { useMemo, useState } from "react";
import {
  compute,
  defaultInputs,
  type Inputs,
  type Outputs,
  type Travamento,
  dividirPilarEmSegmentos,
  calcularComprimentoFlambagem,
  resolverKappaMsd_x,
  resolverKappaMsd_y,
} from "./compute";

/* ===================== TEMA (ESCURO) ===================== */
const THEME = {
  // Gráficos
  canvasBg: "#111827", // fundo dos SVGs e do header
  pageText: "#e5e7eb", // texto principal
  subtle: "#94a3b8", // textos secundários
  axis: { stroke: "#f8fafc", width: 4 },
  col: { fill: "#8cd3ff" }, // “coluna”
  msd: { fill: "#60a5fa", stroke: "#e5e7eb" }, // polígono Msd
  m1: { fill: "#2563eba6", stroke: "#e5e7eb" }, // faixa M1dmin
  m2: { stroke: "#e5e7eb" }, // linha/ponto M2d
  border: "#1f2937",

  // Header + Abas
  header: {
    bg: "#111827",
    border: "#1f2937",
  },
  tabs: {
    activeBg: "#334155",
    inactiveBg: "#1f2937",
    activeText: "#e5e7eb",
    inactiveText: "#e5e7eb",
  },
};

/* ===================== HEADER FIXO ===================== */
const HEADER_H = 82; // altura do header fixo

type TabKey = "entrada" | "resultados" | "brutos" | "diagrama";
const TABS: { k: TabKey; t: string }[] = [
  { k: "entrada", t: "Dados de entrada" },
  { k: "resultados", t: "Resultados" },
  { k: "diagrama", t: "Diagrama de interação" },
  { k: "brutos", t: "Dados brutos" },
];

function FixedHeader({
  tab,
  setTab,
}: {
  tab: TabKey;
  setTab: (t: TabKey) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: THEME.header.bg,
        borderBottom: `1px solid ${THEME.header.border}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ 
        padding: "10px 24px 15px",  // Remove maxWidth e margin
      }}>
        {/* Título acima das abas */}
        <h1 style={{ 
          margin: 0, 
          fontSize: 22, 
          fontWeight: 700, 
          color: THEME.pageText,
        }}>
          PILARSOFT
        </h1>

        {/* Abas */}
        <div style={{ 
          display: "flex", 
          gap: 10, 
          marginTop: 10, 
          flexWrap: "wrap",
        }}>
          {TABS.map(({ k, t }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${THEME.header.border}`,
                background: tab === k ? THEME.tabs.activeBg : THEME.tabs.inactiveBg,
                color: tab === k ? THEME.tabs.activeText : THEME.tabs.inactiveText,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================== HELPERS DE UI ===================== */
function SectionTitle({ children }: { children: string }) {
  return (
    <h3 style={{ 
      fontSize: 16, 
      fontWeight: 700, 
      margin: "12px 0 8px" // reduzir margens
    }}>
      {children}
    </h3>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ 
      display: "flex",
      gap: 50,
      flexWrap: "wrap",
      marginBottom: 10
    }}>
      {children}
    </div>
  );
}

function LabeledNumber(props: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  const { label, unit, value, onChange, min, step } = props;
  return (
    <label style={{ 
      display: "grid", 
      gap: 6,
      width: 160
    }}>
      <span style={{ 
        fontSize: 14,
        color: THEME.subtle,
        fontWeight: 400
      }}>
        {label}
        {unit ? ` (${unit})` : ""}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        min={min}
        step={step ?? 0.01}
        style={{ 
          border: "1px solid #475569", 
          borderRadius: 8, 
          padding: "8px 10px", 
          background: "#0b1220", 
          color: THEME.pageText,
          fontWeight: 400,
          fontSize: 14
        }}
      />
    </label>
  );
}

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/* ===== Texto com leve contorno (melhor legibilidade no dark) ===== */
function TextLabel({
  x,
  y,
  text,
  anchor = "start",
}: {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={12}
      stroke="#000000"
      strokeWidth={2}
      paintOrder="stroke"
      fill={THEME.pageText}
    >
      {text}
    </text>
  );
}

/* ===================== DIAGRAMAS ===================== */
const GRAPH_CONFIG = {
  gap: 60,        // espaçamento entre gráficos
  scale: .5,      // escala horizontal dos gráficos
  lineWidth: 2,   // espessura da linha do pilar
  height: 400     // nova altura dos containers (era 300)
};

function DiagramNsd({ nsd }: { nsd: number }) {
  const w = 420,
    h = GRAPH_CONFIG.height,
    pad = 20,
    axisX = w/2,
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
    axisX = w/2;

  // Ajuste do fator de escala
  const maxAbs = Math.max(1, Math.abs(top), Math.abs(bottom), Math.abs(m2d || 0));
  const k = Math.min((w/2 - pad), (w/2 - pad)) / maxAbs * GRAPH_CONFIG.scale;

  const yTop = pad,
    yMid = h/2,
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
                <TextLabel x={x + (x>=axisX?4:-4)} y={y-6} text={Number(p.value).toFixed(2)} anchor={anchor(x)} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ===================== CAMPOS / GRUPOS ===================== */
const fieldDefs: Array<{ key: keyof Inputs; label: string; unit?: string; min?: number; step?: number }> = [
  { key: "a", label: "a", unit: "cm", min: 1, step: 1},
  { key: "b", label: "b", unit: "cm", min: 1, step: 1},
  { key: "h", label: "h", unit: "cm", min: 1, step: 1},
  { key: "gama_c", label: "gama-c", min: 1, step: 0.01 },
  { key: "gama_s", label: "gama-s", min: 1, step: 0.01 },
  { key: "gama_f", label: "gama-f", min: 1, step: 0.01 },
  { key: "fck", label: "fck", unit: "MPa", min: 1 },
  { key: "fyk", label: "fyk", unit: "MPa", min: 1 },
  { key: "Nsk", label: "Nsk", unit: "kN", min: 0 },
  { key: "Msk_tx", label: "Msk,x (topo)", unit: "kN·m", step: 0.1 },
  { key: "Msk_bx", label: "Msk,x (base)", unit: "kN·m", step: 0.1 },
  { key: "Msk_ty", label: "Msk,y (topo)", unit: "kN·m", step: 0.1 },
  { key: "Msk_by", label: "Msk,y (base)", unit: "kN·m", step: 0.1 },
];

const groups: Record<"geometria" | "coef" | "materiais" | "esforcos", Array<keyof Inputs>> = {
  geometria: ["a", "b", "h"],
  coef: ["gama_c", "gama_s", "gama_f"],
  materiais: ["fck", "fyk"],
  esforcos: ["Nsk", "Msk_tx", "Msk_bx", "Msk_ty", "Msk_by"],
};

/* ===================== COMPONENTE DE TRAVAMENTOS ===================== */
function TravamentosManager({
  travamentos,
  onTravamentosChange,
  alturaTotal,
}: {
  travamentos: Travamento[];
  onTravamentosChange: (travamentos: Travamento[]) => void;
  alturaTotal: number;
}) {
  const adicionarTravamento = (direcao: 'x' | 'y') => {
    const novoTravamento: Travamento = {
      id: `trav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      coordenada: alturaTotal / 2, // posição padrão no meio
      compressao: 0, // valor padrão
      momento: 0, // valor padrão
      direcao,
    };
    onTravamentosChange([...travamentos, novoTravamento]);
  };

  const removerTravamento = (id: string) => {
    onTravamentosChange(travamentos.filter(t => t.id !== id));
  };

  const atualizarTravamento = (id: string, campo: keyof Travamento, valor: any) => {
    onTravamentosChange(
      travamentos.map(t => {
        if (t.id === id) {
          if (campo === 'coordenada') {
            return { ...t, [campo]: Math.max(0, Math.min(alturaTotal, Number(valor))) };
          }
          return { ...t, [campo]: valor };
        }
        return t;
      })
    );
  };

  const travamentosX = travamentos.filter(t => t.direcao === 'x');
  const travamentosY = travamentos.filter(t => t.direcao === 'y');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Botões para adicionar */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => adicionarTravamento('x')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Travamento X
        </button>
        <button
          onClick={() => adicionarTravamento('y')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Travamento Y
        </button>
      </div>

      {/* Lista de travamentos */}
      {(travamentosX.length > 0 || travamentosY.length > 0) && (
        <div style={{ display: 'flex', gap: 40 }}>
          {/* Travamentos X */}
          {travamentosX.length > 0 && (
            <div>
              <h4 style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                margin: '0 0 8px', 
                color: '#2563eb' 
              }}>
                Direção X
              </h4>
              {travamentosX.map(travamento => (
                <div key={travamento.id} style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  alignItems: 'center',
                  gap: 8, 
                  marginBottom: 8,
                  padding: '8px',
                  background: '#1e293b',
                  borderRadius: 6,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 10, color: THEME.subtle }}>Coordenada (cm)</span>
                    <input
                      type="number"
                      value={travamento.coordenada}
                      onChange={(e) => atualizarTravamento(travamento.id, 'coordenada', Number(e.target.value))}
                      min={0}
                      max={alturaTotal}
                      step={1}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #475569',
                        borderRadius: 4,
                        background: '#0b1220',
                        color: THEME.pageText,
                        fontSize: 12,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 10, color: THEME.subtle }}>Compressão (kN)</span>
                    <input
                      type="number"
                      value={travamento.compressao}
                      onChange={(e) => atualizarTravamento(travamento.id, 'compressao', Number(e.target.value))}
                      step={0.1}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #475569',
                        borderRadius: 4,
                        background: '#0b1220',
                        color: THEME.pageText,
                        fontSize: 12,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 10, color: THEME.subtle }}>Momento (kN·m)</span>
                    <input
                      type="number"
                      value={travamento.momento}
                      onChange={(e) => atualizarTravamento(travamento.id, 'momento', Number(e.target.value))}
                      step={0.1}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #475569',
                        borderRadius: 4,
                        background: '#0b1220',
                        color: THEME.pageText,
                        fontSize: 12,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => removerTravamento(travamento.id)}
                    style={{
                      width: 24,
                      height: 24,
                      padding: 0,
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Travamentos Y */}
          {travamentosY.length > 0 && (
            <div>
              <h4 style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                margin: '0 0 8px', 
                color: '#dc2626' 
              }}>
                Direção Y
              </h4>
              {travamentosY.map(travamento => (
                <div key={travamento.id} style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  alignItems: 'center',
                  gap: 8, 
                  marginBottom: 8,
                  padding: '8px',
                  background: '#1e293b',
                  borderRadius: 6,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 10, color: THEME.subtle }}>Coordenada (cm)</span>
                    <input
                      type="number"
                      value={travamento.coordenada}
                      onChange={(e) => atualizarTravamento(travamento.id, 'coordenada', Number(e.target.value))}
                      min={0}
                      max={alturaTotal}
                      step={1}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #475569',
                        borderRadius: 4,
                        background: '#0b1220',
                        color: THEME.pageText,
                        fontSize: 12,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 10, color: THEME.subtle }}>Compressão (kN)</span>
                    <input
                      type="number"
                      value={travamento.compressao}
                      onChange={(e) => atualizarTravamento(travamento.id, 'compressao', Number(e.target.value))}
                      step={0.1}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #475569',
                        borderRadius: 4,
                        background: '#0b1220',
                        color: THEME.pageText,
                        fontSize: 12,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 10, color: THEME.subtle }}>Momento (kN·m)</span>
                    <input
                      type="number"
                      value={travamento.momento}
                      onChange={(e) => atualizarTravamento(travamento.id, 'momento', Number(e.target.value))}
                      step={0.1}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #475569',
                        borderRadius: 4,
                        background: '#0b1220',
                        color: THEME.pageText,
                        fontSize: 12,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => removerTravamento(travamento.id)}
                    style={{
                      width: 24,
                      height: 24,
                      padding: 0,
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Informação útil */}
      {travamentos.length === 0 && (
        <div style={{ 
          fontSize: 12, 
          color: THEME.subtle, 
          fontStyle: 'italic' 
        }}>
          Use os botões acima para adicionar travamentos nas direções X ou Y
        </div>
      )}

      {/* Visualização dos segmentos */}
      {travamentos.length > 0 && (
        <SegmentosPilarVisualizacao 
          alturaPilar={alturaTotal}
          travamentos={travamentos}
        />
      )}
    </div>
  );
}

/* ===================== VISUALIZAÇÃO DOS SEGMENTOS ===================== */
function SegmentosPilarVisualizacao({
  alturaPilar,
  travamentos,
}: {
  alturaPilar: number;
  travamentos: Travamento[];
}) {
  const segmentos = dividirPilarEmSegmentos(alturaPilar, travamentos);
  const comprimentoFlambagemX = calcularComprimentoFlambagem(alturaPilar, travamentos, 'x');
  const comprimentoFlambagemY = calcularComprimentoFlambagem(alturaPilar, travamentos, 'y');

  return (
    <div style={{ 
      marginTop: 16,
      padding: 12,
      background: '#0f172a',
      borderRadius: 8,
      border: `1px solid ${THEME.border}`
    }}>
      <h4 style={{ 
        fontSize: 14, 
        fontWeight: 600, 
        margin: '0 0 12px',
        color: THEME.pageText 
      }}>
        Análise de Segmentos
      </h4>

      {/* Informações de comprimento de flambagem */}
      <div style={{ 
        display: 'flex', 
        gap: 24, 
        marginBottom: 12,
        fontSize: 12 
      }}>
        <div>
          <span style={{ color: THEME.subtle }}>Comprimento de flambagem X: </span>
          <span style={{ color: '#2563eb', fontWeight: 600 }}>
            {comprimentoFlambagemX.toFixed(1)} cm
          </span>
        </div>
        <div>
          <span style={{ color: THEME.subtle }}>Comprimento de flambagem Y: </span>
          <span style={{ color: '#dc2626', fontWeight: 600 }}>
            {comprimentoFlambagemY.toFixed(1)} cm
          </span>
        </div>
      </div>

      {/* Lista de segmentos */}
      <div style={{ fontSize: 12 }}>
        <div style={{ 
          fontWeight: 600, 
          marginBottom: 6,
          color: THEME.pageText 
        }}>
          Segmentos do pilar:
        </div>
        {segmentos.map((segmento, index) => (
          <div key={index} style={{ 
            padding: '4px 8px',
            marginBottom: 2,
            background: '#1e293b',
            borderRadius: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              {segmento.inicio.toFixed(1)} → {segmento.fim.toFixed(1)} cm 
              ({segmento.comprimento.toFixed(1)} cm)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ 
                color: segmento.travamentosX ? '#2563eb' : THEME.subtle,
                fontSize: 11
              }}>
                X: {segmento.travamentosX ? '✓' : '✗'}
              </span>
              <span style={{ 
                color: segmento.travamentosY ? '#dc2626' : THEME.subtle,
                fontSize: 11
              }}>
                Y: {segmento.travamentosY ? '✓' : '✗'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== COMPONENTE PRINCIPAL ===================== */
export default function KappaCalc() {
  const [tab, setTab] = useState<TabKey>("resultados");
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);

  const outputs: Outputs = useMemo(() => compute(inputs), [inputs]);

  const resKappax = useMemo(
    () =>
      resolverKappaMsd_x(
        { lamda_x: outputs.lamda_x, fa: outputs.fa, alfa_bx: outputs.alfa_bx, MAx: outputs.MAx, b: inputs.b, Nsd: outputs.Nsd },
        { tol: 1e-6, maxIter: 300 }
      ),
    [outputs.lamda_x, outputs.fa, outputs.alfa_bx, outputs.MAx, inputs.b, outputs.Nsd]
  );

  const resKappay = useMemo(
    () =>
      resolverKappaMsd_y(
        { lamda_y: outputs.lamda_y, fa: outputs.fa, alfa_by: outputs.alfa_by, MAy: outputs.MAy, a: inputs.a, Nsd: outputs.Nsd },
        { tol: 1e-6, maxIter: 300 }
      ),
    [outputs.lamda_y, outputs.fa, outputs.alfa_by, outputs.MAy, inputs.a, outputs.Nsd]
  );

  const setField = (k: keyof Inputs, v: number) => setInputs((s) => ({ ...s, [k]: num(v) }));

  // Ajustar o container principal
  return (
    <div
      style={{
        padding: "0 24px 24px",
        paddingTop: HEADER_H + 5, // Este é o principal controle da posição vertical
        maxWidth: 1600,
        margin: "0 auto",
        fontFamily: "Inter, system-ui, Arial, sans-serif",
        color: THEME.pageText,
      }}
    >
      {/* Cabeçalho fixo full-width */}
      <FixedHeader tab={tab} setTab={setTab} />

      {tab === "entrada" && (
        <div style={{ 
          padding: "0",  // remover padding
          display: "flex",
          flexDirection: "column",
          gap: 8  // reduzir gap entre seções
        }}>
          <div>
            <SectionTitle>Geometria</SectionTitle>
            <Row>
              {groups.geometria.map((k) => {
                const f = fieldDefs.find((x) => x.key === k)!;
                return (
                  <LabeledNumber
                    key={String(k)}
                    label={f.label}
                    unit={f.unit}
                    value={inputs[k] as number}
                    onChange={(v) => setField(k, v)}
                    min={f.min}
                    step={f.step}
                  />
                );
              })}
            </Row>
          </div>

          {/* Aviso movido para cá */}
          {(outputs.lamda_x > 90 || outputs.lamda_y > 90) && (
            <div style={{
              background: "#991b1b",
              color: "#fecaca",
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" 
                      fill="currentColor"/>
              </svg>
              <span>
                Atenção: Este método não pode ser aplicado quando λx ou λy {'>'} 90. 
                {outputs.lamda_x > 90 && ` (λx = ${outputs.lamda_x.toFixed(2)})`}
                {outputs.lamda_y > 90 && ` (λy = ${outputs.lamda_y.toFixed(2)})`}
              </span>
            </div>
          )}

          <div>
            <SectionTitle>Coeficientes de segurança</SectionTitle>
            <Row>
              {groups.coef.map((k) => {
                const f = fieldDefs.find((x) => x.key === k)!;
                return (
                  <LabeledNumber
                    key={String(k)}
                    label={f.label}
                    unit={f.unit}
                    value={inputs[k] as number}
                    onChange={(v) => setField(k, v)}
                    min={f.min}
                    step={f.step}
                  />
                );
              })}
            </Row>
          </div>

          <div>
            <SectionTitle>Materiais</SectionTitle>
            <Row>
              {groups.materiais.map((k) => {
                const f = fieldDefs.find((x) => x.key === k)!;
                return (
                  <LabeledNumber
                    key={String(k)}
                    label={f.label}
                    unit={f.unit}
                    value={inputs[k] as number}
                    onChange={(v) => setField(k, v)}
                    min={f.min}
                    step={f.step}
                  />
                );
              })}
            </Row>
          </div>

          <div>
            <SectionTitle>Esforços</SectionTitle>
            <Row>
              {groups.esforcos.map((k) => {
                const f = fieldDefs.find((x) => x.key === k)!;
                return (
                  <LabeledNumber
                    key={String(k)}
                    label={f.label}
                    unit={f.unit}
                    value={inputs[k] as number}
                    onChange={(v) => setField(k, v)}
                    min={f.min}
                    step={f.step}
                  />
                );
              })}
            </Row>
          </div>
          <div>
            <SectionTitle>Travamentos</SectionTitle>
            <TravamentosManager
              travamentos={inputs.travamentos}
              onTravamentosChange={(travamentos: Travamento[]) => setInputs(s => ({ ...s, travamentos }))}
              alturaTotal={inputs.h}
            />
          </div>
        </div>
      )}

      {tab === "resultados" && (
        // Lado a lado fixo: 3 colunas; scroll horizontal se faltar espaço
        <div style={{ overflowX: "auto", border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 12 }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 420px)",
            gap: GRAPH_CONFIG.gap, // usar gap configurado
            minWidth: 1200 
          }}>
            <DiagramNsd nsd={outputs.Nsd} />
            <DiagramMomento
              title="Msd, x (kN·m)"
              top={outputs.Msd_tx}
              bottom={outputs.Msd_bx}
              m2d={Number.isFinite(resKappax?.Msdx_tot) ? resKappax.Msdx_tot : undefined}
              m2dPoints={outputs.segmentos_x?.filter(s => s.M2d !== null).map(s => ({ centroCm: s.centro, value: s.M2d as number }))}
            />
            <DiagramMomento
              title="Msd, y (kN·m)"
              top={outputs.Msd_ty}
              bottom={outputs.Msd_by}
              m2d={Number.isFinite(resKappay?.Msdy_tot) ? resKappay.Msdy_tot : undefined}
              m2dPoints={outputs.segmentos_y?.filter(s => s.M2d !== null).map(s => ({ centroCm: s.centro, value: s.M2d as number }))}
            />
          </div>
        </div>
      )}

      {tab === "brutos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {/* Tabelas principais lado a lado */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", // força duas colunas de mesmo tamanho
            gap: 150, // aumenta o espaço entre as tabelas
            maxWidth: 900, // limita a largura máxima do container
            marginTop: -135 // centraliza o container GAMBIARRA
          }}>
            <TableKV
              title="VALORES EM TORNO DE X"
              rows={[
                ["Msd,tx", outputs.Msd_tx, "kN·m"],
                ["Msd,bx", outputs.Msd_bx, "kN·m"],
                ["M1dminxx", outputs.M1dminxx, "kN·m"],
                ["λx", outputs.lamda_x, "-"],
                ["λ1x", outputs.lamda1_x, "-"],
                ["αb,x", outputs.alfa_bx, "-"],
                ["MAx", outputs.MAx, "kN·m"],
                ["MBx", outputs.MBx, "kN·m"],
                ["κx", Number.isFinite(resKappax.kappax) ? resKappax.kappax : Number.NaN, "-"],
                ["M2d,x", Number.isFinite(resKappax.Msdx_tot) ? resKappax.Msdx_tot : Number.NaN, "kN·m"],
              ]}
            />
            <TableKV
              title="VALORES EM TORNO DE Y"
              rows={[
                ["Msd,ty", outputs.Msd_ty, "kN·m"],
                ["Msd,by", outputs.Msd_by, "kN·m"],
                ["M1dminyy", outputs.M1dminyy, "kN·m"],
                ["λy", outputs.lamda_y, "-"],
                ["λ1y", outputs.lamda1_y, "-"],
                ["αb,y", outputs.alfa_by, "-"],
                ["MAy", outputs.MAy, "kN·m"],
                ["MBy", outputs.MBy, "kN·m"],
                ["κy", Number.isFinite(resKappay.kappay) ? resKappay.kappay : Number.NaN, "-"],
                ["M2d,y", Number.isFinite(resKappay.Msdy_tot) ? resKappay.Msdy_tot : Number.NaN, "kN·m"],
              ]}
            />
          </div>

          {/* Tabelas de segmentos */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: 40,
            maxWidth: 1200,
            margin: "0 auto"
          }}>
            {/* Segmentos X */}
            <div>
              <div style={{ 
                fontWeight: 700, 
                marginBottom: 12, 
                fontSize: 16,
                color: THEME.pageText 
              }}>
                SEGMENTOS DIREÇÃO X
              </div>
              {outputs.segmentos_x?.length > 0 ? (
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'separate',
                  borderSpacing: '0 2px'
                }}>
                  <thead>
                    <tr style={{ background: THEME.border }}>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'left', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Trecho (cm)
                      </th>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Nk_sup (kN)
                      </th>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Mbase (kN·m)
                      </th>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Mtop (kN·m)
                      </th>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        M2d (kN·m)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outputs.segmentos_x.map((seg, i) => (
                      <tr key={i} style={{ 
                        background: i % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'transparent'
                      }}>
                        <td style={{ 
                          padding: '8px 12px', 
                          color: THEME.pageText,
                          fontSize: 12
                        }}>
                          {seg.inicio.toFixed(1)} → {seg.fim.toFixed(1)}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'right',
                          color: THEME.pageText,
                          fontSize: 12
                        }}>
                          {Number.isFinite(seg.Nk_superior) ? seg.Nk_superior.toFixed(2) : '—'}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'right',
                          color: THEME.pageText,
                          fontSize: 12
                        }}>
                          {Number.isFinite(seg.Mbase) ? seg.Mbase.toFixed(2) : '—'}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'right',
                          color: THEME.pageText,
                          fontSize: 12
                        }}>
                          {Number.isFinite(seg.Mtop) ? seg.Mtop.toFixed(2) : '—'}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'right',
                          color: THEME.pageText,
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {seg.M2d === null ? 'Não convergiu!' : Number.isFinite(seg.M2d) ? seg.M2d.toFixed(2) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  color: THEME.subtle, 
                  fontSize: 12, 
                  fontStyle: 'italic',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  Nenhum segmento calculado
                </div>
              )}
            </div>

            {/* Segmentos Y */}
            <div>
              <div style={{ 
                fontWeight: 700, 
                marginBottom: 12, 
                fontSize: 16,
                color: THEME.pageText 
              }}>
                SEGMENTOS DIREÇÃO Y
              </div>
              {outputs.segmentos_y?.length > 0 ? (
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'separate',
                  borderSpacing: '0 2px'
                }}>
                  <thead>
                    <tr style={{ background: THEME.border }}>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'left', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Trecho (cm)
                      </th>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Nk_sup (kN)
                      </th>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Mbase (kN·m)
                      </th>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        Mtop (kN·m)
                      </th>
                      <th style={{ 
                        padding: '8px 12px', 
                        textAlign: 'right', 
                        color: THEME.pageText,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        M2d (kN·m)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {outputs.segmentos_y.map((seg, i) => (
                      <tr key={i} style={{ 
                        background: i % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'transparent'
                      }}>
                        <td style={{ 
                          padding: '8px 12px', 
                          color: THEME.pageText,
                          fontSize: 12
                        }}>
                          {seg.inicio.toFixed(1)} → {seg.fim.toFixed(1)}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'right',
                          color: THEME.pageText,
                          fontSize: 12
                        }}>
                          {Number.isFinite(seg.Nk_superior) ? seg.Nk_superior.toFixed(2) : '—'}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'right',
                          color: THEME.pageText,
                          fontSize: 12
                        }}>
                          {Number.isFinite(seg.Mbase) ? seg.Mbase.toFixed(2) : '—'}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'right',
                          color: THEME.pageText,
                          fontSize: 12
                        }}>
                          {Number.isFinite(seg.Mtop) ? seg.Mtop.toFixed(2) : '—'}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          textAlign: 'right',
                          color: THEME.pageText,
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {seg.M2d === null ? 'Não convergiu!' : Number.isFinite(seg.M2d) ? seg.M2d.toFixed(2) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  color: THEME.subtle, 
                  fontSize: 12, 
                  fontStyle: 'italic',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  Nenhum segmento calculado
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "diagrama" && (
        <div style={{ 
          background: THEME.canvasBg,
          borderRadius: 10,
          padding: 24,
          minHeight: 400 // para dar uma altura mínima ao container vazio
        }}>
          {/* Conteúdo futuro virá aqui */}
        </div>
      )}
    </div>
  );
}

/* ===================== TABELA KEY/VALUE (SEM LINHAS) ===================== */
function TableKV({ title, rows }: { title: string; rows: Array<[string, number, string]> }) {
  return (
    <div>
      <div style={{ 
        fontWeight: 700, 
        marginBottom: 8,
        fontSize: 16 // adicione esta linha para aumentar o tamanho do texto
      }}>
        {title}
      </div>
      <table style={{ width: "100%", borderCollapse: "separate" }}>
        <tbody>
          {rows.map(([k, v, u]) => (
            <tr key={k}>
              <td style={{ padding: "6px 8px 6px 0", color: THEME.subtle, whiteSpace: "nowrap" }}>{k}</td>
              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 400 }}>
                {Number.isFinite(v) ? v.toFixed(2) : "—"}
              </td>
              <td style={{ padding: "6px 0 6px 8px", color: THEME.subtle }}>{u}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
