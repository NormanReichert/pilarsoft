import { THEME } from "../config/theme";


export const HEADER_H = 82; // altura do header fixo
export type TabKey = "entrada" | "discretizacao" | "resultados" | "memoria" | "diagrama";
const TABS: { k: TabKey; t: string }[] = [
  { k: "entrada", t: "Dados de entrada" },
  { k: "discretizacao", t: "Discretização" },
  { k: "resultados", t: "Resultados" },
  { k: "diagrama", t: "Diagrama de interação" },
  //{ k: "memoria", t: "Memória de cálculo" },
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
export default FixedHeader;