// KappaCalc.tsx — Header fixo full-width (título+abas), tema escuro,
// gráficos lado a lado, rótulos próximos e "Memória de cálculo" em duas tabelas.

import { useEffect, useState } from "react";
import {
  compute,
  defaultInputs,
  type Inputs,
  type Travamento,
  type Outputs,
} from "../compute";
import FixedHeader, { HEADER_H, type TabKey } from "../components/FixedHeader";
import { THEME } from "../config/theme";
import SectionTitle from "../components/SectionTitle";
import LabeledNumber from "../components/LabeledNumber";
import Row from "../components/Row";
import TravamentosManager from "../components/TravamentoManager";
import DiagramNsd, { GRAPH_CONFIG } from "../components/DiagramNsd";
import DiagramMomento from "../components/DiagramMomento";


const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};


/* ===================== CAMPOS / GRUPOS ===================== */
const fieldDefs: Array<{ key: keyof Inputs; label: string; unit?: string; min?: number; step?: number }> = [
  { key: "a", label: "a", unit: "cm", min: 1, step: 1 },
  { key: "b", label: "b", unit: "cm", min: 1, step: 1 },
  { key: "h", label: "h", unit: "cm", min: 1, step: 1 },
  { key: "gama_c", label: "gama-c", min: 1, step: 0.1 },
  { key: "gama_s", label: "gama-s", min: 1, step: 0.1 },
  { key: "gama_f", label: "gama-f", min: 1, step: 0.1 },
  { key: "fck", label: "fck", unit: "MPa", min: 1 },
  { key: "fyk", label: "fyk", unit: "MPa", min: 1 },
  { key: "Nsk", label: "Nsk", unit: "kN", min: 0 },
  { key: "Msk_tx", label: "Msk,x (topo)", unit: "kN·m", step: 1 },
  { key: "Msk_bx", label: "Msk,x (base)", unit: "kN·m", step: 1 },
  { key: "Msk_ty", label: "Msk,y (topo)", unit: "kN·m", step: 1 },
  { key: "Msk_by", label: "Msk,y (base)", unit: "kN·m", step: 1 },
];

const groups: Record<"geometria" | "coef" | "materiais" | "esforcos", Array<keyof Inputs>> = {
  geometria: ["a", "b", "h"],
  coef: ["gama_c", "gama_s", "gama_f"],
  materiais: ["fck", "fyk"],
  esforcos: ["Nsk", "Msk_tx", "Msk_bx", "Msk_ty", "Msk_by"],
};

export default function KappaCalc() {
  const [tab, setTab] = useState<TabKey>("resultados");
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [solve, setSolve] = useState<Outputs>();

  useEffect(() => {

    setSolve(compute(inputs));

  }, [inputs]);

  // const computedData = useMemo(() => {
  //   return compute(inputs);
  // }, [inputs]);
  // const { outputs, resKappax, resKappay } = {
  //   outputs: computedData,
  //   resKappax: computedData.resKappax,
  //   resKappay: computedData.resKappay
  // };

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
      {
        solve &&
        <>
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
                  a={inputs.a}
                  b={inputs.b}
                />
              </div>
            </div>
          )}

          {tab === "resultados" && (
            // Lado a lado fixo: 3 colunas; scroll horizontal se faltar espaço
            <div style={{ overflowX: "auto", border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 12 }}>
              {(() => {
                // Calcular escala global para manter consistência entre diagramas X e Y
                const todosValores = [
                  Math.abs(solve.Msd_tx), Math.abs(solve.Msd_bx),
                  Math.abs(solve.Msd_ty), Math.abs(solve.Msd_by)
                ];
                
                // Incluir M2d global se existir
                if (Number.isFinite(solve.resKappax?.Msdx_tot)) {
                  todosValores.push(Math.abs(solve.resKappax.Msdx_tot));
                }
                if (Number.isFinite(solve.resKappay?.Msdy_tot)) {
                  todosValores.push(Math.abs(solve.resKappay.Msdy_tot));
                }
                
                // Incluir valores M2d por segmento
                solve.segmentos_x?.forEach(s => {
                  if (s.M2d !== null) todosValores.push(Math.abs(s.M2d));
                });
                solve.segmentos_y?.forEach(s => {
                  if (s.M2d !== null) todosValores.push(Math.abs(s.M2d));
                });
                
                const escalaGlobal = Math.max(1, ...todosValores);
                
                return (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 420px)",
                    gap: GRAPH_CONFIG.gap, // usar gap configurado
                    minWidth: 1200
                  }}>
                    <DiagramNsd 
                      nsd={solve.Nsd} 
                      travamentos={inputs.travamentos}
                      alturaPilar={inputs.h}
                    />
                    <DiagramMomento
                      title="Msd, x (kN·m)"
                      top={solve.Msd_tx}
                      bottom={solve.Msd_bx}
                      m2d={Number.isFinite(solve.resKappax?.Msdx_tot) ? solve.resKappax.Msdx_tot : undefined}
                      m2dPoints={solve.segmentos_x?.filter(s => s.M2d !== null).map(s => ({ centroCm: s.centro, value: s.M2d as number, Mbase: s.Mbase, Mtop: s.Mtop }))}
                      travamentos={inputs.travamentos}
                      alturaPilar={inputs.h}
                      direcao="x"
                      escalaGlobal={escalaGlobal}
                    />
                    <DiagramMomento
                      title="Msd, y (kN·m)"
                      top={solve.Msd_ty}
                      bottom={solve.Msd_by}
                      m2d={Number.isFinite(solve.resKappay?.Msdy_tot) ? solve.resKappay.Msdy_tot : undefined}
                      m2dPoints={solve.segmentos_y?.filter(s => s.M2d !== null).map(s => ({ centroCm: s.centro, value: s.M2d as number, Mbase: s.Mbase, Mtop: s.Mtop }))}
                      travamentos={inputs.travamentos}
                      alturaPilar={inputs.h}
                      direcao="y"
                      escalaGlobal={escalaGlobal}
                    />
                  </div>
                );
              })()}
            </div>
          )}

          {tab === "memoria" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 40, marginTop: -260 }}>
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
                    MOMENTOS EM TORNO DE X
                  </div>
                  {solve.segmentos_x?.length > 0 ? (
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
                        {solve.segmentos_x.map((seg, i) => (
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
                    MOMENTOS EM TORNO DE Y
                  </div>
                  {solve.segmentos_y?.length > 0 ? (
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
                        {solve.segmentos_y.map((seg, i) => (
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
              minHeight: 400
            }}>
              {/* Layout lado a lado: Gráfico à esquerda, Tabela à direita */}
              <div style={{
                display: 'flex',
                gap: 40,
                alignItems: 'flex-start'
              }}>
                {/* Gráfico Cartesiano à esquerda */}
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{
                    fontWeight: 700,
                    marginBottom: 20,
                    fontSize: 16,
                    color: THEME.pageText,
                    textAlign: 'center'
                  }}>
                    DIAGRAMA DE INTERAÇÃO Msd,x × Msd,y
                  </div>
                  
                  {(() => {
                    // Coletar pontos para o gráfico (reutilizar lógica da tabela)
                    const pontosCriticos: Array<{coord: number, tipo: 'extremidade' | 'travamento_sup' | 'travamento_inf' | 'm2d', label?: string}> = [];
                    
                    // Adicionar extremidades
                    pontosCriticos.push({coord: 0, tipo: 'extremidade', label: 'Base'});
                    pontosCriticos.push({coord: num(inputs.h), tipo: 'extremidade', label: 'Topo'});
                    
                    // Adicionar travamentos (superior e inferior)
                    const coordenadasTravamentos = [...new Set(inputs.travamentos.map((t: any) => t.coordenada))];
                    coordenadasTravamentos.forEach(coord => {
                      pontosCriticos.push({coord, tipo: 'travamento_sup', label: `Trav.Sup`});
                      pontosCriticos.push({coord, tipo: 'travamento_inf', label: `Trav.Inf`});
                    });
                    
                    // Adicionar pontos M2d dos segmentos
                    if (solve.segmentos_x) {
                      solve.segmentos_x.forEach(seg => {
                        const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                        pontosCriticos.push({coord: coordM2d, tipo: 'm2d', label: `M2d,x`});
                      });
                    }
                    if (solve.segmentos_y) {
                      solve.segmentos_y.forEach(seg => {
                        const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                        const jaExiste = pontosCriticos.some(p => p.tipo === 'm2d' && Math.abs(p.coord - coordM2d) < 0.1);
                        if (!jaExiste) {
                          pontosCriticos.push({coord: coordM2d, tipo: 'm2d', label: `M2d,y`});
                        }
                      });
                    }
                    
                    // Função de interpolação considerando M2d e travamentos
                    const interpolarMomento = (coord: number, segmentos: any[], direcao: 'x' | 'y') => {
                      const segmento = segmentos.find(seg => coord >= seg.inicio && coord <= seg.fim);
                      if (!segmento) return 0;
                      
                      // Coletar todos os pontos relevantes no segmento (ordenados por coordenada)
                      const pontosSegmento = [];
                      
                      // Adicionar extremidades do segmento
                      pontosSegmento.push({ coord: segmento.inicio, momento: segmento.Mbase });
                      pontosSegmento.push({ coord: segmento.fim, momento: segmento.Mtop });
                      
                      // Adicionar M2d se existir - usando a mesma lógica de ajuste de sinal dos diagramas
                      const coordM2d = segmento.inicio + (segmento.fim - segmento.inicio) / 2;
                      const M2d = Number.isFinite(segmento.M2d) && segmento.M2d !== null ? segmento.M2d : null;
                      if (M2d !== null) {
                        // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                        const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                          return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                        };
                        const maiorMomentoSegmento = getMaiorMomento(segmento.Mtop, segmento.Mbase);
                        const m2dAjustado = Math.abs(M2d) * Math.sign(maiorMomentoSegmento);
                        pontosSegmento.push({ coord: coordM2d, momento: m2dAjustado });
                      }
                      
                      // Adicionar travamentos dentro do segmento
                      const travamentosSegmento = inputs.travamentos.filter(t => 
                        t.direcao === direcao && 
                        t.coordenada > segmento.inicio && 
                        t.coordenada < segmento.fim
                      );
                      
                      travamentosSegmento.forEach(trav => {
                        // Determinar qual momento do travamento usar baseado na posição relativa ao M2d
                        let momentoTrav;
                        if (M2d !== null) {
                          // Se há M2d, usar momento superior se estiver abaixo do M2d, inferior se estiver acima
                          if (trav.coordenada <= coordM2d) {
                            momentoTrav = trav.momentoSuperior;
                          } else {
                            momentoTrav = trav.momentoInferior;
                          }
                        } else {
                          // Se não há M2d, interpolar entre os momentos do travamento baseado na posição no segmento
                          const fatorSegmento = (trav.coordenada - segmento.inicio) / (segmento.fim - segmento.inicio);
                          momentoTrav = trav.momentoInferior + fatorSegmento * (trav.momentoSuperior - trav.momentoInferior);
                        }
                        pontosSegmento.push({ coord: trav.coordenada, momento: momentoTrav });
                      });
                      
                      // Ordenar pontos por coordenada
                      pontosSegmento.sort((a, b) => a.coord - b.coord);
                      
                      // Encontrar os dois pontos adjacentes para interpolação
                      let pontoAnterior = pontosSegmento[0];
                      let pontoProximo = pontosSegmento[pontosSegmento.length - 1];
                      
                      for (let i = 0; i < pontosSegmento.length - 1; i++) {
                        if (coord >= pontosSegmento[i].coord && coord <= pontosSegmento[i + 1].coord) {
                          pontoAnterior = pontosSegmento[i];
                          pontoProximo = pontosSegmento[i + 1];
                          break;
                        }
                      }
                      
                      // Interpolação linear entre os dois pontos
                      if (pontoAnterior.coord === pontoProximo.coord) {
                        return pontoAnterior.momento;
                      }
                      
                      const fator = (coord - pontoAnterior.coord) / (pontoProximo.coord - pontoAnterior.coord);
                      return pontoAnterior.momento + fator * (pontoProximo.momento - pontoAnterior.momento);
                    };
                    
                    // Calcular pontos do gráfico
                    const pontosGrafico = pontosCriticos.map(ponto => {
                      let MsdX = 0;
                      let MsdY = 0;
                      const coord = ponto.coord;
                      
                      if (ponto.tipo === 'extremidade' && coord === 0) {
                        MsdX = solve.Msd_bx || 0;
                        MsdY = solve.Msd_by || 0;
                      } else if (ponto.tipo === 'extremidade' && coord === num(inputs.h)) {
                        MsdX = solve.Msd_tx || 0;
                        MsdY = solve.Msd_ty || 0;
                      } else if (ponto.tipo === 'travamento_sup' || ponto.tipo === 'travamento_inf') {
                        const travamentoX = inputs.travamentos.find((t: any) => t.coordenada === coord && t.direcao === 'x');
                        const travamentoY = inputs.travamentos.find((t: any) => t.coordenada === coord && t.direcao === 'y');
                        
                        let M2dCoincidenteX = null;
                        let M2dCoincidenteY = null;
                        
                        if (solve.segmentos_x) {
                          const segX = solve.segmentos_x.find(seg => {
                            const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                            return Math.abs(coordM2d - coord) < 0.1;
                          });
                          if (segX && Number.isFinite(segX.M2d) && segX.M2d !== null) {
                            // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                            const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                              return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                            };
                            const maiorMomentoSegmento = getMaiorMomento(segX.Mtop, segX.Mbase);
                            M2dCoincidenteX = Math.abs(segX.M2d) * Math.sign(maiorMomentoSegmento);
                          }
                        }
                        
                        if (solve.segmentos_y) {
                          const segY = solve.segmentos_y.find(seg => {
                            const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                            return Math.abs(coordM2d - coord) < 0.1;
                          });
                          if (segY && Number.isFinite(segY.M2d) && segY.M2d !== null) {
                            // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                            const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                              return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                            };
                            const maiorMomentoSegmento = getMaiorMomento(segY.Mtop, segY.Mbase);
                            M2dCoincidenteY = Math.abs(segY.M2d) * Math.sign(maiorMomentoSegmento);
                          }
                        }
                        
                        if (ponto.tipo === 'travamento_sup') {
                          MsdX = travamentoX ? travamentoX.momentoSuperior : (M2dCoincidenteX !== null ? M2dCoincidenteX : 0);
                          MsdY = travamentoY ? travamentoY.momentoSuperior : (M2dCoincidenteY !== null ? M2dCoincidenteY : 0);
                        } else {
                          MsdX = travamentoX ? travamentoX.momentoInferior : (M2dCoincidenteX !== null ? M2dCoincidenteX : 0);
                          MsdY = travamentoY ? travamentoY.momentoInferior : (M2dCoincidenteY !== null ? M2dCoincidenteY : 0);
                        }

                        // Se não há travamento em alguma direção e também não há M2d coincidente, interpolar
                        if (!travamentoX && M2dCoincidenteX === null && solve.segmentos_x) {
                          MsdX = interpolarMomento(coord, solve.segmentos_x, 'x');
                        }
                        if (!travamentoY && M2dCoincidenteY === null && solve.segmentos_y) {
                          MsdY = interpolarMomento(coord, solve.segmentos_y, 'y');
                        }
                      } else if (ponto.tipo === 'm2d') {
                        let isM2dX = false;
                        let isM2dY = false;
                        
                        if (solve.segmentos_x) {
                          const segX = solve.segmentos_x.find(seg => {
                            const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                            return Math.abs(coordM2d - coord) < 0.1;
                          });
                          if (segX && Number.isFinite(segX.M2d) && segX.M2d !== null) {
                            // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                            const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                              return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                            };
                            const maiorMomentoSegmento = getMaiorMomento(segX.Mtop, segX.Mbase);
                            MsdX = Math.abs(segX.M2d) * Math.sign(maiorMomentoSegmento);
                            isM2dX = true;
                          }
                        }
                        
                        if (solve.segmentos_y) {
                          const segY = solve.segmentos_y.find(seg => {
                            const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                            return Math.abs(coordM2d - coord) < 0.1;
                          });
                          if (segY && Number.isFinite(segY.M2d) && segY.M2d !== null) {
                            // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                            const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                              return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                            };
                            const maiorMomentoSegmento = getMaiorMomento(segY.Mtop, segY.Mbase);
                            MsdY = Math.abs(segY.M2d) * Math.sign(maiorMomentoSegmento);
                            isM2dY = true;
                          }
                        }
                        
                        if (isM2dX && !isM2dY && solve.segmentos_y) {
                          MsdY = interpolarMomento(coord, solve.segmentos_y, 'y');
                        }
                        if (isM2dY && !isM2dX && solve.segmentos_x) {
                          MsdX = interpolarMomento(coord, solve.segmentos_x, 'x');
                        }
                        
                        if (!isM2dX && !isM2dY) {
                          if (solve.segmentos_x) MsdX = interpolarMomento(coord, solve.segmentos_x, 'x');
                          if (solve.segmentos_y) MsdY = interpolarMomento(coord, solve.segmentos_y, 'y');
                        }
                      }
                      
                      return {
                        x: MsdY,  // Msd,y vai para eixo horizontal (flexão em X)
                        y: MsdX,  // Msd,x vai para eixo vertical (flexão em Y)
                        label: ponto.label,
                        tipo: ponto.tipo,
                        coord: coord  // Adicionar coordenada (altura)
                      };
                    }).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
                    
                    // Configurações do gráfico
                    const width = 600;
                    const height = 500;
                    const margin = 60;
                    const plotWidth = width - 2 * margin;
                    const plotHeight = height - 2 * margin;
                    
                    // Calcular escalas
                    const allX = pontosGrafico.map(p => p.x);
                    const allY = pontosGrafico.map(p => p.y);
                    const minX = Math.min(...allX, 0);
                    const maxX = Math.max(...allX, 0);
                    const minY = Math.min(...allY, 0);
                    const maxY = Math.max(...allY, 0);
                    
                    const rangeX = Math.max(Math.abs(minX), Math.abs(maxX));
                    const rangeY = Math.max(Math.abs(minY), Math.abs(maxY));
                    const scale = Math.max(rangeX, rangeY) * 1.1; // 10% de margem
                    
                    const scaleX = (x: number) => margin + (x + scale) * plotWidth / (2 * scale);
                    const scaleY = (y: number) => height - margin - (y + scale) * plotHeight / (2 * scale);
                    
                    return (
                      <svg width={width} height={height} style={{ border: '1px solid ' + THEME.border, borderRadius: 8 }}>
                        {/* Fundo */}
                        <rect width={width} height={height} fill={THEME.canvasBg} />
                        
                        {/* Grid pontilhado */}
                        {(() => {
                          // Gerar grid de 10 em 10 (excluindo o zero que são os eixos principais)
                          const maxScale = Math.ceil(scale / 10) * 10;
                          const gridValues = [];
                          for (let val = -maxScale; val <= maxScale; val += 10) {
                            if (val !== 0) { // Excluir 0 porque são os eixos principais
                              gridValues.push(val);
                            }
                          }
                          return gridValues.map(val => (
                            <g key={`grid-${val}`}>
                              {/* Linhas verticais do grid - estendidas até as últimas marcações */}
                              <line x1={scaleX(val)} y1={scaleY(maxScale)} x2={scaleX(val)} y2={scaleY(-maxScale)} 
                                    stroke={THEME.subtle} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5} />
                              {/* Linhas horizontais do grid - estendidas até as últimas marcações */}
                              <line x1={scaleX(-maxScale)} y1={scaleY(val)} x2={scaleX(maxScale)} y2={scaleY(val)} 
                                    stroke={THEME.subtle} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5} />
                            </g>
                          ));
                        })()}
                        
                        {/* Eixos principais (0,0) - estendidos até as últimas marcações */}
                        {(() => {
                          const maxScale = Math.ceil(scale / 10) * 10;
                          return (
                            <>
                              {/* Eixo vertical (Y) estendido */}
                              <line x1={scaleX(0)} y1={scaleY(maxScale)} x2={scaleX(0)} y2={scaleY(-maxScale)} 
                                    stroke={THEME.pageText} strokeWidth={1.5} />
                              {/* Eixo horizontal (X) estendido */}
                              <line x1={scaleX(-maxScale)} y1={scaleY(0)} x2={scaleX(maxScale)} y2={scaleY(0)} 
                                    stroke={THEME.pageText} strokeWidth={1.5} />
                            </>
                          );
                        })()}
                        
                        {/* Labels dos eixos */}
                        <text x={width / 2} y={height - 10} textAnchor="middle" fill={THEME.pageText} fontSize={14} fontWeight="600">
                          Msd,y (kN·m)
                        </text>
                        <text x={15} y={height / 2} textAnchor="middle" fill={THEME.pageText} fontSize={14} fontWeight="600"
                              transform={`rotate(-90, 15, ${height / 2})`}>
                          Msd,x (kN·m)
                        </text>
                        
                        {/* Escalas X */}
                        {(() => {
                          // Gerar escalas de 10 em 10
                          const maxScale = Math.ceil(scale / 10) * 10; // Arredondar para múltiplo de 10
                          const scaleValues = [];
                          for (let val = -maxScale; val <= maxScale; val += 10) {
                            scaleValues.push(val);
                          }
                          return scaleValues.map(val => (
                            <g key={`scale-x-${val}`}>
                              <line x1={scaleX(val)} y1={scaleY(0) - 5} x2={scaleX(val)} y2={scaleY(0) + 5} 
                                    stroke={THEME.pageText} strokeWidth={1} />
                              <text x={scaleX(val)} y={scaleY(0) + 18} textAnchor="middle" fill={THEME.pageText} fontSize={10}>
                                {val}
                              </text>
                            </g>
                          ));
                        })()}
                        
                        {/* Escalas Y */}
                        {(() => {
                          // Gerar escalas de 10 em 10
                          const maxScale = Math.ceil(scale / 10) * 10; // Arredondar para múltiplo de 10
                          const scaleValues = [];
                          for (let val = -maxScale; val <= maxScale; val += 10) {
                            scaleValues.push(val);
                          }
                          return scaleValues.map(val => (
                            <g key={`scale-y-${val}`}>
                              <line x1={scaleX(0) - 5} y1={scaleY(val)} x2={scaleX(0) + 5} y2={scaleY(val)} 
                                    stroke={THEME.pageText} strokeWidth={1} />
                              <text x={scaleX(0) - 10} y={scaleY(val) + 4} textAnchor="end" fill={THEME.pageText} fontSize={10}>
                                {val}
                              </text>
                            </g>
                          ));
                        })()}
                        
                        {/* Pontos */}
                        {pontosGrafico.map((ponto, index) => (
                          <g key={index}>
                            <circle 
                              cx={scaleX(ponto.x)} 
                              cy={scaleY(ponto.y)} 
                              r={4} 
                              fill="#3b82f6"
                              stroke="white"
                              strokeWidth={2}
                              style={{ cursor: 'pointer' }}
                            />
                            <title>
                              {`Altura: ${ponto.coord.toFixed(1)} cm\nMsd,y: ${ponto.x.toFixed(2)} kN·m\nMsd,x: ${ponto.y.toFixed(2)} kN·m`}
                            </title>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
                
                {/* Tabela à direita */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    marginBottom: 20,
                    fontSize: 16,
                    color: THEME.pageText
                  }}>
                    PARES DE MOMENTOS PARA DIAGRAMA DE INTERAÇÃO
                  </div>
              
              {(() => {
                // Função para interpolar momentos considerando M2d e travamentos
                const interpolarMomento = (coord: number, segmentos: any[], direcao: 'x' | 'y') => {
                  const segmento = segmentos.find(seg => coord >= seg.inicio && coord <= seg.fim);
                  if (!segmento) return 0;
                  
                  // Coletar todos os pontos relevantes no segmento (ordenados por coordenada)
                  const pontosSegmento = [];
                  
                  // Adicionar extremidades do segmento
                  pontosSegmento.push({ coord: segmento.inicio, momento: segmento.Mbase });
                  pontosSegmento.push({ coord: segmento.fim, momento: segmento.Mtop });
                  
                  // Adicionar M2d se existir - usando a mesma lógica de ajuste de sinal dos diagramas
                  const coordM2d = segmento.inicio + (segmento.fim - segmento.inicio) / 2;
                  const M2d = Number.isFinite(segmento.M2d) && segmento.M2d !== null ? segmento.M2d : null;
                  if (M2d !== null) {
                    // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                    const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                      return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                    };
                    const maiorMomentoSegmento = getMaiorMomento(segmento.Mtop, segmento.Mbase);
                    const m2dAjustado = Math.abs(M2d) * Math.sign(maiorMomentoSegmento);
                    pontosSegmento.push({ coord: coordM2d, momento: m2dAjustado });
                  }
                  
                  // Adicionar travamentos dentro do segmento
                  const travamentosSegmento = inputs.travamentos.filter(t => 
                    t.direcao === direcao && 
                    t.coordenada > segmento.inicio && 
                    t.coordenada < segmento.fim
                  );
                  
                  travamentosSegmento.forEach(trav => {
                    // Determinar qual momento do travamento usar baseado na posição relativa ao M2d
                    let momentoTrav;
                    if (M2d !== null) {
                      // Se há M2d, usar momento superior se estiver abaixo do M2d, inferior se estiver acima
                      if (trav.coordenada <= coordM2d) {
                        momentoTrav = trav.momentoSuperior;
                      } else {
                        momentoTrav = trav.momentoInferior;
                      }
                    } else {
                      // Se não há M2d, interpolar entre os momentos do travamento baseado na posição no segmento
                      const fatorSegmento = (trav.coordenada - segmento.inicio) / (segmento.fim - segmento.inicio);
                      momentoTrav = trav.momentoInferior + fatorSegmento * (trav.momentoSuperior - trav.momentoInferior);
                    }
                    pontosSegmento.push({ coord: trav.coordenada, momento: momentoTrav });
                  });
                  
                  // Ordenar pontos por coordenada
                  pontosSegmento.sort((a, b) => a.coord - b.coord);
                  
                  // Encontrar os dois pontos adjacentes para interpolação
                  let pontoAnterior = pontosSegmento[0];
                  let pontoProximo = pontosSegmento[pontosSegmento.length - 1];
                  
                  for (let i = 0; i < pontosSegmento.length - 1; i++) {
                    if (coord >= pontosSegmento[i].coord && coord <= pontosSegmento[i + 1].coord) {
                      pontoAnterior = pontosSegmento[i];
                      pontoProximo = pontosSegmento[i + 1];
                      break;
                    }
                  }
                  
                  // Interpolação linear entre os dois pontos
                  if (pontoAnterior.coord === pontoProximo.coord) {
                    return pontoAnterior.momento;
                  }
                  
                  const fator = (coord - pontoAnterior.coord) / (pontoProximo.coord - pontoAnterior.coord);
                  return pontoAnterior.momento + fator * (pontoProximo.momento - pontoAnterior.momento);
                };

                // Coletar pontos críticos
                const pontosCriticos: Array<{coord: number, tipo: 'extremidade' | 'travamento_sup' | 'travamento_inf' | 'm2d', label?: string}> = [];
                
                // Adicionar extremidades
                pontosCriticos.push({coord: 0, tipo: 'extremidade', label: 'Base'});
                pontosCriticos.push({coord: num(inputs.h), tipo: 'extremidade', label: 'Topo'});
                
                // Adicionar travamentos (superior e inferior)
                const coordenadasTravamentos = [...new Set(inputs.travamentos.map((t: any) => t.coordenada))];
                coordenadasTravamentos.forEach(coord => {
                  pontosCriticos.push({coord, tipo: 'travamento_sup', label: `Trav.Sup (${coord}cm)`});
                  pontosCriticos.push({coord, tipo: 'travamento_inf', label: `Trav.Inf (${coord}cm)`});
                });
                
                // Adicionar pontos M2d dos segmentos
                if (solve.segmentos_x) {
                  solve.segmentos_x.forEach(seg => {
                    const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2; // meio do segmento para M2d
                    pontosCriticos.push({coord: coordM2d, tipo: 'm2d', label: `M2d,x (${coordM2d.toFixed(1)}cm)`});
                  });
                }
                if (solve.segmentos_y) {
                  solve.segmentos_y.forEach(seg => {
                    const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2; // meio do segmento para M2d
                    // Evitar duplicar se já existe M2d,x na mesma coordenada
                    const jaExiste = pontosCriticos.some(p => p.tipo === 'm2d' && Math.abs(p.coord - coordM2d) < 0.1);
                    if (!jaExiste) {
                      pontosCriticos.push({coord: coordM2d, tipo: 'm2d', label: `M2d,y (${coordM2d.toFixed(1)}cm)`});
                    }
                  });
                }
                
                // Ordenar pontos críticos por coordenada (do topo para base)
                pontosCriticos.sort((a, b) => b.coord - a.coord);
                
                // Calcular pares de momentos
                const paresMomentos = pontosCriticos.map(ponto => {
                  let MsdX = 0;
                  let MsdY = 0;
                  const coord = ponto.coord;
                  
                  // Verificar se é extremidade
                  if (ponto.tipo === 'extremidade' && coord === 0) {
                    MsdX = solve.Msd_bx || 0;
                    MsdY = solve.Msd_by || 0;
                  } else if (ponto.tipo === 'extremidade' && coord === num(inputs.h)) {
                    MsdX = solve.Msd_tx || 0;
                    MsdY = solve.Msd_ty || 0;
                  } else if (ponto.tipo === 'travamento_sup' || ponto.tipo === 'travamento_inf') {
                    // Verificar se há travamentos nesta coordenada
                    const travamentoX = inputs.travamentos.find((t: any) => t.coordenada === coord && t.direcao === 'x');
                    const travamentoY = inputs.travamentos.find((t: any) => t.coordenada === coord && t.direcao === 'y');
                    
                    // Verificar se a coordenada do travamento coincide com M2d na outra direção
                    let M2dCoincidenteX = null;
                    let M2dCoincidenteY = null;
                    
                    if (solve.segmentos_x) {
                      const segX = solve.segmentos_x.find(seg => {
                        const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                        return Math.abs(coordM2d - coord) < 0.1; // tolerância
                      });
                      if (segX && Number.isFinite(segX.M2d) && segX.M2d !== null) {
                        // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                        const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                          return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                        };
                        const maiorMomentoSegmento = getMaiorMomento(segX.Mtop, segX.Mbase);
                        M2dCoincidenteX = Math.abs(segX.M2d) * Math.sign(maiorMomentoSegmento);
                      }
                    }
                    
                    if (solve.segmentos_y) {
                      const segY = solve.segmentos_y.find(seg => {
                        const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                        return Math.abs(coordM2d - coord) < 0.1; // tolerância
                      });
                      if (segY && Number.isFinite(segY.M2d) && segY.M2d !== null) {
                        // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                        const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                          return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                        };
                        const maiorMomentoSegmento = getMaiorMomento(segY.Mtop, segY.Mbase);
                        M2dCoincidenteY = Math.abs(segY.M2d) * Math.sign(maiorMomentoSegmento);
                      }
                    }
                    
                    if (ponto.tipo === 'travamento_sup') {
                      // Travamento superior: usar momento superior do travamento ou M2d se coincidente
                      MsdX = travamentoX ? travamentoX.momentoSuperior : (M2dCoincidenteX !== null ? M2dCoincidenteX : 0);
                      MsdY = travamentoY ? travamentoY.momentoSuperior : (M2dCoincidenteY !== null ? M2dCoincidenteY : 0);
                    } else { // travamento_inf
                      // Travamento inferior: usar momento inferior do travamento ou M2d se coincidente
                      MsdX = travamentoX ? travamentoX.momentoInferior : (M2dCoincidenteX !== null ? M2dCoincidenteX : 0);
                      MsdY = travamentoY ? travamentoY.momentoInferior : (M2dCoincidenteY !== null ? M2dCoincidenteY : 0);
                    }

                    // Se não há travamento em alguma direção e também não há M2d coincidente, interpolar
                    if (!travamentoX && M2dCoincidenteX === null && solve.segmentos_x) {
                      MsdX = interpolarMomento(coord, solve.segmentos_x, 'x');
                    }
                    if (!travamentoY && M2dCoincidenteY === null && solve.segmentos_y) {
                      MsdY = interpolarMomento(coord, solve.segmentos_y, 'y');
                    }
                  } else if (ponto.tipo === 'm2d') {
                    // Verificar se é ponto M2d de algum segmento
                    let isM2dX = false;
                    let isM2dY = false;
                    
                    if (solve.segmentos_x) {
                      const segX = solve.segmentos_x.find(seg => {
                        const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                        return Math.abs(coordM2d - coord) < 0.1; // tolerância
                      });
                      if (segX && Number.isFinite(segX.M2d) && segX.M2d !== null) {
                        // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                        const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                          return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                        };
                        const maiorMomentoSegmento = getMaiorMomento(segX.Mtop, segX.Mbase);
                        MsdX = Math.abs(segX.M2d) * Math.sign(maiorMomentoSegmento);
                        isM2dX = true;
                      }
                    }
                    
                    if (solve.segmentos_y) {
                      const segY = solve.segmentos_y.find(seg => {
                        const coordM2d = seg.inicio + (seg.fim - seg.inicio) / 2;
                        return Math.abs(coordM2d - coord) < 0.1; // tolerância
                      });
                      if (segY && Number.isFinite(segY.M2d) && segY.M2d !== null) {
                        // Aplicar a mesma lógica de ajuste de sinal usada nos diagramas
                        const getMaiorMomento = (momentoTop: number, momentoBottom: number) => {
                          return Math.abs(momentoTop) >= Math.abs(momentoBottom) ? momentoTop : momentoBottom;
                        };
                        const maiorMomentoSegmento = getMaiorMomento(segY.Mtop, segY.Mbase);
                        MsdY = Math.abs(segY.M2d) * Math.sign(maiorMomentoSegmento);
                        isM2dY = true;
                      }
                    }
                    
                    // Interpolar o momento na direção que não é M2d
                    if (isM2dX && !isM2dY && solve.segmentos_y) {
                      MsdY = interpolarMomento(coord, solve.segmentos_y, 'y');
                    }
                    if (isM2dY && !isM2dX && solve.segmentos_x) {
                      MsdX = interpolarMomento(coord, solve.segmentos_x, 'x');
                    }
                    
                    // Se nenhum é M2d, interpolar ambos
                    if (!isM2dX && !isM2dY) {
                      if (solve.segmentos_x) MsdX = interpolarMomento(coord, solve.segmentos_x, 'x');
                      if (solve.segmentos_y) MsdY = interpolarMomento(coord, solve.segmentos_y, 'y');
                    }
                  }
                  
                  return {
                    coordenada: ponto.coord,
                    MsdX: MsdX,
                    MsdY: MsdY,
                    label: ponto.label || `${ponto.coord.toFixed(1)}cm`
                  };
                });
                
                return (
                  <table style={{
                    width: '100%',
                    maxWidth: 600,
                    borderCollapse: 'separate',
                    borderSpacing: '0 2px'
                  }}>
                    <thead>
                      <tr style={{ background: THEME.border }}>
                        <th style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          color: THEME.pageText,
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          Ponto
                        </th>
                        <th style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          color: THEME.pageText,
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          Msd,x (kN·m)
                        </th>
                        <th style={{
                          padding: '12px 16px',
                          textAlign: 'center',
                          color: THEME.pageText,
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          Msd,y (kN·m)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paresMomentos.map((par, index) => (
                        <tr key={index} style={{
                          background: index % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'transparent'
                        }}>
                          <td style={{
                            padding: '10px 16px',
                            textAlign: 'left',
                            color: THEME.pageText,
                            fontSize: 13
                          }}>
                            {par.label}
                          </td>
                          <td style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: THEME.pageText,
                            fontSize: 13,
                            fontWeight: Number.isFinite(par.MsdX) ? 'normal' : 'italic'
                          }}>
                            {Number.isFinite(par.MsdX) ? par.MsdX.toFixed(2) : '—'}
                          </td>
                          <td style={{
                            padding: '10px 16px',
                            textAlign: 'center',
                            color: THEME.pageText,
                            fontSize: 13,
                            fontWeight: Number.isFinite(par.MsdY) ? 'normal' : 'italic'
                          }}>
                            {Number.isFinite(par.MsdY) ? par.MsdY.toFixed(2) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  }
  </div>
  );
}