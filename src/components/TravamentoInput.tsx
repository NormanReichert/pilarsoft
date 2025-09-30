import { THEME } from "../config/theme";

interface TravamentoInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function TravamentoInput({ label, value, onChange, min, max, step = 0.1 }: TravamentoInputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 10, color: THEME.subtle }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={{
          width: '80%',
          padding: '4px 6px',
          border: '1px solid #475569',
          borderRadius: 4,
          background: '#0b1220',
          color: THEME.pageText,
          fontSize: 12,
        }}
      />
    </div>
  );
}

export default TravamentoInput;
