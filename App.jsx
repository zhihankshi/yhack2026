import { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";

// ─── Design System ─────────────────────────────────────────────────────────
// Aesthetic: Dark courtroom noir. Deep blacks, amber/gold accents.
// Typography: Playfair Display for drama, JetBrains Mono for data.
// Feel: A law firm that specializes in social crimes.

const STEPS_META = {
  research_person: { label: "Profiling the victim", icon: "🔍", color: "#D4A853" },
  assess_damage: { label: "Assessing the damage", icon: "⚖️", color: "#E07B54" },
  build_alibi_narrative: { label: "Constructing the alibi", icon: "📜", color: "#7B9E87" },
  draft_apology: { label: "Drafting the apology", icon: "✍️", color: "#8B9FD4" },
  recommend_gift: { label: "Selecting the offering", icon: "🎁", color: "#C47AC0" },
  schedule_followup: { label: "Planning the follow-up", icon: "📅", color: "#5BA8A0" },
};

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
  { value: "other", label: "Other..." },
];

const BUDGET_OPTIONS = [
  { value: "under_20", label: "Under $20" },
  { value: "20_50", label: "$20–$50" },
  { value: "50_100", label: "$50–$100" },
  { value: "100_plus", label: "$100+" },
];

const MEDIUM_OPTIONS = [
  { value: "text", label: "Text message" },
  { value: "email", label: "Email" },
  { value: "verbal", label: "In person / verbal" },
];

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const config = {
    low: { color: "#7B9E87", label: "LOW RISK", bg: "rgba(123,158,135,0.15)" },
    medium: { color: "#D4A853", label: "MODERATE", bg: "rgba(212,168,83,0.15)" },
    high: { color: "#E07B54", label: "HIGH RISK", bg: "rgba(224,123,84,0.15)" },
    critical: { color: "#E05454", label: "CRITICAL", bg: "rgba(224,84,84,0.15)" },
  };
  const c = config[severity] || config.medium;
  return (
    <span style={{
      color: c.color,
      background: c.bg,
      border: `1px solid ${c.color}40`,
      padding: "2px 10px",
      borderRadius: "3px",
      fontSize: "11px",
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: "2px",
      fontWeight: 700,
    }}>
      {c.label}
    </span>
  );
}

// ─── Step Progress ────────────────────────────────────────────────────────────
function AgentSteps({ steps, currentStep }) {
  return (
    <div style={{ margin: "24px 0" }}>
      {Object.entries(STEPS_META).map(([key, meta], i) => {
        const completed = steps.some(s => s.tool === key);
        const active = currentStep === key;
        return (
          <div key={key} style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 16px",
            marginBottom: "4px",
            borderRadius: "6px",
            background: active ? "rgba(212,168,83,0.08)" : "transparent",
            border: active ? "1px solid rgba(212,168,83,0.2)" : "1px solid transparent",
            transition: "all 0.3s ease",
            opacity: completed || active ? 1 : 0.35,
          }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: completed ? meta.color : active ? "rgba(212,168,83,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${completed || active ? meta.color : "rgba(255,255,255,0.1)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              flexShrink: 0,
              transition: "all 0.3s ease",
            }}>
              {completed ? "✓" : active ? <PulsingDot color={meta.color} /> : <span style={{ fontSize: "11px" }}>{i + 1}</span>}
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              color: completed ? meta.color : active ? "#D4A853" : "#888",
              letterSpacing: "0.5px",
            }}>
              {meta.icon} {meta.label}
            </span>
            {active && (
              <span style={{
                marginLeft: "auto",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: "#D4A853",
                animation: "blink 1s infinite",
              }}>
                RUNNING
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PulsingDot({ color }) {
  return (
    <div style={{
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: color,
      animation: "pulse 1s infinite",
    }} />
  );
}

// ─── Result Cards ─────────────────────────────────────────────────────────────
function ResultCard({ title, icon, color, children, actionLabel, onAction, actionLoading }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid rgba(255,255,255,0.08)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "8px",
      padding: "20px 24px",
      marginBottom: "16px",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "14px",
      }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "16px",
          color: "#F0E6D3",
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          {icon} {title}
        </h3>
        {actionLabel && (
          <button
            onClick={onAction}
            disabled={actionLoading}
            style={{
              background: actionLoading ? "rgba(212,168,83,0.1)" : "rgba(212,168,83,0.15)",
              border: "1px solid rgba(212,168,83,0.4)",
              color: "#D4A853",
              padding: "6px 14px",
              borderRadius: "4px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              cursor: actionLoading ? "not-allowed" : "pointer",
              letterSpacing: "1px",
            }}
          >
            {actionLoading ? "WORKING..." : actionLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Input Form ───────────────────────────────────────────────────────────────
function AlibiForm({ onSubmit, loading }) {
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

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    const payload = {
      ...form,
      failure_type: form.failure_type === "other" ? form.custom_failure : form.failure_type,
    };
    onSubmit(payload);
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "10px 14px",
    color: "#F0E6D3",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#888",
    letterSpacing: "1.5px",
    marginBottom: "6px",
    textTransform: "uppercase",
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Their Name</label>
          <input
            style={inputStyle}
            placeholder="Sarah..."
            value={form.name}
            onChange={e => set("name", e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Relationship</label>
          <select style={inputStyle} value={form.relationship} onChange={e => set("relationship", e.target.value)}>
            {RELATIONSHIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>What did you do</label>
        <select style={inputStyle} value={form.failure_type} onChange={e => set("failure_type", e.target.value)}>
          {FAILURE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {form.failure_type === "other" && (
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Describe what happened</label>
          <input style={inputStyle} placeholder="I..." value={form.custom_failure} onChange={e => set("custom_failure", e.target.value)} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>How long ago</label>
          <select style={inputStyle} value={form.time_elapsed} onChange={e => set("time_elapsed", e.target.value)}>
            {["just happened", "yesterday", "3 days ago", "a week ago", "a month ago"].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Budget</label>
          <select style={inputStyle} value={form.budget} onChange={e => set("budget", e.target.value)}>
            {BUDGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Delivery medium</label>
          <select style={inputStyle} value={form.medium} onChange={e => set("medium", e.target.value)}>
            {MEDIUM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Anything else the agent should know</label>
        <textarea
          style={{ ...inputStyle, height: "72px", resize: "vertical" }}
          placeholder="She's been stressed lately, we've been friends for 10 years..."
          value={form.additional_context}
          onChange={e => set("additional_context", e.target.value)}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <label style={{ ...labelStyle, margin: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={form.prior_failures}
            onChange={e => set("prior_failures", e.target.checked)}
            style={{ accentColor: "#D4A853" }}
          />
          I've done this before with this person
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !form.name}
        style={{
          width: "100%",
          padding: "14px",
          background: loading || !form.name ? "rgba(212,168,83,0.1)" : "rgba(212,168,83,0.2)",
          border: "1px solid rgba(212,168,83,0.5)",
          borderRadius: "6px",
          color: "#D4A853",
          fontFamily: "'Playfair Display', serif",
          fontSize: "16px",
          cursor: loading || !form.name ? "not-allowed" : "pointer",
          letterSpacing: "1px",
          transition: "all 0.2s ease",
        }}
      >
        {loading ? "Agent running..." : "Build My Alibi"}
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, getAccessTokenSilently, user } = useAuth0();

  const [phase, setPhase] = useState("form"); // form | running | result
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [result, setResult] = useState(null);
  const [failureId, setFailureId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionDone, setActionDone] = useState({});
  const eventSourceRef = useRef(null);

  const setAction = (key, val) => setActionLoading(s => ({ ...s, [key]: val }));
  const setDone = (key) => setActionDone(s => ({ ...s, [key]: true }));

  async function submitForm(formData) {
    setPhase("running");
    setSteps([]);
    setCurrentStep(null);
    setResult(null);

    const token = await getAccessTokenSilently();

    // POST then listen via SSE for streaming steps
    const response = await fetch("http://localhost:3001/api/run-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split("\n").filter(l => l.startsWith("data: "));

      for (const line of lines) {
        try {
          const event = JSON.parse(line.replace("data: ", ""));

          if (event.type === "agent_step") {
            setCurrentStep(event.tool);
            setSteps(s => [...s, event]);
          }

          if (event.type === "agent_complete") {
            setResult(event.result);
            setFailureId(event.failure_id);
            setCurrentStep(null);
            setPhase("result");
          }

          if (event.type === "agent_error") {
            console.error("Agent error:", event.message);
            setPhase("form");
          }
        } catch (e) {}
      }
    }
  }

  async function sendEmail() {
    setAction("email", true);
    const token = await getAccessTokenSilently();
    await fetch("http://localhost:3001/api/send-apology-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ failure_id: failureId, apology: result.apology }),
    });
    setAction("email", false);
    setDone("email");
  }

  async function scheduleFollowup() {
    setAction("followup", true);
    const token = await getAccessTokenSilently();
    await fetch("http://localhost:3001/api/schedule-followup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ failure_id: failureId, followup: result.followup, person_name: result.research?.name }),
    });
    setAction("followup", false);
    setDone("followup");
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0C0B09; }
        select option { background: #1A1814; color: #F0E6D3; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,168,83,0.3); border-radius: 2px; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#0C0B09",
        backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(212,168,83,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(224,123,84,0.03) 0%, transparent 50%)",
        color: "#F0E6D3",
        fontFamily: "'JetBrains Mono', monospace",
      }}>

        {/* Header */}
        <div style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#D4A853",
              letterSpacing: "1px",
            }}>
              THE ALIBI
            </h1>
            <p style={{ fontSize: "10px", color: "#666", letterSpacing: "3px", marginTop: "2px" }}>
              RELATIONSHIP RECOVERY AGENT
            </p>
          </div>

          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "12px", color: "#888" }}>{user?.email}</span>
              <button
                onClick={() => logout({ returnTo: window.location.origin })}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#888",
                  padding: "6px 14px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                SIGN OUT
              </button>
            </div>
          ) : (
            <button
              onClick={() => loginWithRedirect()}
              style={{
                background: "rgba(212,168,83,0.15)",
                border: "1px solid rgba(212,168,83,0.4)",
                color: "#D4A853",
                padding: "8px 20px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "1px",
              }}
            >
              SIGN IN
            </button>
          )}
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 24px" }}>

          {!isAuthenticated ? (
            <LandingHero onLogin={() => loginWithRedirect()} />
          ) : phase === "form" ? (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ marginBottom: "36px" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: "#F0E6D3", marginBottom: "8px" }}>
                  Confess your crime.
                </h2>
                <p style={{ color: "#888", fontSize: "13px", lineHeight: 1.6 }}>
                  The agent will handle the rest — narrative, apology, gift, follow-up. Autonomously.
                </p>
              </div>
              <AlibiForm onSubmit={submitForm} loading={false} />
            </div>
          ) : phase === "running" ? (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ marginBottom: "28px" }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: "#F0E6D3", marginBottom: "8px" }}>
                  Agent is working.
                </h2>
                <p style={{ color: "#888", fontSize: "12px" }}>Do not close this tab. The agent is making decisions.</p>
              </div>
              <AgentSteps steps={steps} currentStep={currentStep} />
            </div>
          ) : phase === "result" && result ? (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "32px",
              }}>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: "#F0E6D3", marginBottom: "8px" }}>
                    Your alibi is ready.
                  </h2>
                  <p style={{ color: "#888", fontSize: "12px" }}>
                    {result.steps?.length} agent steps completed
                  </p>
                </div>
                {result.damage_assessment && (
                  <SeverityBadge severity={result.damage_assessment.severity} />
                )}
              </div>

              {/* Damage Assessment */}
              {result.damage_assessment && (
                <ResultCard title="Damage Assessment" icon="⚖️" color="#E07B54">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {[
                      ["Severity", result.damage_assessment.severity?.toUpperCase()],
                      ["Urgency", result.damage_assessment.urgency],
                      ["Recommended Tone", result.damage_assessment.recommended_tone],
                      ["Strategy", result.damage_assessment.recovery_strategy],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1.5px", marginBottom: "3px" }}>{label.toUpperCase()}</div>
                        <div style={{ fontSize: "13px", color: "#F0E6D3" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </ResultCard>
              )}

              {/* The Alibi */}
              {result.alibi && (
                <ResultCard title="The Alibi" icon="📜" color="#7B9E87">
                  <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#D4C9B8", fontStyle: "italic" }}>
                    "{result.alibi.narrative}"
                  </p>
                  <div style={{ marginTop: "10px", fontSize: "11px", color: "#666" }}>
                    Plausibility score: {Math.round((result.alibi.plausibility_score || 0.87) * 100)}% · {result.alibi.recommended_delivery}
                  </div>
                </ResultCard>
              )}

              {/* The Apology */}
              {result.apology && (
                <ResultCard
                  title="Apology Draft"
                  icon="✍️"
                  color="#8B9FD4"
                  actionLabel={actionDone.email ? "✓ DRAFTED" : "DRAFT IN GMAIL"}
                  onAction={sendEmail}
                  actionLoading={actionLoading.email}
                >
                  <div style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    padding: "16px",
                    fontSize: "13px",
                    lineHeight: 1.7,
                    color: "#D4C9B8",
                  }}>
                    {result.apology.subject && (
                      <div style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ color: "#666", fontSize: "10px", letterSpacing: "1.5px" }}>SUBJECT: </span>
                        <span>{result.apology.subject}</span>
                      </div>
                    )}
                    <div style={{ whiteSpace: "pre-line" }}>{result.apology.body}</div>
                    {result.apology.ps_line && (
                      <div style={{ marginTop: "12px", color: "#888", fontStyle: "italic" }}>{result.apology.ps_line}</div>
                    )}
                  </div>
                </ResultCard>
              )}

              {/* Gift Recommendation */}
              {result.gift && (
                <ResultCard title="Recovery Offering" icon="🎁" color="#C47AC0">
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1.5px", marginBottom: "4px" }}>PRIMARY</div>
                    <div style={{ fontSize: "14px", color: "#F0E6D3" }}>{result.gift.primary_recommendation}</div>
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1.5px", marginBottom: "4px" }}>BACKUP</div>
                    <div style={{ fontSize: "13px", color: "#D4C9B8" }}>{result.gift.backup_recommendation}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1.5px", marginBottom: "4px" }}>GESTURE ALTERNATIVE</div>
                    <div style={{ fontSize: "13px", color: "#888", fontStyle: "italic" }}>{result.gift.gesture_alternative}</div>
                  </div>
                </ResultCard>
              )}

              {/* Follow-up */}
              {result.followup && (
                <ResultCard
                  title="Follow-up Plan"
                  icon="📅"
                  color="#5BA8A0"
                  actionLabel={actionDone.followup ? "✓ SCHEDULED" : "ADD TO CALENDAR"}
                  onAction={scheduleFollowup}
                  actionLoading={actionLoading.followup}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1.5px", marginBottom: "3px" }}>TIMING</div>
                      <div style={{ fontSize: "13px", color: "#F0E6D3" }}>{result.followup.followup_timing}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1.5px", marginBottom: "3px" }}>CALENDAR EVENT</div>
                      <div style={{ fontSize: "13px", color: "#F0E6D3" }}>{result.followup.calendar_title}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: "#D4C9B8", fontStyle: "italic" }}>
                    "{result.followup.followup_message}"
                  </div>
                </ResultCard>
              )}

              <button
                onClick={() => { setPhase("form"); setResult(null); setSteps([]); }}
                style={{
                  marginTop: "8px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#666",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "1px",
                  width: "100%",
                }}
              >
                NEW CASE
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function LandingHero({ onLogin }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", animation: "fadeIn 0.5s ease" }}>
      <div style={{ fontSize: "48px", marginBottom: "24px" }}>⚖️</div>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "36px",
        color: "#F0E6D3",
        marginBottom: "16px",
        lineHeight: 1.2,
      }}>
        You forgot.<br />
        <span style={{ color: "#D4A853", fontStyle: "italic" }}>We fix it.</span>
      </h2>
      <p style={{
        color: "#888",
        fontSize: "14px",
        lineHeight: 1.7,
        maxWidth: "420px",
        margin: "0 auto 36px",
      }}>
        An autonomous agent that constructs your alibi, drafts your apology, picks your gift, and schedules your follow-up. You just sign off.
      </p>
      <button
        onClick={onLogin}
        style={{
          background: "rgba(212,168,83,0.2)",
          border: "1px solid rgba(212,168,83,0.5)",
          color: "#D4A853",
          padding: "14px 36px",
          borderRadius: "6px",
          fontFamily: "'Playfair Display', serif",
          fontSize: "16px",
          cursor: "pointer",
          letterSpacing: "1px",
        }}
      >
        Confess Your Crime
      </button>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0C0B09",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#D4A853",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "12px",
      letterSpacing: "2px",
    }}>
      LOADING...
    </div>
  );
}
