import { THEME } from "../config/theme";

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

export default TableKV;