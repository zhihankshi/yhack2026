import { useState, useEffect, useRef } from "react";
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
          <MagneticButton onClick={onSummonKnight} style={primaryBtn}>
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
              onClick={onSummonKnight}
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
                onClick={onSummonKnight}
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
          onClick={onSummonKnight}
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
