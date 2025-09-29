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

              {/* Aviso movido para cá */}
              {(solve.lamda_x > 90 || solve.lamda_y > 90) && (
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
                      fill="currentColor" />
                  </svg>
                  <span>
                    Atenção: Este método não pode ser aplicado quando λx ou λy {'>'} 90.
                    {solve.lamda_x > 90 && ` (λx = ${solve.lamda_x.toFixed(2)})`}
                    {solve.lamda_y > 90 && ` (λy = ${solve.lamda_y.toFixed(2)})`}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
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
              minHeight: 400 // para dar uma altura mínima ao container vazio
            }}>
              {/* Conteúdo futuro virá aqui */}
            </div>
          )}
        </>
      }

    </div>
  );
}