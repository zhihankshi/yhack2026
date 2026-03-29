import { T } from "../lib/tokens.js";

export function Spinner({ size = 16, color = T.gold }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        border: `2px solid ${color}28`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

