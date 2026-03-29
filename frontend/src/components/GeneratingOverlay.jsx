import { useState, useEffect, useRef } from "react";

const PHASE_TEXT = {
  research_person: "Researching your crime...",
  assess_damage: "Assessing the damage...",
  build_alibi_narrative: "Forging your alibi...",
  recommend_gift: "Selecting your penance...",
  schedule_followup: "Dispatching the gift...",
};

const SEQUENCE = [
  "Researching your crime...",
  "Assessing the damage...",
  "Forging your alibi...",
  "Selecting your penance...",
  "Dispatching the gift...",
];

export default function GeneratingOverlay({ isGenerating, currentPhase = "" }) {
  const [mountedOpacity, setMountedOpacity] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [shown, setShown] = useState("");
  const seqIndexRef = useRef(0);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-generating-overlay", "1");
    el.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,700&display=swap');

@keyframes gen-overlay-spin {
  to { transform: rotate(360deg); }
}
`;
    document.head.appendChild(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (!isGenerating) {
      setMountedOpacity(0);
      setProgressWidth(0);
      setShown("");
      clearTimers();
      return;
    }
    requestAnimationFrame(() => setMountedOpacity(1));
    setProgressWidth(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setProgressWidth(95));
    });
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) return;

    clearTimers();
    setShown("");

    const hadPhase = Boolean(PHASE_TEXT[currentPhase]);
    const initial =
      PHASE_TEXT[currentPhase] ??
      SEQUENCE[seqIndexRef.current % SEQUENCE.length];

    const runTypewriter = (fullStr) => {
      let i = 0;
      const step = () => {
        i += 1;
        setShown(fullStr.slice(0, i));
        if (i < fullStr.length) {
          timersRef.current.push(setTimeout(step, 40));
        } else {
          timersRef.current.push(
            setTimeout(() => {
              if (!hadPhase) {
                seqIndexRef.current += 1;
                runTypewriter(
                  SEQUENCE[seqIndexRef.current % SEQUENCE.length],
                );
              }
            }, 1500),
          );
        }
      };
      step();
    };

    runTypewriter(initial);

    return () => clearTimers();
  }, [isGenerating, currentPhase]);

  if (!isGenerating) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(14,12,8,0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: mountedOpacity,
        transition: "opacity 0.4s ease",
      }}
    >
      <svg
        width={60}
        height={60}
        viewBox="0 0 48 48"
        fill="none"
        stroke="#C9A84C"
        strokeWidth={1.25}
        style={{
          animation: "gen-overlay-spin 3s linear infinite",
          marginBottom: 24,
        }}
      >
        <path d="M24 4 L38 12 L38 28 L24 44 L10 28 L10 12 Z" />
        <path d="M24 14 L24 34 M18 20 L30 28 M30 20 L18 28" />
      </svg>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: 24,
          color: "#C9A84C",
          margin: "0 0 28px",
          minHeight: 36,
          textAlign: "center",
          maxWidth: 420,
          padding: "0 24px",
        }}
      >
        {shown}
        <span style={{ opacity: 0.35 }}>|</span>
      </p>
      <div
        style={{
          width: 200,
          height: 2,
          background: "rgba(201,168,76,0.15)",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressWidth}%`,
            background: "#C9A84C",
            borderRadius: 1,
            transition: "width 30s linear",
          }}
        />
      </div>
    </div>
  );
}
