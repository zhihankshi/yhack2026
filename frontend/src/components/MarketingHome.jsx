import { useState, useEffect, useRef } from "react";
import { T } from "../lib/tokens.js";
import KnightHero from "./KnightHero.jsx";

const HERO_TICKER = [
  "Forgot her birthday ✦",
  "Ghosted the group chat ✦",
  "Cancelled last minute again ✦",
  "Missed the anniversary ✦",
  "Left them on read for 3 weeks ✦",
  "Showed up 2 hours late ✦",
];

const SOCIAL_TICKER = [
  "Saved my relationship twice — @sophiamakes",
  "Like having a lawyer and a florist on speed dial — TechCrunch",
  "Genuinely unhinged. I love it. — @devonclark_",
  "My mum thinks I am thoughtful now — App Store ★★★★★",
];

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

function MagneticButton({ children, onClick, style, type = "button" }) {
  const ref = useRef(null);
  const [t, setT] = useState("translate(0px, 0px)");

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    setT(
      `translate(${(e.clientX - cx) * 0.18}px, ${(e.clientY - cy) * 0.18}px)`,
    );
  };

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={() => setT("translate(0px, 0px)")}
      style={{
        ...style,
        transform: t,
        transition: "transform 0.2s ease-out",
      }}
    >
      {children}
    </button>
  );
}

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
        animation: "mh-spin 0.7s linear infinite",
      }}
    />
  );
}

function MarketingConfessionForm({ onSubmit, onDemo, onContextInput }) {
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
          onInput={(e) => onContextInput?.(e.target.value)}
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
        I&apos;ve let this person down before
      </label>

      <button
        type="button"
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
            loading || !canSubmit ? "none" : "mh-gradientShift 3s ease infinite",
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
          type="button"
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
          or run with demo data (Sarah&apos;s birthday) →
        </button>
      </div>
    </div>
  );
}

export function MarketingHome({
  onSummonKnight,
  onDemo,
  onContextInput,
  isAuthenticated = false,
  onLogin = () => {},
  onLogout = () => {},
  userEmail,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [progressPct, setProgressPct] = useState("0%");
  const [navVisible, setNavVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);
  const heroSectionRef = useRef(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-marketing-home", "1");
    el.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,700;1,900&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --ink: #0E0C08;
  --gold: #C9A84C;
  --gold-dim: #8B6F2E;
  --crimson: #B8312F;
  --parchment: #F2E9D8;
  --parchment-dim: #c8bba4;
}

@keyframes mh-slideUp {
  from { transform: translateY(110%); }
  to { transform: translateY(0); }
}

@keyframes mh-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes mh-badgeIn {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes mh-ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes mh-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes mh-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes mh-gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;
    document.head.appendChild(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY;
      const ih = window.innerHeight || 1;
      setScrolled(sy > 60);
      setNavVisible(sy > ih * 0.6);
      setHeroVisible(sy > ih * 0.5);
      setScrollProgress(Math.min(sy / (ih * 0.8), 1));
      const max = document.body.scrollHeight - ih;
      const pct = max > 0 ? (sy / max) * 100 : 0;
      setProgressPct(`${pct}%`);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  const scrollToConfess = () => {
    document
      .getElementById("confess-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const navLink = {
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--parchment-dim)",
    textDecoration: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 400,
  };

  const ghostBtn = {
    padding: "10px 20px",
    border: "1px solid rgba(201,168,76,0.35)",
    background: "transparent",
    color: "var(--gold)",
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    borderRadius: 2,
  };

  const primaryBtn = {
    padding: "12px 24px",
    border: "none",
    background: "var(--crimson)",
    color: "var(--parchment)",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: 2,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        color: "var(--parchment)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          width: progressPct,
          maxWidth: "100%",
          background: "linear-gradient(90deg, #C9A84C, #B8312F)",
          zIndex: 100,
          pointerEvents: "none",
        }}
      />

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: scrolled ? "16px 48px" : "24px 48px",
          background: scrolled ? "rgba(14,12,8,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(201,168,76,0.15)"
            : "1px solid transparent",
          opacity: navVisible ? 1 : 0,
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
          pointerEvents: navVisible ? "all" : "none",
          transition:
            "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), background 0.4s ease, padding 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease",
        }}
      >
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 22,
            color: "var(--gold)",
          }}
        >
          Sir Alibi
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <a href="#how" style={navLink}>
            How It Works
          </a>
          <a href="#examples" style={navLink}>
            Alibis
          </a>
          <a href="#vault" style={navLink}>
            The Vault
          </a>
          <a href="#pricing" style={navLink}>
            Pricing
          </a>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button type="button" style={ghostBtn}>
            Connect Wallet
          </button>
          <MagneticButton onClick={scrollToConfess} style={primaryBtn}>
            Summon Knight
          </MagneticButton>
          {isAuthenticated ? (
            <>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--parchment-dim)",
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={userEmail}
              >
                {userEmail || "Signed in"}
              </span>
              <button type="button" style={ghostBtn} onClick={onLogout}>
                Sign out
              </button>
            </>
          ) : (
            <button type="button" style={ghostBtn} onClick={onLogin}>
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* Section 1 — full viewport scene (knight visible behind) */}
      <section
        style={{
          height: "100vh",
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          background: "transparent",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 50% 60% at 50% 80%, rgba(201,168,76,0.06), transparent)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            textAlign: "center",
            transform: "translateY(-50%)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontWeight: 900,
              fontSize: "clamp(80px, 12vw, 160px)",
              color: "transparent",
              WebkitTextStroke: "2px rgba(201,168,76,0.8)",
              textShadow:
                "0 0 80px rgba(201,168,76,0.3), 0 0 160px rgba(201,168,76,0.15)",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1,
              opacity: 1 - scrollProgress * 1.2,
              transform: `translateY(${-scrollProgress * 60}px) scale(${1 - scrollProgress * 0.15})`,
            }}
          >
            Sir Alibi
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 14,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(201,168,76,0.4)",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              opacity: 1 - scrollProgress * 2,
            }}
          >
            Your knight in shining alibi
          </p>
        </div>
      </section>

      {/* Section 2 — hero text reveal */}
      <section
        ref={heroSectionRef}
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background: "transparent",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            minHeight: "100vh",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              width: "50%",
              height: "100vh",
              position: "relative",
              background: "transparent",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible
                ? "translateX(0) scale(1)"
                : "translateX(-60px) scale(0.92)",
              transition:
                "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1), transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
              transitionDelay: "0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 70% 80% at 50% 60%, rgba(14,12,8,0.45) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "15%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "280px",
                height: "40px",
                background:
                  "radial-gradient(ellipse, rgba(201,168,76,0.15) 0%, transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
              }}
            >
              <KnightHero />
            </div>
          </div>
          <div
            style={{
              width: "50%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: 48,
              background: "rgba(14,12,8,0.82)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderLeft: "1px solid rgba(201,168,76,0.1)",
              minHeight: "100vh",
              position: "relative",
              boxSizing: "border-box",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateX(0)" : "translateX(40px)",
              transition:
                "opacity 1s ease 0.4s, transform 1s cubic-bezier(0.22, 1, 0.36, 1) 0.4s",
            }}
          >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--gold)",
              opacity: 0.7,
              margin: "0 0 20px",
            }}
          >
            Est. 2024 — AI-Powered Absolution
          </p>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontWeight: 900,
              fontSize: "clamp(52px, 6vw, 84px)",
              lineHeight: 0.95,
              color: "var(--parchment)",
              margin: "0 0 32px",
            }}
          >
            {[
              { text: "Your Knight", color: "var(--parchment)", delay: "0.3s" },
              {
                text: "In Shining",
                color: "var(--gold)",
                delay: "0.5s",
              },
              { text: "Alibi.", color: "var(--gold)", delay: "0.7s" },
            ].map((line, i) => (
              <div
                key={i}
                style={{ overflow: "hidden", marginBottom: i < 2 ? 4 : 0 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    color: line.color,
                    animation: `mh-slideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${line.delay} both`,
                    animationPlayState: heroVisible ? "running" : "paused",
                  }}
                >
                  {line.text}
                </span>
              </div>
            ))}
          </h1>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: "var(--parchment-dim)",
              maxWidth: 360,
              margin: "0 0 40px",
              opacity: 0,
              animation: "mh-fadeIn 0.9s ease forwards",
              animationDelay: "1.2s",
            }}
          >
            Describe your social crime. Sir Alibi crafts the perfect excuse —
            then ships a real gift to the person you wronged.
          </p>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <MagneticButton
              onClick={scrollToConfess}
              style={{
                ...primaryBtn,
                padding: "14px 32px",
                textTransform: "none",
                fontSize: 13,
                letterSpacing: "0.02em",
              }}
            >
              Confess Your Crime
            </MagneticButton>
            <MagneticButton
              onClick={onDemo}
              style={{
                ...ghostBtn,
                padding: "14px 20px",
                fontSize: 12,
                textTransform: "none",
                letterSpacing: "0.02em",
              }}
            >
              or try demo →
            </MagneticButton>
          </div>

          <div
            style={{
              position: "absolute",
              right: 48,
              top: 80,
              border: "1px solid rgba(201,168,76,0.2)",
              padding: "12px 18px",
              background: "rgba(201,168,76,0.05)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              transform: "translateX(30px)",
              opacity: 0,
              animation: "mh-badgeIn 0.85s ease forwards",
              animationDelay: "1.6s",
            }}
          >
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 900,
                fontSize: 28,
                color: "var(--gold)",
                lineHeight: 1,
              }}
            >
              2,847
            </div>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--parchment-dim)",
                marginTop: 6,
              }}
            >
              Battles Fought
            </div>
          </div>
        </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: "1px solid rgba(201,168,76,0.1)",
            background: "rgba(14,12,8,0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "14px 0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              whiteSpace: "nowrap",
              animation: "mh-ticker 25s linear infinite",
            }}
          >
            {[...HERO_TICKER, ...HERO_TICKER].map((item, i) => (
              <span
                key={i}
                style={{
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--parchment-dim)",
                  padding: "0 40px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — confession form (inline) */}
      <section
        id="confess-section"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "80px 5% 80px 0",
          background: "transparent",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 480,
            maxWidth: "100%",
            background: "rgba(14,12,8,0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: 8,
            padding: 32,
          }}
        >
          <div style={{ marginBottom: 30 }}>
            <h2
              style={{
                fontSize: 36,
                fontWeight: 700,
                fontStyle: "italic",
                color: "var(--parchment)",
                marginBottom: 8,
                letterSpacing: "-0.5px",
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              Confess your crime.
            </h2>
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "var(--parchment-dim)",
                lineHeight: 1.65,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Tell the agent what happened. It handles everything else —
              autonomously.
            </p>
          </div>
          <MarketingConfessionForm
            onSubmit={onSummonKnight}
            onDemo={onDemo}
            onContextInput={onContextInput}
          />
        </div>
      </section>

      {/* Social proof */}
      <section
        style={{
          padding: "40px 48px",
          borderTop: "1px solid rgba(201,168,76,0.08)",
          borderBottom: "1px solid rgba(201,168,76,0.08)",
          background: "rgba(242,233,216,0.02)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            whiteSpace: "nowrap",
            animation: "mh-marquee 20s linear infinite",
          }}
        >
          {[...SOCIAL_TICKER, ...SOCIAL_TICKER].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: 18,
                color: "var(--parchment-dim)",
                paddingRight: 80,
                borderRight: "1px solid rgba(201,168,76,0.15)",
                flexShrink: 0,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ padding: "120px 48px", background: "#0E0C08" }}>
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "var(--gold)",
            opacity: 0.6,
            margin: "0 0 16px",
          }}
        >
          The Process
        </p>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "clamp(36px, 4vw, 56px)",
            lineHeight: 1.1,
            color: "var(--parchment)",
            margin: "0 0 64px",
          }}
        >
          Three steps. One absolution.
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            background: "rgba(201,168,76,0.08)",
          }}
        >
          {[
            {
              n: "01",
              title: "Describe your crime",
              body: "Forgot the anniversary. Ghosted the group chat. No judgement — we have heard worse.",
              icon: (
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C9A84C"
                  strokeWidth={1.5}
                >
                  <path d="M4 6h16M4 12h10M4 18h14" />
                </svg>
              ),
            },
            {
              n: "02",
              title: "Sir Alibi crafts your excuse",
              body: "Our AI generates a personalised, legally-plausible alibi. Customised to your exact relationship.",
              icon: (
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C9A84C"
                  strokeWidth={1.5}
                >
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                </svg>
              ),
            },
            {
              n: "03",
              title: "Gift ships within hours",
              body: "A curated premium gift chosen for the occasion arrives before they finish being angry.",
              icon: (
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C9A84C"
                  strokeWidth={1.5}
                >
                  <rect x="3" y="8" width="18" height="12" rx="1" />
                  <path d="M3 10h18M12 8V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
                </svg>
              ),
            },
          ].map((panel) => (
            <div
              key={panel.n}
              style={{
                flex: 1,
                padding: "56px 48px",
                background: "#0E0C08",
                position: "relative",
                transition: "background 0.35s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(201,168,76,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0E0C08";
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 24,
                  right: 32,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 900,
                  fontSize: 80,
                  color: "rgba(201,168,76,0.07)",
                  lineHeight: 1,
                }}
              >
                {panel.n}
              </span>
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 32,
                }}
              >
                {panel.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: 26,
                  color: "var(--parchment)",
                  margin: "0 0 16px",
                }}
              >
                {panel.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: "var(--parchment-dim)",
                  margin: 0,
                }}
              >
                {panel.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Alibi examples */}
      <section
        id="examples"
        style={{
          padding: "120px 48px",
          background: "linear-gradient(180deg, #0E0C08 0%, #1a0a0a 100%)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "var(--gold)",
            opacity: 0.6,
            margin: "0 0 16px",
          }}
        >
          Recent Battles
        </p>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "clamp(32px, 4vw, 48px)",
            color: "var(--parchment)",
            margin: "0 0 48px",
          }}
        >
          Alibis forged in this very hall.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: "rgba(184,49,47,0.08)",
          }}
        >
          {[
            {
              tag: "Forgotten Birthday",
              title: "I missed her birthday — we had been together 4 years",
              quote:
                "My dearest — I was consumed ensuring the gift I commissioned would be worthy of you. The courier failed me not you. It arrives tomorrow.",
            },
            {
              tag: "Ghosted Plans",
              title: "I cancelled on my best friend for the fourth time",
              quote:
                "I know this pattern has worn you down. I have been dealing with something I was not ready to name. A gift is on its way as a promise not a patch.",
            },
            {
              tag: "Anniversary Disaster",
              title: "I showed up to our anniversary dinner an hour late",
              quote:
                "I was collecting the surprise I arranged for tonight which went catastrophically wrong. What arrives tomorrow will explain everything.",
            },
          ].map((card) => (
            <div
              key={card.tag}
              style={{
                padding: 48,
                background: "#0E0C08",
                border: "1px solid transparent",
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.35s, background 0.35s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  "rgba(201,168,76,0.15)";
                e.currentTarget.style.background = "#0f0d09";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.background = "#0E0C08";
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#B8312F",
                  marginBottom: 20,
                }}
              >
                {card.tag}
              </div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: 22,
                  color: "var(--parchment)",
                  lineHeight: 1.3,
                  margin: "0 0 24px",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.8,
                  fontStyle: "italic",
                  borderLeft: "2px solid rgba(201,168,76,0.3)",
                  paddingLeft: 16,
                  color: "var(--parchment-dim)",
                  margin: 0,
                }}
              >
                {card.quote}
              </p>
              <div
                style={{
                  position: "absolute",
                  bottom: 32,
                  right: 32,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "1px solid rgba(201,168,76,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                ⚔
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        style={{
          padding: "120px 48px",
          background: "#0E0C08",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "var(--gold)",
            opacity: 0.6,
            margin: "0 0 16px",
          }}
        >
          The Tiers of Honour
        </p>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "clamp(32px, 4vw, 52px)",
            color: "var(--parchment)",
            margin: 0,
          }}
        >
          Choose your rank. Own your redemption.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: "rgba(201,168,76,0.08)",
            marginTop: 64,
          }}
        >
          {[
            {
              name: "Squire",
              price: "£0",
              sub: "/mo",
              desc: "For the occasional slip-up you need to paper over.",
              features: [
                "3 alibis per month",
                "Standard gift curation",
                "Email alibi delivery",
                "Basic alibi styles",
              ],
              primary: false,
            },
            {
              name: "Knight",
              price: "£12",
              sub: "/mo",
              desc: "Full armour. Unlimited excuses. Premium gifts.",
              features: [
                "Unlimited alibis",
                "Premium gift vault access",
                "Same-day gift dispatch",
                "Alibi NFT certificate",
                "Relationship analytics",
              ],
              primary: true,
              badge: "Most Chosen",
            },
            {
              name: "Sir",
              price: "£29",
              sub: "/mo",
              desc: "White-glove treatment for high-stakes forgiveness.",
              features: [
                "Everything in Knight",
                "Concierge gift selection",
                "Priority AI processing",
                "White-glove delivery",
              ],
              primary: false,
            },
          ].map((tier, idx) => (
            <div
              key={tier.name}
              style={{
                padding: "56px 40px",
                background: tier.primary ? "#0f0c09" : "#0E0C08",
                border: tier.primary
                  ? "1px solid rgba(201,168,76,0.2)"
                  : "1px solid transparent",
                position: "relative",
              }}
            >
              {tier.badge ? (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#C9A84C",
                    color: "#0E0C08",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "4px 16px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {tier.badge}
                </div>
              ) : null}
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  color: "var(--gold)",
                  marginBottom: 20,
                  marginTop: tier.badge ? 12 : 0,
                }}
              >
                {tier.name}
              </div>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 900,
                  fontSize: 56,
                  color: "var(--parchment)",
                  lineHeight: 1,
                }}
              >
                {tier.price}
                <span
                  style={{
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "var(--parchment-dim)",
                    fontWeight: 400,
                  }}
                >
                  {tier.sub}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--parchment-dim)",
                  lineHeight: 1.7,
                  margin: "20px 0 32px",
                }}
              >
                {tier.desc}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {tier.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: 13,
                      color: "var(--parchment-dim)",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(201,168,76,0.06)",
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--gold)",
                        opacity: 0.4,
                        flexShrink: 0,
                      }}
                    >
                      —
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={scrollToConfess}
                style={{
                  width: "100%",
                  marginTop: 40,
                  padding: tier.primary ? 14 : 12,
                  background: tier.primary ? "#B8312F" : "transparent",
                  color: tier.primary
                    ? "var(--parchment)"
                    : "var(--gold)",
                  border: tier.primary
                    ? "none"
                    : "1px solid rgba(201,168,76,0.3)",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  borderRadius: 2,
                }}
              >
                {tier.primary ? "Choose Knight" : `Choose ${tier.name}`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section
        id="vault"
        style={{
          padding: "160px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          background: "#0E0C08",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(184,49,47,0.15), transparent)",
            pointerEvents: "none",
          }}
        />
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "var(--gold)",
            opacity: 0.6,
            margin: "0 0 24px",
            position: "relative",
            zIndex: 1,
          }}
        >
          The Final Summons
        </p>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "clamp(64px, 8vw, 120px)",
            lineHeight: 0.9,
            marginBottom: 48,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ color: "var(--parchment)" }}>Don&apos;t get caught</div>
          <div
            style={{
              WebkitTextStroke: "1px var(--parchment)",
              color: "transparent",
            }}
          >
            slipping.
          </div>
        </h2>
        <MagneticButton
          onClick={scrollToConfess}
          style={{
            ...primaryBtn,
            padding: "18px 48px",
            fontSize: 15,
            letterSpacing: "0.12em",
            position: "relative",
            zIndex: 1,
          }}
        >
          Summon Sir Alibi
        </MagneticButton>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "40px 48px",
          borderTop: "1px solid rgba(201,168,76,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0E0C08",
        }}
      >
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: 18,
            color: "var(--gold-dim)",
          }}
        >
          Sir Alibi
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          {["Privacy", "Terms", "Gift Policy", "Careers"].map((label) => (
            <a
              key={label}
              href="#"
              style={{
                fontSize: 12,
                letterSpacing: "0.08em",
                color: "var(--parchment-dim)",
                opacity: 0.5,
                textDecoration: "none",
              }}
            >
              {label}
            </a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "rgba(242,233,216,0.15)" }}>
          ⚔ MMXXIV
        </div>
      </footer>
    </div>
  );
}
