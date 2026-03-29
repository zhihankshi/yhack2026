import { T } from "../lib/tokens.js";

export function ScrollProgress({ progress }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 99999,
        background: "rgba(0,0,0,0.25)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          background: `linear-gradient(90deg, ${T.gold}, ${T.crimson})`,
          transition: "width 0.05s linear",
        }}
      />
    </div>
  );
}
