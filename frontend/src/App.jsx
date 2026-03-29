import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useTTS } from "./hooks/useTTS.js";
import { GOLDEN_PATH_RESULT } from "./data/goldenPath.js";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#0E0C08",
  surface: "#161208",
  surface2: "#1E1A0E",
  parchment: "#F2E9D8",
  parchmentDim: "#9A8E78",
  parchmentFaint: "#3E3828",
  gold: "#C9A84C",
  goldLight: "rgba(201,168,76,0.10)",
  goldBorder: "rgba(201,168,76,0.22)",
  crimson: "#B8312F",
  crimsonLight: "rgba(184,49,47,0.12)",
  crimsonBorder: "rgba(184,49,47,0.28)",
  purple: "#7B5EA7",
  purpleLight: "rgba(123,94,167,0.12)",
  green: "#4E7A50",
  greenLight: "rgba(78,122,80,0.12)",
  border: "rgba(242,233,216,0.07)",
  borderBright: "rgba(242,233,216,0.14)",
  shadow: "0 2px 16px rgba(0,0,0,0.55)",
  shadowMd: "0 6px 32px rgba(0,0,0,0.65)",
  shadowGold: "0 4px 24px rgba(201,168,76,0.18)",
  radius: "10px",
  radiusSm: "6px",
  radiusLg: "16px",
  radiusFull: "100px",
  fontDisplay: "'Cormorant Garamond', 'Doors', serif",
  fontBody: "'DM Sans', 'Nunito', sans-serif",
  fontDoors: "'Doors', 'Cormorant Garamond', serif",
};

// ─── Agent Steps Metadata ─────────────────────────────────────────────────────
const STEPS_META = {
  research_person: {
    label: "Profiling the situation",
    icon: "🔍",
    color: T.gold,
  },
  assess_damage: {
    label: "Assessing the damage",
    icon: "⚖️",
    color: T.crimson,
  },
  build_alibi_narrative: {
    label: "Constructing the alibi",
    icon: "📜",
    color: T.gold,
  },
  draft_apology: { label: "Drafting the apology", icon: "✍️", color: T.gold },
  recommend_gift: {
    label: "Selecting the offering",
    icon: "🎁",
    color: T.purple,
  },
  schedule_followup: {
    label: "Scheduling the follow-up",
    icon: "📅",
    color: T.green,
  },
};

// ─── Form Constants ───────────────────────────────────────────────────────────
const RELATIONSHIP_OPTIONS = [
  { value: "close friend", label: "Close Friend" },
  { value: "coworker", label: "Coworker" },
  { value: "family", label: "Family" },
  { value: "romantic partner", label: "Romantic Partner" },
];
const FAILURE_OPTIONS = [
  { value: "forgot their birthday", label: "Forgot their birthday" },
  { value: "missed an important meeting", label: "Missed a meeting" },
  { value: "flaked on plans", label: "Flaked on plans" },
  { value: "forgot an anniversary", label: "Forgot an anniversary" },
  { value: "ignored messages", label: "Went MIA" },
  { value: "other", label: "Other…" },
];
const BUDGET_OPTIONS = [
  { value: "under_20", label: "Under $20" },
  { value: "20_50", label: "$20 – $50" },
  { value: "50_100", label: "$50 – $100" },
  { value: "100_plus", label: "$100+" },
];
const MEDIUM_OPTIONS = [
  { value: "text", label: "Text message" },
  { value: "email", label: "Email" },
  { value: "verbal", label: "In person" },
];

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1);    }
    50%       { opacity: 0.45; transform: scale(0.72); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0);     }
  }
  @keyframes stepIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0);    }
  }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%;   }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%;   }
  }
  @keyframes goldPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
    50%       { box-shadow: 0 0 0 6px rgba(201,168,76,0.12); }
  }
  *, *::before, *::after { box-sizing: border-box; }
  input, select, textarea, button { font-family: 'DM Sans', 'Nunito', sans-serif; }
  input::placeholder, textarea::placeholder { color: #3E3828; }
  select option { background: #1E1A0E; color: #F2E9D8; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.25); border-radius: 2px; }
  /* Grain texture overlay */
  .grain::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9997;
    opacity: 0.038;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 200px 200px;
  }
`;

// ─── WebGL Shader Background ──────────────────────────────────────────────────
const SHADER_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(in vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;mat2 m=mat2(1.,-.5,.2,1.2);for(int i=0;i<5;i++){t+=a*noise(p);p*=2.*m;a*=.5;}return t;}
float clouds(vec2 p){float d=1.,t=.0;for(float i=.0;i<3.;i++){float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);t=mix(t,d,a);d=a;p*=2./(i+1.);}return t;}
void main(void){
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for(float i=1.;i<12.;i++){
    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
  }
  O=vec4(col,1);
}`;

const VERTEX_SRC = `#version 300 es
precision highp float;
in vec4 position;
void main(){ gl_Position = position; }`;

function useShaderBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2");
    if (!gl) return;
    const compile = (shader, src) => {
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(shader));
    };
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    compile(vs, VERTEX_SRC);
    compile(fs, SHADER_SRC);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      console.error(gl.getProgramInfoLog(prog));
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "resolution");
    const uTime = gl.getUniformLocation(prog, "time");
    const resize = () => {
      const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    let raf;
    const render = (now) => {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
    };
  }, []);
  return canvasRef;
}

// ─── Hover Card Wrapper ───────────────────────────────────────────────────────
function HoverCard({ delay = "0s", children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        filter: hovered ? "drop-shadow(0 12px 28px rgba(0,0,0,0.55))" : "none",
        transition: "transform 0.22s ease, filter 0.22s ease",
        animation: `fadeUp 0.4s ease ${delay} both`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function Spinner({ size = 16, color = T.gold }) {
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

function PulsingDot({ color = T.gold }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        flexShrink: 0,
        borderRadius: "50%",
        background: color,
        animation: "pulse 1.3s ease-in-out infinite",
      }}
    />
  );
}

function SeverityBadge({ severity }) {
  const cfg = {
    low: { bg: "rgba(78,122,80,0.15)", color: "#6AAB6C", label: "LOW RISK" },
    medium: { bg: "rgba(201,168,76,0.15)", color: T.gold, label: "MODERATE" },
    high: { bg: "rgba(184,49,47,0.15)", color: "#D05050", label: "HIGH RISK" },
    critical: {
      bg: "rgba(184,49,47,0.22)",
      color: T.crimson,
      label: "CRITICAL",
    },
  };
  const c = cfg[severity] || cfg.medium;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: c.bg,
        color: c.color,
        border: `1.5px solid ${c.color}50`,
        borderRadius: T.radiusFull,
        padding: "4px 14px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "2px",
        fontFamily: T.fontBody,
      }}
    >
      {c.label}
    </span>
  );
}

function Toast({ message, type = "error", onDismiss }) {
  const cfg = {
    error: { bg: "#1A0A08", border: T.crimson, color: "#D05050" },
    warning: { bg: "#16140A", border: T.gold, color: T.gold },
    success: { bg: "#0A160A", border: T.green, color: "#6AAB6C" },
  };
  const c = cfg[type] || cfg.error;
  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        zIndex: 9999,
        transform: "translateX(-50%)",
        background: c.bg,
        border: `1.5px solid ${c.border}40`,
        borderRadius: T.radiusSm,
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: T.shadowMd,
        animation: "slideDown 0.25s ease both",
        maxWidth: 460,
        width: "90vw",
      }}
    >
      <span
        style={{
          color: c.color,
          fontSize: 13,
          fontWeight: 500,
          flex: 1,
          lineHeight: 1.4,
          fontFamily: T.fontBody,
        }}
      >
        {message}
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          color: c.color,
          fontSize: 18,
          lineHeight: 1,
          opacity: 0.6,
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Shared Card Styles ───────────────────────────────────────────────────────
const metaLabel = {
  fontSize: 9,
  fontWeight: 600,
  color: T.parchmentFaint,
  letterSpacing: "2px",
  textTransform: "uppercase",
  marginBottom: 5,
  fontFamily: T.fontBody,
};

function cardWrap(accentColor) {
  return {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderLeft: `3px solid ${accentColor}`,
    borderRadius: T.radiusSm,
    padding: "20px 24px",
    marginBottom: 14,
    boxShadow: T.shadow,
  };
}

function CardHead({ icon, title, color, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: T.parchment,
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontFamily: T.fontBody,
        }}
      >
        <span>{icon}</span>
        <span style={{ color }}>{title}</span>
      </h3>
      {children && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ onClick, disabled, color = T.gold, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderRadius: T.radiusSm,
        padding: "6px 14px",
        color,
        fontWeight: 600,
        fontSize: 12,
        fontFamily: T.fontBody,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

function MetaPill({ label, value, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: `${color}10`,
        border: `1px solid ${color}25`,
        borderRadius: T.radiusFull,
        padding: "3px 11px",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: T.parchmentFaint,
          fontFamily: T.fontBody,
        }}
      >
        {label}:
      </span>
      <span
        style={{ fontSize: 11, fontWeight: 700, color, fontFamily: T.fontBody }}
      >
        {value}
      </span>
    </span>
  );
}

// ─── Progress Panel ───────────────────────────────────────────────────────────
function ProgressPanel({ steps, currentStep }) {
  const done = new Set(steps.map((s) => s.tool).filter(Boolean));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {Object.entries(STEPS_META).map(([key, meta], i) => {
        const isDone = done.has(key);
        const isActive = currentStep === key;
        const isPending = !isDone && !isActive;
        return (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              padding: "11px 16px",
              borderRadius: T.radiusSm,
              background: isActive
                ? "rgba(201,168,76,0.07)"
                : isDone
                  ? "rgba(78,122,80,0.07)"
                  : "transparent",
              border: `1px solid ${isActive ? T.goldBorder : isDone ? "rgba(78,122,80,0.25)" : T.border}`,
              opacity: isPending ? 0.35 : 1,
              transition: "all 0.3s ease",
              animation: isDone ? `stepIn 0.3s ease ${i * 0.04}s both` : "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isDone
                  ? "rgba(78,122,80,0.2)"
                  : isActive
                    ? T.goldLight
                    : "rgba(242,233,216,0.04)",
                border: `1.5px solid ${isDone ? T.green : isActive ? T.gold : T.border}`,
                fontSize: isDone ? 13 : 15,
                color: isDone ? T.green : "inherit",
                transition: "all 0.3s ease",
              }}
            >
              {isDone ? (
                "✓"
              ) : isActive ? (
                <PulsingDot color={T.gold} />
              ) : (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.parchmentFaint,
                    fontFamily: T.fontBody,
                  }}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isDone || isActive ? 600 : 400,
                  color: isDone
                    ? T.green
                    : isActive
                      ? T.parchment
                      : T.parchmentDim,
                  fontFamily: T.fontBody,
                }}
              >
                {meta.icon} {meta.label}
              </div>
            </div>
            {isActive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 9,
                  fontWeight: 700,
                  color: T.gold,
                  letterSpacing: "2px",
                  fontFamily: T.fontBody,
                }}
              >
                <Spinner size={10} color={T.gold} /> RUNNING
              </div>
            )}
            {isDone && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: T.green,
                  letterSpacing: "2px",
                  fontFamily: T.fontBody,
                }}
              >
                DONE
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Alibi Card (with TTS) ────────────────────────────────────────────────────
function AlibiCard({ alibi }) {
  const [copied, setCopied] = useState(false);
  const { play, isLoading, isPlaying, hasAudio, error, clearError } = useTTS(
    alibi?.narrative,
  );
  const handleCopy = async () => {
    if (await copyText(alibi?.narrative || "")) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };
  return (
    <div style={cardWrap(T.gold)}>
      <CardHead icon="📜" title="The Alibi" color={T.gold}>
        <ActionBtn
          onClick={play}
          disabled={isLoading || !alibi?.narrative}
          color={T.gold}
        >
          {isLoading ? (
            <>
              <Spinner size={11} color={T.gold} /> Generating…
            </>
          ) : isPlaying ? (
            "⏸ Pause"
          ) : hasAudio ? (
            "▶ Resume"
          ) : (
            "▶ Play Aloud"
          )}
        </ActionBtn>
        <ActionBtn onClick={handleCopy} color={T.parchmentDim}>
          {copied ? "✓ Copied" : "Copy"}
        </ActionBtn>
      </CardHead>
      <blockquote
        style={{
          borderLeft: `2px solid ${T.gold}50`,
          margin: "0 0 14px",
          paddingLeft: 16,
          fontSize: 14,
          fontStyle: "italic",
          fontWeight: 400,
          lineHeight: 1.8,
          color: T.parchment,
          fontFamily: T.fontDisplay,
        }}
      >
        "{alibi?.narrative}"
      </blockquote>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {alibi?.plausibility_score != null && (
          <MetaPill
            label="Plausibility"
            value={`${Math.round(alibi.plausibility_score * 100)}%`}
            color={T.gold}
          />
        )}
        {alibi?.recommended_delivery && (
          <MetaPill
            label="Deliver"
            value={alibi.recommended_delivery}
            color={T.parchmentDim}
          />
        )}
      </div>
      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "9px 12px",
            background: T.crimsonLight,
            border: `1px solid ${T.crimson}28`,
            borderRadius: T.radiusSm,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            fontWeight: 500,
            color: "#D05050",
            fontFamily: T.fontBody,
          }}
        >
          <span>🔇 Audio unavailable — {error}</span>
          <button
            onClick={clearError}
            style={{
              background: "none",
              border: "none",
              color: "#D05050",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Apology Card ─────────────────────────────────────────────────────────────
function ApologyCard({ apology, onDraftEmail, emailLoading, emailDone }) {
  const [copied, setCopied] = useState(false);
  const full = [
    apology?.subject ? `Subject: ${apology.subject}` : "",
    "",
    apology?.body || "",
    apology?.ps_line ? `\n${apology.ps_line}` : "",
  ].join("\n");
  const handleCopy = async () => {
    if (await copyText(full)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };
  return (
    <div style={cardWrap("#7B8FD4")}>
      <CardHead icon="✍️" title="Apology Draft" color="#8090D4">
        <ActionBtn onClick={handleCopy} color="#8090D4">
          {copied ? "✓ Copied!" : "Copy Text"}
        </ActionBtn>
        {onDraftEmail && (
          <ActionBtn
            onClick={onDraftEmail}
            disabled={emailLoading || emailDone}
            color={emailDone ? T.green : T.gold}
          >
            {emailLoading ? (
              <>
                <Spinner size={11} color={T.gold} /> Working…
              </>
            ) : emailDone ? (
              "✓ Drafted in Gmail"
            ) : (
              "Draft in Gmail"
            )}
          </ActionBtn>
        )}
      </CardHead>
      <div
        style={{
          background: T.surface2,
          border: `1px solid ${T.border}`,
          borderRadius: T.radiusSm,
          padding: "16px 18px",
          fontSize: 13,
          fontWeight: 400,
          lineHeight: 1.8,
          color: T.parchment,
          fontFamily: T.fontBody,
        }}
      >
        {apology?.subject && (
          <div
            style={{
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <span style={{ ...metaLabel, display: "inline" }}>SUBJECT: </span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              {apology.subject}
            </span>
          </div>
        )}
        <div style={{ whiteSpace: "pre-line" }}>{apology?.body}</div>
        {apology?.ps_line && (
          <div
            style={{
              marginTop: 14,
              color: T.parchmentDim,
              fontStyle: "italic",
              fontSize: 12,
            }}
          >
            {apology.ps_line}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Gift Card ────────────────────────────────────────────────────────────────
function GiftCard({ gift }) {
  return (
    <div style={cardWrap(T.purple)}>
      <CardHead icon="🎁" title="Recovery Offering" color={T.purple} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={metaLabel}>PRIMARY RECOMMENDATION</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: T.parchment,
              lineHeight: 1.65,
              fontFamily: T.fontBody,
            }}
          >
            {gift?.primary_recommendation}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {gift?.price_range && (
            <MetaPill
              label="Price range"
              value={gift.price_range}
              color={T.purple}
            />
          )}
          {gift?.estimated_impact && (
            <MetaPill
              label="Est. impact"
              value={gift.estimated_impact.toUpperCase()}
              color={T.green}
            />
          )}
        </div>
        {gift?.purchase_link && (
          <a
            href={gift.purchase_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: T.purpleLight,
              border: `1px solid ${T.purple}30`,
              borderRadius: T.radiusSm,
              padding: "9px 16px",
              color: T.purple,
              fontWeight: 600,
              fontSize: 12,
              textDecoration: "none",
              width: "fit-content",
              fontFamily: T.fontBody,
            }}
          >
            🛒 Shop Gift →
          </a>
        )}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
          <div style={metaLabel}>BACKUP</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: T.parchmentDim,
              lineHeight: 1.6,
              fontFamily: T.fontBody,
            }}
          >
            {gift?.backup_recommendation}
          </div>
        </div>
        {gift?.gesture_alternative && (
          <div>
            <div style={metaLabel}>GESTURE ALTERNATIVE</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: T.parchmentDim,
                fontStyle: "italic",
                lineHeight: 1.6,
                fontFamily: T.fontBody,
              }}
            >
              {gift.gesture_alternative}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Follow-up Card ───────────────────────────────────────────────────────────
function FollowUpCard({ followup, onSchedule, scheduleLoading, scheduleDone }) {
  return (
    <div style={cardWrap(T.green)}>
      <CardHead icon="📅" title="Follow-up Plan" color={T.green}>
        {onSchedule && (
          <ActionBtn
            onClick={onSchedule}
            disabled={scheduleLoading || scheduleDone}
            color={scheduleDone ? T.green : T.green}
          >
            {scheduleLoading ? (
              <>
                <Spinner size={11} color={T.green} /> Working…
              </>
            ) : scheduleDone ? (
              "✓ Scheduled"
            ) : (
              "Add to Calendar"
            )}
          </ActionBtn>
        )}
      </CardHead>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={metaLabel}>SEND IN</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: T.green,
              fontFamily: T.fontBody,
            }}
          >
            {followup?.followup_timing}
          </div>
        </div>
        <div>
          <div style={metaLabel}>CALENDAR TITLE</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: T.parchment,
              lineHeight: 1.4,
              fontFamily: T.fontBody,
            }}
          >
            {followup?.calendar_title}
          </div>
        </div>
      </div>
      {followup?.followup_message && (
        <div
          style={{
            background: "rgba(78,122,80,0.08)",
            border: `1px solid rgba(78,122,80,0.20)`,
            borderRadius: T.radiusSm,
            padding: "12px 16px",
            fontSize: 13,
            fontStyle: "italic",
            fontWeight: 400,
            color: T.parchment,
            lineHeight: 1.7,
            fontFamily: T.fontDisplay,
          }}
        >
          "{followup.followup_message}"
        </div>
      )}
    </div>
  );
}

// ─── Damage Assessment Card ───────────────────────────────────────────────────
function DamageCard({ assessment }) {
  return (
    <div style={cardWrap(T.crimson)}>
      <CardHead icon="⚖️" title="Damage Assessment" color={T.crimson} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          ["Severity", <SeverityBadge severity={assessment?.severity} />],
          ["Urgency", assessment?.urgency],
          ["Tone", assessment?.recommended_tone],
          ["Strategy", assessment?.recovery_strategy],
        ].map(([label, val]) => (
          <div key={label}>
            <div style={metaLabel}>{label}</div>
            <div
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: T.parchment,
                marginTop: 2,
                lineHeight: 1.45,
                fontFamily: T.fontBody,
              }}
            >
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Input Form ───────────────────────────────────────────────────────────────
function InputForm({ onSubmit, onDemo }) {
  const [form, setForm] = useState({
    name: "",
    relationship: "close friend",
    failure_type: "forgot their birthday",
    custom_failure: "",
    time_elapsed: "just happened",
    prior_failures: false,
    budget: "20_50",
    medium: "text",
    additional_context: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit =
    form.name.trim() &&
    (form.failure_type !== "other" || form.custom_failure.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await onSubmit({
      ...form,
      failure_type:
        form.failure_type === "other" ? form.custom_failure : form.failure_type,
    });
    setLoading(false);
  };

  const field = {
    width: "100%",
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusSm,
    padding: "10px 13px",
    color: T.parchment,
    fontSize: 13,
    fontWeight: 400,
    fontFamily: T.fontBody,
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const lbl = (text) => (
    <label
      style={{
        display: "block",
        fontSize: 9,
        fontWeight: 600,
        color: T.parchmentFaint,
        letterSpacing: "2px",
        textTransform: "uppercase",
        marginBottom: 6,
        fontFamily: T.fontBody,
      }}
    >
      {text}
    </label>
  );

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div>
          {lbl("Their Name")}
          <input
            style={field}
            placeholder="Sarah…"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = T.gold)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        </div>
        <div>
          {lbl("Relationship")}
          <select
            style={field}
            value={form.relationship}
            onChange={(e) => set("relationship", e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = T.gold)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          >
            {RELATIONSHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        {lbl("What did you do")}
        <select
          style={field}
          value={form.failure_type}
          onChange={(e) => set("failure_type", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = T.gold)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
        >
          {FAILURE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {form.failure_type === "other" && (
        <div style={{ marginBottom: 14 }}>
          {lbl("Describe what happened")}
          <input
            style={field}
            placeholder="I forgot to…"
            value={form.custom_failure}
            onChange={(e) => set("custom_failure", e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = T.gold)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div>
          {lbl("How long ago")}
          <select
            style={field}
            value={form.time_elapsed}
            onChange={(e) => set("time_elapsed", e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = T.gold)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          >
            {[
              "just happened",
              "yesterday",
              "3 days ago",
              "a week ago",
              "a month ago",
            ].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          {lbl("Budget")}
          <select
            style={field}
            value={form.budget}
            onChange={(e) => set("budget", e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = T.gold)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          >
            {BUDGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          {lbl("Medium")}
          <select
            style={field}
            value={form.medium}
            onChange={(e) => set("medium", e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = T.gold)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          >
            {MEDIUM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        {lbl("Anything the agent should know")}
        <textarea
          style={{ ...field, height: 80, resize: "vertical" }}
          placeholder="She's been stressed with deadlines lately, we've been friends 10 years…"
          value={form.additional_context}
          onChange={(e) => set("additional_context", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = T.gold)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
        />
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 26,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 400,
          color: T.parchmentDim,
          fontFamily: T.fontBody,
        }}
      >
        <input
          type="checkbox"
          checked={form.prior_failures}
          onChange={(e) => set("prior_failures", e.target.checked)}
          style={{ accentColor: T.gold, width: 15, height: 15, flexShrink: 0 }}
        />
        I've let this person down before
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading || !canSubmit}
        style={{
          width: "100%",
          padding: "14px",
          background:
            loading || !canSubmit
              ? "rgba(201,168,76,0.08)"
              : "linear-gradient(90deg, #B8312F, #C9A84C, #B8312F)",
          backgroundSize: "200% auto",
          animation:
            loading || !canSubmit ? "none" : "gradientShift 3s ease infinite",
          border: `1px solid ${loading || !canSubmit ? T.goldBorder : "transparent"}`,
          borderRadius: T.radius,
          color: loading || !canSubmit ? T.gold : "#0E0C08",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: T.fontBody,
          cursor: loading || !canSubmit ? "not-allowed" : "pointer",
          transition: "opacity 0.18s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <>
            <Spinner size={15} color={T.gold} /> Running agent…
          </>
        ) : (
          "Build My Alibi →"
        )}
      </button>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <button
          onClick={onDemo}
          style={{
            background: "none",
            border: "none",
            color: T.parchmentFaint,
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            textDecoration: "underline",
            textDecorationStyle: "dotted",
            fontFamily: T.fontBody,
          }}
        >
          or run with demo data (Sarah's birthday) →
        </button>
      </div>
    </div>
  );
}

// ─── Landing Hero ─────────────────────────────────────────────────────────────
function LandingHero({ onEnter, onDemo }) {
  const canvasRef = useShaderBackground();
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        height: "calc(100vh - 58px)",
        overflow: "hidden",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.75) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Content overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          padding: "0 24px",
        }}
      >
        {/* Trust badge — fadeInDown 0ms */}
        <div
          style={{
            marginBottom: 32,
            animation: "fadeInDown 0.8s ease-out both",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              background: "rgba(201,168,76,0.10)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(201,168,76,0.30)",
              borderRadius: T.radiusFull,
              fontSize: 13,
              fontWeight: 500,
              color: "#F2E9D8",
              fontFamily: T.fontBody,
            }}
          >
            <span style={{ color: "#C9A84C" }}>✦</span>
            <span>Your Knight in Shining Alibi</span>
          </div>
        </div>

        {/* Headline — two lines */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          {/* Line 1 — Doors font, gold gradient, delay 200ms */}
          <h1
            style={{
              fontSize: "clamp(58px, 13vw, 110px)",
              fontWeight: 900,
              fontFamily: T.fontDoors,
              background: "linear-gradient(90deg, #FDBA74, #C9A84C, #FCD34D)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1.0,
              marginBottom: 4,
              letterSpacing: "-2px",
              animation:
                "gradientShift 3s ease infinite, fadeInUp 0.8s ease-out 0.2s both",
            }}
          >
            THE ALIBI
          </h1>
          {/* Line 2 — Cormorant Garamond italic, crimson→gold gradient, delay 400ms */}
          <h2
            style={{
              fontSize: "clamp(18px, 3.5vw, 34px)",
              fontWeight: 700,
              fontStyle: "italic",
              fontFamily: T.fontDisplay,
              background: "linear-gradient(90deg, #F2E9D8, #C9A84C, #B8312F)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "1px",
              animation:
                "gradientShift 4s ease 0.5s infinite, fadeInUp 0.8s ease-out 0.4s both",
            }}
          >
            Relationship Recovery Agent
          </h2>
        </div>

        {/* Subtitle — delay 600ms */}
        <div
          style={{
            maxWidth: 560,
            textAlign: "center",
            marginBottom: 28,
            animation: "fadeInUp 0.8s ease-out 0.6s both",
          }}
        >
          <p
            style={{
              fontSize: "clamp(14px, 2vw, 18px)",
              fontWeight: 300,
              color: "rgba(242,233,216,0.85)",
              lineHeight: 1.8,
              fontFamily: T.fontBody,
            }}
          >
            You forgot. You flaked. You went MIA. The agent constructs your
            alibi, writes your apology, picks your gift, and schedules the
            follow-up.{" "}
            <strong style={{ fontWeight: 700, color: "#F2E9D8" }}>
              You just show up.
            </strong>
          </p>
        </div>

        {/* Step trail — delay 600ms */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 36,
            animation: "fadeInUp 0.8s ease-out 0.6s both",
          }}
        >
          {[
            ["🔍", "Research"],
            ["⚖️", "Assess"],
            ["📜", "Alibi"],
            ["✍️", "Apology"],
            ["🎁", "Gift"],
            ["📅", "Follow-up"],
          ].map(([icon, label], i, arr) => (
            <span
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(201,168,76,0.20)",
                  borderRadius: T.radiusFull,
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(242,233,216,0.8)",
                  fontFamily: T.fontBody,
                }}
              >
                {icon} {label}
              </span>
              {i < arr.length - 1 && (
                <span
                  style={{ color: "#C9A84C", fontSize: 12, fontWeight: 700 }}
                >
                  →
                </span>
              )}
            </span>
          ))}
        </div>

        {/* CTAs — delay 800ms */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 14,
            justifyContent: "center",
            animation: "fadeInUp 0.8s ease-out 0.8s both",
          }}
        >
          {/* Primary — animated gradient, dark text, pill */}
          <button
            onClick={onEnter}
            style={{
              padding: "15px 36px",
              background: "linear-gradient(90deg, #B8312F, #C9A84C, #B8312F)",
              backgroundSize: "200% auto",
              animation: "gradientShift 3s ease infinite",
              border: "none",
              borderRadius: T.radiusFull,
              color: "#0E0C08",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: T.fontBody,
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(184,49,47,0.35)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 8px 36px rgba(184,49,47,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 24px rgba(184,49,47,0.35)";
            }}
          >
            Confess Your Crime →
          </button>

          {/* Secondary — gold frosted glass, pill */}
          <button
            onClick={onDemo}
            style={{
              padding: "15px 36px",
              background: "rgba(201,168,76,0.08)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(201,168,76,0.28)",
              borderRadius: T.radiusFull,
              color: "#F2E9D8",
              fontSize: 16,
              fontWeight: 500,
              fontFamily: T.fontBody,
              cursor: "pointer",
              transition:
                "transform 0.3s ease, background 0.3s ease, border-color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.background = "rgba(201,168,76,0.16)";
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.50)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "rgba(201,168,76,0.08)";
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.28)";
            }}
          >
            Watch the Demo Run
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <Spinner size={28} color={T.gold} />
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: T.parchmentFaint,
          letterSpacing: "3px",
          fontFamily: T.fontBody,
        }}
      >
        LOADING…
      </div>
    </div>
  );
}

// ─── Auth wrappers ────────────────────────────────────────────────────────────
function AuthedEntry() {
  const auth = useAuth0();
  return <AppCore auth={auth} />;
}

const MOCK_AUTH = {
  isAuthenticated: true,
  isLoading: false,
  user: null,
  loginWithRedirect: () => {},
  logout: () => {},
  getAccessTokenSilently: async () => null,
};

export default function App({ authless = false }) {
  if (authless) return <AppCore auth={MOCK_AUTH} />;
  return <AuthedEntry />;
}

// ─── App Core ─────────────────────────────────────────────────────────────────
function AppCore({ auth }) {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = auth;

  const [phase, setPhase] = useState("landing");
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [result, setResult] = useState(null);
  const [failureId, setFailureId] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionDone, setActionDone] = useState({});

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };
  const actL = (k, v) => setActionLoading((s) => ({ ...s, [k]: v }));
  const actD = (k) => setActionDone((s) => ({ ...s, [k]: true }));

  const runDemo = useCallback(() => {
    setPhase("running");
    setSteps([]);
    setCurrentStep(null);
    setResult(null);
    setActionDone({});
    const keys = Object.keys(STEPS_META);
    keys.forEach((key, i) => {
      setTimeout(() => {
        setCurrentStep(key);
        setSteps((s) => [...s, { tool: key, step_number: i + 1 }]);
        if (i === keys.length - 1) {
          setTimeout(() => {
            setCurrentStep(null);
            setResult(GOLDEN_PATH_RESULT);
            setFailureId("demo-run-001");
            setPhase("result");
          }, 1300);
        }
      }, i * 1050);
    });
  }, []);

  async function submitForm(formData) {
    setPhase("running");
    setSteps([]);
    setCurrentStep(null);
    setResult(null);
    setActionDone({});
    try {
      const headers = { "Content-Type": "application/json" };
      try {
        const token = await getAccessTokenSilently();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch {}
      const apiUrl =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
        "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/run-agent`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder
          .decode(value, { stream: true })
          .split("\n")
          .filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "agent_step") {
              setCurrentStep(ev.tool);
              setSteps((s) => [...s, ev]);
            }
            if (ev.type === "agent_complete") {
              setResult(ev.result);
              setFailureId(ev.failure_id);
              setCurrentStep(null);
              setPhase("result");
            }
            if (ev.type === "agent_error") {
              showToast(`Agent error: ${ev.message}`, "error");
              setPhase("form");
            }
          } catch {}
        }
      }
    } catch {
      showToast("Backend unreachable — switching to demo mode.", "warning");
      setTimeout(runDemo, 500);
    }
  }

  async function sendEmail() {
    if (!failureId || !result?.apology) return;
    actL("email", true);
    try {
      const headers = { "Content-Type": "application/json" };
      try {
        const t = await getAccessTokenSilently();
        if (t) headers["Authorization"] = `Bearer ${t}`;
      } catch {}
      const apiUrl =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
        "http://localhost:3001";
      await fetch(`${apiUrl}/api/send-apology-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          failure_id: failureId,
          apology: result.apology,
        }),
      });
      actD("email");
      showToast("Email drafted in Gmail!", "success");
    } catch {
      showToast("Couldn't reach Gmail integration.", "error");
    } finally {
      actL("email", false);
    }
  }

  async function scheduleFollowup() {
    if (!failureId || !result?.followup) return;
    actL("followup", true);
    try {
      const headers = { "Content-Type": "application/json" };
      try {
        const t = await getAccessTokenSilently();
        if (t) headers["Authorization"] = `Bearer ${t}`;
      } catch {}
      const apiUrl =
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
        "http://localhost:3001";
      await fetch(`${apiUrl}/api/schedule-followup`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          failure_id: failureId,
          followup: result.followup,
          person_name: result.research?.name,
        }),
      });
      actD("followup");
      showToast("Follow-up added to calendar!", "success");
    } catch {
      showToast("Couldn't reach Calendar integration.", "error");
    } finally {
      actL("followup", false);
    }
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <div className="grain" style={{ minHeight: "100vh", background: T.bg }}>
        {/* ── Header ── */}
        <header
          style={{
            background: "rgba(14,12,8,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: `1px solid ${T.border}`,
            padding: "0 32px",
            height: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <button
            onClick={() => {
              setPhase(isAuthenticated ? "form" : "landing");
              setResult(null);
              setSteps([]);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: T.parchment,
                letterSpacing: "0.5px",
                lineHeight: 1,
                fontFamily: T.fontDoors,
              }}
            >
              THE ALIBI
            </div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 600,
                color: T.gold,
                letterSpacing: "3px",
                marginTop: 2,
                fontFamily: T.fontBody,
              }}
            >
              RELATIONSHIP RECOVERY AGENT
            </div>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user?.email && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: T.parchmentDim,
                  fontFamily: T.fontBody,
                }}
              >
                {user.email}
              </span>
            )}
            {isAuthenticated && auth !== MOCK_AUTH ? (
              <button
                onClick={() => logout({ returnTo: window.location.origin })}
                style={{
                  background: "none",
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radiusSm,
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 500,
                  color: T.parchmentDim,
                  fontFamily: T.fontBody,
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            ) : !isAuthenticated ? (
              <button
                onClick={() => loginWithRedirect()}
                style={{
                  background: T.goldLight,
                  border: `1px solid ${T.goldBorder}`,
                  borderRadius: T.radiusSm,
                  padding: "7px 18px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.gold,
                  fontFamily: T.fontBody,
                  cursor: "pointer",
                }}
              >
                Sign in
              </button>
            ) : null}
          </div>
        </header>

        {/* ── Page Content ── */}
        <main
          style={{
            maxWidth: phase === "landing" ? "none" : 720,
            margin: phase === "landing" ? "0" : "0 auto",
            padding: phase === "landing" ? "0" : "0 20px 80px",
          }}
        >
          {/* LANDING */}
          {phase === "landing" && (
            <LandingHero onEnter={() => setPhase("form")} onDemo={runDemo} />
          )}

          {/* FORM */}
          {phase === "form" && (
            <div
              style={{ animation: "fadeUp 0.35s ease both", paddingTop: 48 }}
            >
              <div style={{ marginBottom: 30 }}>
                <h2
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: T.parchment,
                    marginBottom: 8,
                    letterSpacing: "-0.5px",
                    fontFamily: T.fontDisplay,
                  }}
                >
                  Confess your crime.
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: T.parchmentDim,
                    lineHeight: 1.65,
                    fontFamily: T.fontBody,
                  }}
                >
                  Tell the agent what happened. It handles everything else —
                  autonomously.
                </p>
              </div>
              <div
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radiusLg,
                  padding: "26px 26px 22px",
                  boxShadow: T.shadowMd,
                }}
              >
                <InputForm onSubmit={submitForm} onDemo={runDemo} />
              </div>
            </div>
          )}

          {/* RUNNING */}
          {phase === "running" && (
            <div style={{ animation: "fadeUp 0.3s ease both", paddingTop: 48 }}>
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: T.goldLight,
                    border: `1px solid ${T.goldBorder}`,
                    borderRadius: T.radiusFull,
                    padding: "5px 16px",
                    marginBottom: 16,
                    fontSize: 9,
                    fontWeight: 700,
                    color: T.gold,
                    letterSpacing: "2.5px",
                    fontFamily: T.fontBody,
                    animation: "goldPulse 2s ease infinite",
                  }}
                >
                  <Spinner size={9} color={T.gold} /> AGENT RUNNING
                </div>
                <h2
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: T.parchment,
                    marginBottom: 6,
                    fontFamily: T.fontDisplay,
                  }}
                >
                  Building your alibi.
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: T.parchmentDim,
                    fontFamily: T.fontBody,
                  }}
                >
                  The agent is reasoning autonomously. Don't close this tab.
                </p>
              </div>
              <div
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radiusLg,
                  padding: 22,
                  boxShadow: T.shadow,
                }}
              >
                <ProgressPanel steps={steps} currentStep={currentStep} />
              </div>
            </div>
          )}

          {/* RESULT */}
          {phase === "result" && result && (
            <div style={{ animation: "fadeUp 0.4s ease both", paddingTop: 48 }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 22,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 34,
                      fontWeight: 700,
                      fontStyle: "italic",
                      color: T.parchment,
                      marginBottom: 5,
                      fontFamily: T.fontDisplay,
                    }}
                  >
                    Your alibi is ready.
                  </h2>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 400,
                      color: T.parchmentDim,
                      fontFamily: T.fontBody,
                    }}
                  >
                    {Object.keys(STEPS_META).length} agent steps completed
                  </p>
                </div>
                {result.damage_assessment?.severity && (
                  <SeverityBadge severity={result.damage_assessment.severity} />
                )}
              </div>

              {/* Completion pills */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 22,
                }}
              >
                {Object.entries(STEPS_META).map(([, meta]) => (
                  <span
                    key={meta.label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(78,122,80,0.10)",
                      border: "1px solid rgba(78,122,80,0.22)",
                      borderRadius: T.radiusFull,
                      padding: "3px 10px",
                      fontSize: 10,
                      fontWeight: 600,
                      color: T.green,
                      fontFamily: T.fontBody,
                    }}
                  >
                    ✓ {meta.icon} {meta.label}
                  </span>
                ))}
              </div>

              {/* Result cards — staggered */}
              {result.damage_assessment && (
                <HoverCard delay="0.05s">
                  <DamageCard assessment={result.damage_assessment} />
                </HoverCard>
              )}
              {result.alibi && (
                <HoverCard delay="0.15s">
                  <AlibiCard alibi={result.alibi} />
                </HoverCard>
              )}
              {result.apology && (
                <HoverCard delay="0.25s">
                  <ApologyCard
                    apology={result.apology}
                    onDraftEmail={
                      failureId !== "demo-run-001" ? sendEmail : null
                    }
                    emailLoading={actionLoading.email}
                    emailDone={actionDone.email}
                  />
                </HoverCard>
              )}
              {result.gift && (
                <HoverCard delay="0.35s">
                  <GiftCard gift={result.gift} />
                </HoverCard>
              )}
              {result.followup && (
                <HoverCard delay="0.45s">
                  <FollowUpCard
                    followup={result.followup}
                    onSchedule={
                      failureId !== "demo-run-001"
                        ? scheduleFollowup
                        : undefined
                    }
                    scheduleLoading={actionLoading.followup}
                    scheduleDone={actionDone.followup}
                  />
                </HoverCard>
              )}

              {/* New Case */}
              <button
                onClick={() => {
                  setPhase("form");
                  setResult(null);
                  setSteps([]);
                  setActionDone({});
                  setActionLoading({});
                }}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "13px",
                  background: "none",
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radius,
                  color: T.parchmentDim,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: T.fontBody,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = T.gold;
                  e.currentTarget.style.color = T.gold;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.color = T.parchmentDim;
                }}
              >
                + New Case
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
