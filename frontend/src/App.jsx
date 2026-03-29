import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useTTS } from "./hooks/useTTS.js";
import { GOLDEN_PATH_RESULT } from "./data/goldenPath.js";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#FAF3E4",
  surface: "#F3E8D0",
  white: "#FFFDF7",
  text: "#1A0D05",
  textMuted: "#7A5A38",
  textFaint: "#B89870",
  orange: "#D4591A",
  orangeLight: "rgba(212,89,26,0.10)",
  orangeBorder: "rgba(212,89,26,0.30)",
  brown: "#8B4513",
  brownLight: "rgba(139,69,19,0.08)",
  amber: "#E8921A",
  amberLight: "rgba(232,146,26,0.12)",
  green: "#4A7A4A",
  greenLight: "rgba(74,122,74,0.10)",
  red: "#C43228",
  redLight: "rgba(196,50,40,0.10)",
  border: "rgba(139,69,19,0.14)",
  borderMed: "rgba(139,69,19,0.24)",
  shadow: "0 2px 10px rgba(26,13,5,0.07)",
  shadowMd: "0 4px 20px rgba(26,13,5,0.10)",
  radius: "12px",
  radiusSm: "8px",
  radiusLg: "16px",
  radiusFull: "100px",
};

// ─── Agent Steps Metadata ─────────────────────────────────────────────────────
const STEPS_META = {
  research_person: {
    label: "Profiling the situation",
    icon: "🔍",
    color: T.orange,
  },
  assess_damage: { label: "Assessing the damage", icon: "⚖️", color: T.amber },
  build_alibi_narrative: {
    label: "Constructing the alibi",
    icon: "📜",
    color: T.brown,
  },
  draft_apology: { label: "Drafting the apology", icon: "✍️", color: T.orange },
  recommend_gift: {
    label: "Selecting the offering",
    icon: "🎁",
    color: "#9B59B6",
  },
  schedule_followup: {
    label: "Scheduling the follow-up",
    icon: "📅",
    color: T.green,
  },
};

/** Client-only pacing for the loading screen (steps 1→5); step 6 runs until the agent returns. */
const FAKE_STEP_DWELL_MS = 850;
/** Demo: extra pause on the final step before showing the golden-path result. */
const DEMO_FINAL_HOLD_MS = 1200;

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
  *, *::before, *::after { box-sizing: border-box; }
  input, select, textarea, button { font-family: 'Nunito', sans-serif; }
  input::placeholder, textarea::placeholder { color: #B89870; }
  select option { background: #F3E8D0; color: #1A0D05; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(139,69,19,0.22); border-radius: 3px; }
`;

// ─── Utility ──────────────────────────────────────────────────────────────────
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function Spinner({ size = 16, color = T.orange }) {
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

function PulsingDot({ color = T.orange }) {
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
    low: { bg: "#E8F4E8", color: "#2E7D32", label: "LOW RISK" },
    medium: { bg: "#FFF8E1", color: "#E65100", label: "MODERATE" },
    high: { bg: "#FFF0E0", color: T.orange, label: "HIGH RISK" },
    critical: { bg: "#FFEBEE", color: T.red, label: "CRITICAL" },
  };
  const c = cfg[severity] || cfg.medium;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: c.bg,
        color: c.color,
        border: `1.5px solid ${c.color}60`,
        borderRadius: T.radiusFull,
        padding: "4px 14px",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "1.5px",
      }}
    >
      {c.label}
    </span>
  );
}

function Toast({ message, type = "error", onDismiss }) {
  const cfg = {
    error: { bg: "#FFEBEE", border: T.red, color: T.red },
    warning: { bg: "#FFF8E1", border: T.amber, color: "#7A4A00" },
    success: { bg: "#E8F5E8", border: T.green, color: "#2E5E2E" },
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
        border: `1.5px solid ${c.border}`,
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
          fontWeight: 700,
          flex: 1,
          lineHeight: 1.4,
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

// ─── Shared card styles ───────────────────────────────────────────────────────
const metaLabel = {
  fontSize: 10,
  fontWeight: 800,
  color: T.textFaint,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  marginBottom: 4,
};

function cardWrap(accentColor) {
  return {
    background: T.white,
    border: `1.5px solid ${T.border}`,
    borderLeft: `4px solid ${accentColor}`,
    borderRadius: T.radiusSm,
    padding: "20px 24px",
    marginBottom: 16,
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
          fontSize: 16,
          fontWeight: 800,
          color: T.text,
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: 7,
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

function ActionBtn({ onClick, disabled, color = T.orange, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: `${color}12`,
        border: `1.5px solid ${color}38`,
        borderRadius: T.radiusSm,
        padding: "6px 14px",
        color,
        fontWeight: 800,
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
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
        border: `1px solid ${color}28`,
        borderRadius: T.radiusFull,
        padding: "3px 11px",
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: T.textFaint }}>
        {label}:
      </span>
      <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}</span>
    </span>
  );
}

// ─── Progress Panel ───────────────────────────────────────────────────────────
function ProgressPanel({ completedKeys, currentStep }) {
  const done = new Set(completedKeys);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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
              padding: "11px 15px",
              borderRadius: T.radiusSm,
              background: isActive
                ? T.orangeLight
                : isDone
                  ? T.greenLight
                  : "transparent",
              border: `1.5px solid ${isActive ? T.orangeBorder : isDone ? "rgba(74,122,74,0.28)" : T.border}`,
              opacity: isPending ? 0.4 : 1,
              transition: "all 0.3s ease",
              animation: isDone ? `stepIn 0.3s ease ${i * 0.04}s both` : "none",
            }}
          >
            {/* Circle */}
            <div
              style={{
                width: 33,
                height: 33,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isDone
                  ? T.green
                  : isActive
                    ? T.orangeLight
                    : T.brownLight,
                border: `2px solid ${isDone ? T.green : isActive ? T.orange : T.border}`,
                fontSize: isDone ? 14 : 15,
                color: isDone ? "#fff" : "inherit",
                transition: "all 0.3s ease",
              }}
            >
              {isDone ? (
                "✓"
              ) : isActive ? (
                <PulsingDot color={T.orange} />
              ) : (
                <span
                  style={{ fontSize: 11, fontWeight: 800, color: T.textFaint }}
                >
                  {i + 1}
                </span>
              )}
            </div>
            {/* Label */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: isDone || isActive ? 700 : 600,
                  color: isDone ? T.green : isActive ? T.text : T.textMuted,
                }}
              >
                {meta.icon} {meta.label}
              </div>
            </div>
            {/* Status tag */}
            {isActive && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 10,
                  fontWeight: 800,
                  color: T.orange,
                  letterSpacing: "1.5px",
                }}
              >
                <Spinner size={11} color={T.orange} />
                RUNNING
              </div>
            )}
            {isDone && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: T.green,
                  letterSpacing: "1.5px",
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

// ─── Alibi Card (TTS) ─────────────────────────────────────────────────────────
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
    <div style={cardWrap(T.orange)}>
      <CardHead icon="📜" title="The Alibi" color={T.orange}>
        <ActionBtn
          onClick={play}
          disabled={isLoading || !alibi?.narrative}
          color={T.orange}
        >
          {isLoading ? (
            <>
              <Spinner size={11} color={T.orange} /> Generating…
            </>
          ) : isPlaying ? (
            "⏸ Pause"
          ) : hasAudio ? (
            "▶ Resume"
          ) : (
            "▶ Play Aloud"
          )}
        </ActionBtn>
        <ActionBtn onClick={handleCopy} color={T.brown}>
          {copied ? "✓ Copied" : "Copy"}
        </ActionBtn>
      </CardHead>

      <blockquote
        style={{
          borderLeft: `3px solid ${T.orange}`,
          margin: "0 0 14px",
          paddingLeft: 16,
          fontSize: 15,
          fontStyle: "italic",
          fontWeight: 600,
          lineHeight: 1.75,
          color: T.text,
        }}
      >
        "{alibi?.narrative}"
      </blockquote>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {alibi?.plausibility_score != null && (
          <MetaPill
            label="Plausibility"
            value={`${Math.round(alibi.plausibility_score * 100)}%`}
            color={T.orange}
          />
        )}
        {alibi?.recommended_delivery && (
          <MetaPill
            label="Deliver"
            value={alibi.recommended_delivery}
            color={T.brown}
          />
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "9px 12px",
            background: T.redLight,
            border: `1px solid ${T.red}28`,
            borderRadius: T.radiusSm,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            fontWeight: 700,
            color: T.red,
          }}
        >
          <span>🔇 Audio unavailable — {error}</span>
          <button
            onClick={clearError}
            style={{
              background: "none",
              border: "none",
              color: T.red,
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
    <div style={cardWrap("#8B9FD4")}>
      <CardHead icon="✍️" title="Apology Draft" color="#6878C4">
        <ActionBtn onClick={handleCopy} color="#6878C4">
          {copied ? "✓ Copied!" : "Copy Text"}
        </ActionBtn>
        {onDraftEmail && (
          <ActionBtn
            onClick={onDraftEmail}
            disabled={emailLoading || emailDone}
            color={emailDone ? T.green : T.orange}
          >
            {emailLoading ? (
              <>
                <Spinner size={11} color={T.orange} /> Working…
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
          background: T.surface,
          border: `1.5px solid ${T.border}`,
          borderRadius: T.radiusSm,
          padding: "16px 20px",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.75,
          color: T.text,
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
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {apology.subject}
            </span>
          </div>
        )}
        <div style={{ whiteSpace: "pre-line" }}>{apology?.body}</div>
        {apology?.ps_line && (
          <div
            style={{
              marginTop: 14,
              color: T.textMuted,
              fontStyle: "italic",
              fontSize: 13,
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
    <div style={cardWrap("#9B59B6")}>
      <CardHead icon="🎁" title="Recovery Offering" color="#7D3C98" />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={metaLabel}>PRIMARY RECOMMENDATION</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: T.text,
              lineHeight: 1.6,
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
              color="#7D3C98"
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
              background: "rgba(155,89,182,0.08)",
              border: "1.5px solid rgba(155,89,182,0.28)",
              borderRadius: T.radiusSm,
              padding: "9px 16px",
              color: "#7D3C98",
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
              width: "fit-content",
            }}
          >
            🛒 Shop Gift →
          </a>
        )}

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
          <div style={metaLabel}>BACKUP</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.textMuted,
              lineHeight: 1.55,
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
                fontSize: 13,
                fontWeight: 600,
                color: T.textMuted,
                fontStyle: "italic",
                lineHeight: 1.55,
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
      <CardHead icon="📅" title="Follow-up Plan" color="#2E6A2E">
        {onSchedule && (
          <ActionBtn
            onClick={onSchedule}
            disabled={scheduleLoading || scheduleDone}
            color={scheduleDone ? T.green : "#2E6A2E"}
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
          <div style={{ fontSize: 20, fontWeight: 900, color: "#2E6A2E" }}>
            {followup?.followup_timing}
          </div>
        </div>
        <div>
          <div style={metaLabel}>CALENDAR TITLE</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.text,
              lineHeight: 1.4,
            }}
          >
            {followup?.calendar_title}
          </div>
        </div>
      </div>

      {followup?.followup_message && (
        <div
          style={{
            background: T.greenLight,
            border: "1.5px solid rgba(74,122,74,0.22)",
            borderRadius: T.radiusSm,
            padding: "12px 16px",
            fontSize: 14,
            fontStyle: "italic",
            fontWeight: 600,
            color: T.text,
            lineHeight: 1.65,
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
    <div style={cardWrap(T.amber)}>
      <CardHead icon="⚖️" title="Damage Assessment" color="#A06010" />
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
                fontWeight: 700,
                fontSize: 13,
                color: T.text,
                marginTop: 2,
                lineHeight: 1.4,
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
    background: T.white,
    border: `1.5px solid ${T.border}`,
    borderRadius: T.radiusSm,
    padding: "10px 13px",
    color: T.text,
    fontSize: 14,
    fontWeight: 600,
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const lbl = (text) => (
    <label
      style={{
        display: "block",
        fontSize: 10,
        fontWeight: 800,
        color: T.textFaint,
        letterSpacing: "1.8px",
        textTransform: "uppercase",
        marginBottom: 6,
      }}
    >
      {text}
    </label>
  );

  return (
    <div>
      {/* Name + Relationship */}
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
            onFocus={(e) => (e.target.style.borderColor = T.orange)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        </div>
        <div>
          {lbl("Relationship")}
          <select
            style={field}
            value={form.relationship}
            onChange={(e) => set("relationship", e.target.value)}
          >
            {RELATIONSHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* What happened */}
      <div style={{ marginBottom: 14 }}>
        {lbl("What did you do")}
        <select
          style={field}
          value={form.failure_type}
          onChange={(e) => set("failure_type", e.target.value)}
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
            onFocus={(e) => (e.target.style.borderColor = T.orange)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        </div>
      )}

      {/* Time / Budget / Medium */}
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
          >
            {MEDIUM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Context */}
      <div style={{ marginBottom: 14 }}>
        {lbl("Anything the agent should know")}
        <textarea
          style={{ ...field, height: 78, resize: "vertical" }}
          placeholder="She's been stressed with deadlines lately, we've been friends 10 years…"
          value={form.additional_context}
          onChange={(e) => set("additional_context", e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = T.orange)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
        />
      </div>

      {/* Prior failures */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 26,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          color: T.textMuted,
        }}
      >
        <input
          type="checkbox"
          checked={form.prior_failures}
          onChange={(e) => set("prior_failures", e.target.checked)}
          style={{
            accentColor: T.orange,
            width: 16,
            height: 16,
            flexShrink: 0,
          }}
        />
        I've let this person down before
      </label>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !canSubmit}
        style={{
          width: "100%",
          padding: "15px",
          background: loading || !canSubmit ? T.orangeLight : T.orange,
          border: `2px solid ${loading || !canSubmit ? T.orangeBorder : T.orange}`,
          borderRadius: T.radius,
          color: loading || !canSubmit ? T.orange : "#fff",
          fontSize: 16,
          fontWeight: 900,
          cursor: loading || !canSubmit ? "not-allowed" : "pointer",
          letterSpacing: "0.3px",
          transition: "all 0.18s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <>
            <Spinner size={16} color={T.orange} /> Running agent…
          </>
        ) : (
          "Build My Alibi →"
        )}
      </button>

      {/* Demo shortcut */}
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <button
          onClick={onDemo}
          style={{
            background: "none",
            border: "none",
            color: T.textFaint,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            textDecoration: "underline",
            textDecorationStyle: "dotted",
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
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "68px 24px 56px",
        animation: "fadeUp 0.5s ease both",
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: T.orangeLight,
          border: `1.5px solid ${T.orangeBorder}`,
          borderRadius: T.radiusFull,
          padding: "5px 16px",
          marginBottom: 28,
          fontSize: 10,
          fontWeight: 800,
          color: T.orange,
          letterSpacing: "2px",
        }}
      >
        🤖 AUTONOMOUS AI AGENT
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: "clamp(44px, 9vw, 80px)",
          fontWeight: 900,
          color: T.text,
          lineHeight: 1.0,
          marginBottom: 10,
          letterSpacing: "-2px",
          fontFamily: "'Doors', 'Nunito', sans-serif",
        }}
      >
        THE ALIBI
      </h1>
      <p
        style={{
          fontSize: "clamp(13px, 2.5vw, 17px)",
          fontWeight: 800,
          color: T.orange,
          letterSpacing: "4px",
          marginBottom: 28,
          textTransform: "uppercase",
        }}
      >
        Relationship Recovery Agent
      </p>

      {/* Description */}
      <p
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: T.textMuted,
          lineHeight: 1.8,
          maxWidth: 470,
          marginBottom: 40,
        }}
      >
        You forgot. You flaked. You went MIA.
        <br />
        The agent builds your alibi, writes your apology,
        <br />
        picks your gift, and schedules the follow-up.{" "}
        <strong style={{ color: T.text }}>You just show up.</strong>
      </p>

      {/* Step trail */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 44,
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
                background: T.white,
                border: `1.5px solid ${T.border}`,
                borderRadius: T.radiusFull,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 700,
                color: T.textMuted,
                boxShadow: T.shadow,
              }}
            >
              {icon} {label}
            </span>
            {i < arr.length - 1 && (
              <span style={{ color: T.orange, fontSize: 13, fontWeight: 900 }}>
                →
              </span>
            )}
          </span>
        ))}
      </div>

      {/* CTAs */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={onEnter}
          style={{
            background: T.orange,
            border: "none",
            borderRadius: T.radius,
            color: "#fff",
            padding: "15px 44px",
            fontSize: 16,
            fontWeight: 900,
            cursor: "pointer",
            letterSpacing: "0.3px",
            boxShadow: `0 6px 22px ${T.orange}45`,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 10px 30px ${T.orange}55`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = `0 6px 22px ${T.orange}45`;
          }}
        >
          Confess Your Crime →
        </button>
        <button
          onClick={onDemo}
          style={{
            background: "none",
            border: `1.5px solid ${T.border}`,
            borderRadius: T.radius,
            color: T.textMuted,
            padding: "12px 32px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "border-color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.brown)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
        >
          Watch the Demo Run
        </button>
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
      <Spinner size={30} color={T.orange} />
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: T.textFaint,
          letterSpacing: "2px",
        }}
      >
        LOADING…
      </div>
    </div>
  );
}

// ─── Auth-aware entry points ──────────────────────────────────────────────────
// AuthedEntry calls useAuth0 — only rendered when Auth0Provider is present
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

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App({ authless = false }) {
  if (authless) return <AppCore auth={MOCK_AUTH} />;
  return <AuthedEntry />;
}

// ─── App Core (all logic lives here) ─────────────────────────────────────────
function AppCore({ auth }) {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = auth;

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState("landing");
  /** Ordered tool ids finished before `currentStep` (active step is not included). */
  const [completedStepKeys, setCompletedStepKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const runningStepRef = useRef(null);
  const fakeRunTimersRef = useRef([]);
  const [result, setResult] = useState(null);
  const [failureId, setFailureId] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionDone, setActionDone] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("google_calendar_connected");

    if (connected !== "1") return;

    const pending = localStorage.getItem("pendingCalendarPayload");
    if (!pending) return;

    const run = async () => {
      try {
        const apiUrl =
          (typeof import.meta !== "undefined" &&
            import.meta.env?.VITE_API_URL) ||
          "http://localhost:3001";

        const headers = { "Content-Type": "application/json" };

        try {
          const t = await getAccessTokenSilently();
          if (t) headers["Authorization"] = `Bearer ${t}`;
        } catch {}

        const res = await fetch(`${apiUrl}/api/schedule-followup`, {
          method: "POST",
          headers,
          body: pending,
        });

        if (!res.ok) {
          throw new Error(`Calendar retry failed: ${res.status}`);
        }

        localStorage.removeItem("pendingCalendarPayload");
        showToast("Follow-up added to calendar!", "success");
        actD("followup");

        const url = new URL(window.location.href);
        url.searchParams.delete("google_calendar_connected");
        window.history.replaceState({}, "", url.toString());
      } catch (error) {
        console.error("calendar retry error:", error);
        showToast("Couldn't add follow-up to calendar.", "error");
      }
    };

    run();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("google_gmail_connected");

    if (connected !== "1") return;

    const pending = localStorage.getItem("pendingGmailPayload");
    if (!pending) return;

    const run = async () => {
      try {
        const apiUrl =
          (typeof import.meta !== "undefined" &&
            import.meta.env?.VITE_API_URL) ||
          "http://localhost:3001";

        const headers = { "Content-Type": "application/json" };

        try {
          const t = await getAccessTokenSilently();
          if (t) headers["Authorization"] = `Bearer ${t}`;
        } catch {}

        const emailRes = await fetch(`${apiUrl}/api/send-apology-email`, {
          method: "POST",
          headers,
          body: pending,
        });

        const emailJson = await emailRes.json().catch(() => ({}));

        if (!emailRes.ok) {
          throw new Error(
            emailJson.error || `Gmail retry failed: ${emailRes.status}`,
          );
        }

        localStorage.removeItem("pendingGmailPayload");
        actD("email");
        showToast("Email drafted in Gmail!", "success");

        const url = new URL(window.location.href);
        url.searchParams.delete("google_gmail_connected");
        window.history.replaceState({}, "", url.toString());
      } catch (error) {
        console.error("gmail retry error:", error);
        showToast("Couldn't add Gmail draft.", "error");
      }
    };

    run();
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("google_gmail_connected");

    if (connected !== "1") return;

    const pending = localStorage.getItem("pendingGmailPayload");
    if (!pending) return;

    const run = async () => {
      try {
        const apiUrl =
          (typeof import.meta !== "undefined" &&
            import.meta.env?.VITE_API_URL) ||
          "http://localhost:3001";

        const headers = { "Content-Type": "application/json" };

        try {
          const t = await getAccessTokenSilently();
          if (t) headers["Authorization"] = `Bearer ${t}`;
        } catch {}

        const emailRes = await fetch(`${apiUrl}/api/send-apology-email`, {
          method: "POST",
          headers,
          body: pending,
        });

        const emailJson = await emailRes.json().catch(() => ({}));

        if (!emailRes.ok) {
          throw new Error(
            emailJson.error || `Gmail retry failed: ${emailRes.status}`,
          );
        }

        localStorage.removeItem("pendingGmailPayload");
        actD("email");
        showToast("Email drafted in Gmail!", "success");

        const url = new URL(window.location.href);
        url.searchParams.delete("google_gmail_connected");
        window.history.replaceState({}, "", url.toString());
      } catch (error) {
        console.error("gmail retry error:", error);
        showToast("Couldn't add Gmail draft.", "error");
      }
    };

    run();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("google_gmail_connected");

    if (connected !== "1") return;

    const pending = localStorage.getItem("pendingGmailPayload");
    if (!pending) return;

    const run = async () => {
      try {
        const apiUrl =
          (typeof import.meta !== "undefined" &&
            import.meta.env?.VITE_API_URL) ||
          "http://localhost:3001";

        const headers = { "Content-Type": "application/json" };

        try {
          const t = await getAccessTokenSilently();
          if (t) headers["Authorization"] = `Bearer ${t}`;
        } catch {}

        const emailRes = await fetch(`${apiUrl}/api/send-apology-email`, {
          method: "POST",
          headers,
          body: pending,
        });

        const emailJson = await emailRes.json().catch(() => ({}));

        if (!emailRes.ok) {
          throw new Error(
            emailJson.error || `Gmail retry failed: ${emailRes.status}`,
          );
        }

        localStorage.removeItem("pendingGmailPayload");
        actD("email");
        showToast("Email drafted in Gmail!", "success");

        const url = new URL(window.location.href);
        url.searchParams.delete("google_gmail_connected");
        window.history.replaceState({}, "", url.toString());
      } catch (error) {
        console.error("gmail retry error:", error);
        showToast("Couldn't add Gmail draft.", "error");
      }
    };

    run();
  }, []);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };
  const actL = (k, v) => setActionLoading((s) => ({ ...s, [k]: v }));
  const actD = (k) => setActionDone((s) => ({ ...s, [k]: true }));

  const applyAgentStep = useCallback((tool) => {
    const prev = runningStepRef.current;
    runningStepRef.current = tool;
    if (prev) setCompletedStepKeys((c) => [...c, prev]);
    setCurrentStep(tool);
  }, []);

  const finalizeRunningSteps = useCallback(() => {
    setCompletedStepKeys((c) =>
      runningStepRef.current ? [...c, runningStepRef.current] : c,
    );
    runningStepRef.current = null;
    setCurrentStep(null);
  }, []);

  const clearFakeRunTimers = useCallback(() => {
    fakeRunTimersRef.current.forEach((id) => clearTimeout(id));
    fakeRunTimersRef.current = [];
  }, []);

  /** Marks every step done (e.g. agent finished before the fake timeline caught up). */
  const forceAllStepsComplete = useCallback(() => {
    runningStepRef.current = null;
    setCompletedStepKeys(Object.keys(STEPS_META));
    setCurrentStep(null);
  }, []);

  /** Drives the loading list on a fixed timer; step 6 stays active until `agent_complete`. */
  const startFakeLoadingProgress = useCallback(() => {
    clearFakeRunTimers();
    const keys = Object.keys(STEPS_META);
    if (keys.length === 0) return;
    applyAgentStep(keys[0]);
    for (let i = 1; i < keys.length; i++) {
      const id = setTimeout(
        () => applyAgentStep(keys[i]),
        FAKE_STEP_DWELL_MS * i,
      );
      fakeRunTimersRef.current.push(id);
    }
  }, [applyAgentStep, clearFakeRunTimers]);

  // ── Demo run ───────────────────────────────────────────────────────────────
  const runDemo = useCallback(() => {
    setPhase("running");
    clearFakeRunTimers();
    runningStepRef.current = null;
    setCompletedStepKeys([]);
    setCurrentStep(null);
    setResult(null);
    setActionDone({});

    const keys = Object.keys(STEPS_META);
    applyAgentStep(keys[0]);
    for (let i = 1; i < keys.length; i++) {
      const id = setTimeout(
        () => applyAgentStep(keys[i]),
        FAKE_STEP_DWELL_MS * i,
      );
      fakeRunTimersRef.current.push(id);
    }
    const doneId = setTimeout(
      () => {
        finalizeRunningSteps();
        setResult(GOLDEN_PATH_RESULT);
        setFailureId("demo-run-001");
        setPhase("result");
      },
      FAKE_STEP_DWELL_MS * (keys.length - 1) + DEMO_FINAL_HOLD_MS,
    );
    fakeRunTimersRef.current.push(doneId);
  }, [applyAgentStep, finalizeRunningSteps, clearFakeRunTimers]);

  // ── Real submit ────────────────────────────────────────────────────────────
  async function submitForm(formData) {
    setPhase("running");
    clearFakeRunTimers();
    runningStepRef.current = null;
    setCompletedStepKeys([]);
    setCurrentStep(null);
    setResult(null);
    setActionDone({});
    startFakeLoadingProgress();

    try {
      const headers = { "Content-Type": "application/json" };
      try {
        const token = await getAccessTokenSilently();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch {
        /* no token — proceed without */
      }

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
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lineParts = sseBuffer.split("\n");
        sseBuffer = lineParts.pop() ?? "";

        for (const line of lineParts) {
          const trimmed = line.replace(/\r$/, "");
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(trimmed.slice(6));
            if (ev.type === "agent_complete") {
              clearFakeRunTimers();
              forceAllStepsComplete();
              setResult(ev.result);
              setFailureId(ev.failure_id);
              setPhase("result");
            }
            if (ev.type === "agent_error") {
              clearFakeRunTimers();
              runningStepRef.current = null;
              setCompletedStepKeys([]);
              setCurrentStep(null);
              showToast(`Agent error: ${ev.message}`, "error");
              setPhase("form");
            }
          } catch {
            /* malformed SSE line */
          }
        }
      }

      if (sseBuffer.trim()) {
        const trimmed = sseBuffer.replace(/\r$/, "");
        if (trimmed.startsWith("data: ")) {
          try {
            const ev = JSON.parse(trimmed.slice(6));
            if (ev.type === "agent_complete") {
              clearFakeRunTimers();
              forceAllStepsComplete();
              setResult(ev.result);
              setFailureId(ev.failure_id);
              setPhase("result");
            }
            if (ev.type === "agent_error") {
              clearFakeRunTimers();
              runningStepRef.current = null;
              setCompletedStepKeys([]);
              setCurrentStep(null);
              showToast(`Agent error: ${ev.message}`, "error");
              setPhase("form");
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      clearFakeRunTimers();
      showToast("Backend unreachable — switching to demo mode.", "warning");
      setTimeout(runDemo, 500);
    }
  }

  // ── Backend actions ────────────────────────────────────────────────────────
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

      const ps = result.apology.ps_line?.trim();
      const fu = result.followup?.followup_message?.trim();
      const includePs =
        ps && ps !== fu && !(fu && (fu.includes(ps) || ps.includes(fu)));

      const payload = {
        subject: result.apology.subject,
        body: [result.apology.body, includePs ? ps : ""]
          .filter(Boolean)
          .join("\n\n"),
      };

      const emailRes = await fetch(`${apiUrl}/api/send-apology-email`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const emailJson = await emailRes.json().catch(() => ({}));

      if (emailRes.status === 401 && emailJson.error === "NOT_AUTHENTICATED") {
        localStorage.setItem("pendingGmailPayload", JSON.stringify(payload));
        window.location.href = `${apiUrl}/api/auth/google/start`;
        return;
      }

      if (!emailRes.ok) {
        throw new Error(emailJson.error || "draft failed");
      }

      actD("email");
      showToast("Email drafted in Gmail!", "success");
    } catch (error) {
      console.error("gmail error:", error);
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

      const payload = {
        failure_id: failureId,
        followup: result.followup,
        person_name: result.research?.name,
      };

      const res = await fetch(`${apiUrl}/api/schedule-followup`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        localStorage.setItem("pendingCalendarPayload", JSON.stringify(payload));
        window.location.href = `${apiUrl}/api/google/auth`;
        return;
      }

      if (!res.ok) {
        throw new Error(`Calendar request failed: ${res.status}`);
      }

      const data = await res.json();
      console.log("calendar response:", data);

      actD("followup");
      showToast("Follow-up added to calendar!", "success");
    } catch (error) {
      console.error("calendar error:", error);
      showToast("Couldn't reach Calendar integration.", "error");
    } finally {
      actL("followup", false);
    }
  }

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (isLoading) return <LoadingScreen />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <div style={{ minHeight: "100vh", background: T.bg }}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header
          style={{
            background: T.white,
            borderBottom: `2px solid ${T.border}`,
            padding: "0 28px",
            height: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 2px 8px rgba(26,13,5,0.05)",
          }}
        >
          <button
            onClick={() => {
              setPhase(isAuthenticated ? "form" : "landing");
              setResult(null);
              runningStepRef.current = null;
              setCompletedStepKeys([]);
              setCurrentStep(null);
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
                fontSize: 18,
                fontWeight: 900,
                color: T.text,
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              THE ALIBI
            </div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: T.orange,
                letterSpacing: "2.5px",
                marginTop: 2,
              }}
            >
              RELATIONSHIP RECOVERY AGENT
            </div>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user?.email && (
              <span
                style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}
              >
                {user.email}
              </span>
            )}
            {isAuthenticated && auth !== MOCK_AUTH ? (
              <button
                onClick={() => logout({ returnTo: window.location.origin })}
                style={{
                  background: "none",
                  border: `1.5px solid ${T.border}`,
                  borderRadius: T.radiusSm,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.textMuted,
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            ) : !isAuthenticated ? (
              <button
                onClick={() => loginWithRedirect()}
                style={{
                  background: T.orange,
                  border: "none",
                  borderRadius: T.radiusSm,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Sign in
              </button>
            ) : null}
          </div>
        </header>

        {/* ── Page Content ───────────────────────────────────────────────── */}
        <main
          style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 72px" }}
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
              <div style={{ marginBottom: 28 }}>
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: T.text,
                    marginBottom: 8,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Confess your crime.
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.textMuted,
                    lineHeight: 1.65,
                  }}
                >
                  Tell the agent what happened. It handles everything else —
                  autonomously.
                </p>
              </div>
              <div
                style={{
                  background: T.white,
                  border: `1.5px solid ${T.border}`,
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
                    background: T.orangeLight,
                    border: `1.5px solid ${T.orangeBorder}`,
                    borderRadius: T.radiusFull,
                    padding: "5px 14px",
                    marginBottom: 14,
                    fontSize: 10,
                    fontWeight: 800,
                    color: T.orange,
                    letterSpacing: "2px",
                  }}
                >
                  <Spinner size={10} color={T.orange} /> AGENT RUNNING
                </div>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: T.text,
                    marginBottom: 6,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Building your alibi.
                </h2>
                <p
                  style={{ fontSize: 13, fontWeight: 600, color: T.textMuted }}
                >
                  The agent is reasoning autonomously. Don't close this tab.
                </p>
              </div>
              <div
                style={{
                  background: T.white,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: T.radiusLg,
                  padding: 22,
                  boxShadow: T.shadow,
                }}
              >
                <ProgressPanel
                  completedKeys={completedStepKeys}
                  currentStep={currentStep}
                />
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
                  marginBottom: 24,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: T.text,
                      marginBottom: 5,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Your alibi is ready.
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: T.textMuted,
                    }}
                  >
                    {Object.keys(STEPS_META).length} agent steps completed
                  </p>
                </div>
                {result.damage_assessment?.severity && (
                  <SeverityBadge severity={result.damage_assessment.severity} />
                )}
              </div>

              {/* Step completion pills */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 24,
                }}
              >
                {Object.entries(STEPS_META).map(([, meta]) => (
                  <span
                    key={meta.label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: T.greenLight,
                      border: "1.5px solid rgba(74,122,74,0.25)",
                      borderRadius: T.radiusFull,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.green,
                    }}
                  >
                    ✓ {meta.icon} {meta.label}
                  </span>
                ))}
              </div>

              {/* Result cards */}
              {result.damage_assessment && (
                <DamageCard assessment={result.damage_assessment} />
              )}
              {result.alibi && <AlibiCard alibi={result.alibi} />}
              {result.apology && (
                <ApologyCard
                  apology={result.apology}
                  onDraftEmail={failureId !== "demo-run-001" ? sendEmail : null}
                  emailLoading={actionLoading.email}
                  emailDone={actionDone.email}
                />
              )}
              {result.gift && <GiftCard gift={result.gift} />}
              {result.followup && (
                <FollowUpCard
                  followup={result.followup}
                  onSchedule={
                    failureId !== "demo-run-001" ? scheduleFollowup : undefined
                  }
                  scheduleLoading={actionLoading.followup}
                  scheduleDone={actionDone.followup}
                />
              )}

              {/* New Case */}
              <button
                onClick={() => {
                  setPhase("form");
                  setResult(null);
                  runningStepRef.current = null;
                  setCompletedStepKeys([]);
                  setCurrentStep(null);
                  setActionDone({});
                  setActionLoading({});
                }}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "13px",
                  background: "none",
                  border: `1.5px solid ${T.border}`,
                  borderRadius: T.radius,
                  color: T.textMuted,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = T.orange;
                  e.currentTarget.style.color = T.orange;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.color = T.textMuted;
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
