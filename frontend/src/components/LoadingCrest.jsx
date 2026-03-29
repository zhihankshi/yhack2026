import { useEffect, useRef, useState } from "react";
import { T } from "../lib/tokens.js";

/** SVG crest path draw (~1.8s) then fade out */
export function LoadingCrest({ onDone }) {
  const [out, setOut] = useState(false);
  const pathRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1)";
    path.style.strokeDashoffset = "0";
    const t = setTimeout(() => setOut(true), 1750);
    const t2 = setTimeout(() => onDone?.(), 2200);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.bg,
        opacity: out ? 0 : 1,
        visibility: out ? "hidden" : "visible",
        transition: "opacity 0.45s ease, visibility 0s linear 0.5s",
        pointerEvents: out ? "none" : "auto",
      }}
    >
      <svg
        width="200"
        height="220"
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          ref={pathRef}
          d="M100 8 L118 52 L168 56 L132 88 L142 138 L100 112 L58 138 L68 88 L32 56 L82 52 Z M100 112 L100 200 M70 168 L130 168 M85 185 L115 185"
          stroke={T.gold}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: "28%",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.35em",
          color: T.parchmentFaint,
          fontFamily: T.fontBody,
        }}
      >
        SIR ALIBI
      </div>
    </div>
  );
}
