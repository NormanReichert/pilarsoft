import { THEME } from "../config/theme";

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

export default TextLabel;