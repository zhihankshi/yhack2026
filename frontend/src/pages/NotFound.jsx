import { Link } from "react-router-dom";
import { T } from "../lib/tokens.js";

/** Custom 404 — knight confused, sword stuck */
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>🛡️</div>
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.25em",
          color: T.crimson,
          fontFamily: T.fontBody,
          marginBottom: 12,
        }}
      >
        404 — WRONG QUEST
      </div>
      <h1
        style={{
          fontFamily: T.fontDisplay,
          fontStyle: "italic",
          fontWeight: 900,
          fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
          color: T.parchment,
          margin: "0 0 12px",
        }}
      >
        The sword&apos;s stuck. So are you.
      </h1>
      <p
        style={{
          maxWidth: 420,
          color: T.parchmentDim,
          fontFamily: T.fontBody,
          fontSize: 15,
          lineHeight: 1.65,
          marginBottom: 28,
        }}
      >
        This page doesn&apos;t exist — unlike your excuse, which we can still
        polish.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-block",
          padding: "12px 28px",
          background: T.crimson,
          color: T.bg,
          fontWeight: 700,
          fontFamily: T.fontBody,
          textDecoration: "none",
          borderRadius: T.radiusFull,
        }}
      >
        Ride home
      </Link>
    </div>
  );
}
