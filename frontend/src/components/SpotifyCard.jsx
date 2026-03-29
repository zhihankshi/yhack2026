import { useState } from "react";
import { T } from "../lib/tokens.js";
import { Spinner } from "./Spinner.jsx";

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

function ActionBtn({ onClick, disabled, color, children }) {
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

export default function SpotifyCard({
  victimName,
  relationship,
  failureType,
  additionalContext,
  apiUrl,
}) {
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState(null);

  const generatePlaylist = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/create-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          victimName,
          relationship,
          failureType,
          additionalContext,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not create playlist");
      }

      setPlaylist(data);
    } catch (err) {
      setError(err.message || "Could not create playlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardWrap("#1DB954")}>
      <CardHead
        icon="🎵"
        title={`Soundtrack for ${victimName || "them"}`}
        color="#1DB954"
      >
        <ActionBtn
          onClick={generatePlaylist}
          disabled={loading}
          color="#1DB954"
        >
          {loading ? (
            <>
              <Spinner size={11} color="#1DB954" /> Generating…
            </>
          ) : playlist ? (
            "Regenerate Playlist"
          ) : (
            "Generate Playlist"
          )}
        </ActionBtn>
      </CardHead>

      {error && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 12px",
            background: T.crimsonLight,
            border: `1px solid ${T.crimsonBorder}`,
            borderRadius: T.radiusSm,
            color: T.crimson,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: T.fontBody,
          }}
        >
          {error}
        </div>
      )}

      {!playlist && !loading && !error && (
        <p
          style={{
            margin: 0,
            color: T.parchmentDim,
            fontSize: 13,
            lineHeight: 1.7,
            fontFamily: T.fontBody,
          }}
        >
          Generate a six-song apology soundtrack with heartfelt, reconciliation
          energy for {victimName || "them"}.
        </p>
      )}

      {playlist && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <iframe
            src={playlist.embedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: 12 }}
          />

          <a
            href={playlist.playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#1DB954",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: T.fontBody,
            }}
          >
            Open in Spotify →
          </a>
        </div>
      )}
    </div>
  );
}
