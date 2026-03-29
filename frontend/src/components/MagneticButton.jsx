import { useRef, useCallback } from "react";
import { T } from "../lib/tokens.js";

const MAX = 8;

export function MagneticButton({
  children,
  onClick,
  className,
  style = {},
  primary = false,
}) {
  const ref = useRef(null);

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = ((e.clientX - cx) / r.width) * MAX;
    const dy = ((e.clientY - cy) / r.height) * MAX;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = "translate(0,0)";
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        padding: primary ? "14px 28px" : "12px 22px",
        borderRadius: T.radiusFull,
        border: primary ? "none" : `1px solid ${T.goldBorder}`,
        background: primary
          ? T.crimson
          : "rgba(201,168,76,0.08)",
        color: primary ? T.bg : T.parchment,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: T.fontBody,
        cursor: "pointer",
        transition: "transform 0.12s ease-out, box-shadow 0.2s ease",
        boxShadow: primary ? "0 4px 24px rgba(184,49,47,0.35)" : "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
