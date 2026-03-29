import { useEffect, useState } from "react";
import { T } from "../lib/tokens.js";

export function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0, on: false });

  useEffect(() => {
    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY, on: true });
    };
    const leave = () => setPos((p) => ({ ...p, on: false }));
    window.addEventListener("mousemove", move);
    document.body.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.body.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: 22,
        height: 22,
        marginLeft: -11,
        marginTop: -11,
        pointerEvents: "none",
        zIndex: 99998,
        opacity: pos.on ? 1 : 0,
        mixBlendMode: "normal",
      }}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 1 L20 11 L11 21 L2 11 Z"
          stroke={T.gold}
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="11" cy="11" r="2" fill={T.gold} opacity="0.35" />
      </svg>
    </div>
  );
}
