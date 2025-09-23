import { THEME } from "../config/theme";

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

export default LabeledNumber;