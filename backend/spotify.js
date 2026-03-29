const LAVA_API_BASE =
  process.env.LAVA_API_URL?.trim() || "https://gateway.lavaai.dev/v1";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const DEFAULT_LAVA_MODEL = process.env.MODEL_FAST || "gpt-4o-mini";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function parseJsonResponse(response, label) {
  const text = await response.text();
  let json = {};

  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw new Error(`${label} failed (${response.status}): ${text}`);
    }
    throw new Error(`${label} returned invalid JSON`);
  }

  if (!response.ok) {
    const message =
      json?.error?.message ||
      json?.error_description ||
      json?.message ||
      text ||
      `${label} failed`;
    throw new Error(`${label} failed (${response.status}): ${message}`);
  }

  return json;
}

function extractLavaText(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  throw new Error("Lava returned no text content");
}

function parseSongJsonArray(raw) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  const parsed = JSON.parse(jsonText);

  if (!Array.isArray(parsed)) {
    throw new Error("Song response was not a JSON array");
  }

  return parsed;
}

async function getSpotifyAccessToken() {
  const clientId = requireEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requireEnv("SPOTIFY_CLIENT_SECRET");
  const refreshToken = requireEnv("SPOTIFY_REFRESH_TOKEN");

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  const data = await parseJsonResponse(response, "Spotify token refresh");
  if (!data.access_token) {
    throw new Error("Spotify token refresh returned no access token");
  }

  console.log("Spotify token scopes:", data.scope || "(none returned)");

  return data.access_token;
}

async function spotifyFetch(path, accessToken, options = {}) {
  const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  return parseJsonResponse(response, `Spotify request ${path}`);
}

async function searchSpotifyTrack(songName, artist, accessToken) {
  const query = encodeURIComponent(`track:${songName} artist:${artist}`);
  const data = await spotifyFetch(
    `/search?q=${query}&type=track&limit=1`,
    accessToken,
  );

  return data?.tracks?.items?.[0] || null;
}

async function getSpotifyMe(accessToken) {
  return spotifyFetch("/me", accessToken);
}

async function createSpotifyPlaylist(name, description, accessToken) {
  return spotifyFetch("/me/playlists", accessToken, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  });
}

async function waitForPlaylistReady(playlistId, accessToken, expectedOwnerId) {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const playlist = await spotifyFetch(`/playlists/${playlistId}`, accessToken);
      const ownerId = playlist?.owner?.id || "(unknown)";
      console.log(
        "Playlist ready check:",
        JSON.stringify({
          playlistId,
          ownerId,
          collaborative: !!playlist?.collaborative,
          public: playlist?.public,
          snapshotId: playlist?.snapshot_id || null,
        }),
      );

      if (!expectedOwnerId || ownerId === expectedOwnerId) {
        return playlist;
      }
    } catch (error) {
      console.warn(
        `Playlist readiness check failed on attempt ${attempt}/${maxAttempts}:`,
        error.message,
      );
    }

    await sleep(attempt * 500);
  }

  throw new Error(
    `Playlist ${playlistId} was created but was not readable for the expected owner before adding tracks`,
  );
}

async function addTracksToSpotifyPlaylist(playlistId, uris, accessToken) {
  const trackUris = uris;
  console.log("Adding tracks to playlist:", playlistId);
  console.log("Track URIs:", JSON.stringify(trackUris));

  if (!Array.isArray(trackUris) || !trackUris.length) {
    throw new Error("No Spotify track URIs available to add");
  }

  const maxAttempts = 4;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: trackUris }),
      },
    );

    if (response.ok) {
      return parseJsonResponse(
        response,
        `Spotify request /playlists/${playlistId}/items`,
      );
    }

    const bodyText = await response.text();
    lastError = new Error(
      `Spotify request /playlists/${playlistId}/items failed (${response.status}): ${bodyText}`,
    );

    const shouldRetry = [403, 404, 429, 500, 502, 503, 504].includes(
      response.status,
    );

    if (!shouldRetry || attempt === maxAttempts) {
      throw lastError;
    }

    const delayMs = attempt * 1000;
    console.warn(
      `Retrying add tracks after Spotify ${response.status} (attempt ${attempt}/${maxAttempts}) in ${delayMs}ms`,
    );
    await sleep(delayMs);
  }

  throw lastError;
}

async function pickSongsWithClaude({
  victimName,
  relationship,
  failureType,
  additionalContext,
}) {
  const lavaApiKey = requireEnv("LAVA_API_KEY");
  const prompt = [
    "You are curating a six-song Spotify apology playlist.",
    "Return only valid JSON.",
    'Output format: [{"songName":"...", "artist":"..."}]',
    "Choose exactly 6 real, well-known songs that fit a heartfelt apology, reconciliation, and sincere 'I'm sorry' mood.",
    "Avoid joke songs, duplicates, live versions, and obscure deep cuts.",
    `Victim name: ${victimName || "Unknown"}`,
    `Relationship: ${relationship || "Unknown"}`,
    `Failure type: ${failureType || "Unknown"}`,
    `Additional context: ${additionalContext || "None"}`,
  ].join("\n");

  const response = await fetch(`${LAVA_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lavaApiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_LAVA_MODEL,
      max_tokens: 400,
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are a precise music curator. Always return strict JSON with no markdown or extra commentary.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await parseJsonResponse(response, "Lava song selection");
  const songs = parseSongJsonArray(extractLavaText(data))
    .map((entry) => ({
      songName: String(entry?.songName || "").trim(),
      artist: String(entry?.artist || "").trim(),
    }))
    .filter((entry) => entry.songName && entry.artist)
    .slice(0, 6);

  if (songs.length < 1) {
    throw new Error("Lava did not return any valid songs");
  }

  return songs;
}

async function createPersonalizedPlaylist(input) {
  const accessToken = await getSpotifyAccessToken();
  const songs = await pickSongsWithClaude(input);
  const me = await getSpotifyMe(accessToken);

  const resolvedTracks = [];

  for (const song of songs) {
    const track = await searchSpotifyTrack(song.songName, song.artist, accessToken);
    if (!track?.uri) continue;

    resolvedTracks.push({
      uri: track.uri,
      name: track.name,
      artist: track.artists?.map((artist) => artist.name).join(", ") || song.artist,
      albumArt: track.album?.images?.[0]?.url || null,
    });
  }

  if (!resolvedTracks.length) {
    throw new Error("Could not find any matching Spotify tracks");
  }

  const playlistName = `For ${input.victimName} — with love 🎵`;
  const playlistDescription = `A heartfelt apology soundtrack for ${input.victimName}.`;
  console.log("Access token first 10 chars:", accessToken.slice(0, 10));
  const playlist = await createSpotifyPlaylist(
    playlistName,
    playlistDescription,
    accessToken,
  );
  console.log(
    "Created playlist:",
    JSON.stringify({
      playlistId: playlist.id,
      ownerId: playlist?.owner?.id || "(missing)",
      meId: me?.id || "(missing)",
      collaborative: !!playlist?.collaborative,
      public: playlist?.public,
    }),
  );

  await sleep(1000);
  await waitForPlaylistReady(playlist.id, accessToken, me?.id);

  console.log("Access token first 10 chars:", accessToken.slice(0, 10));
  await addTracksToSpotifyPlaylist(
    playlist.id,
    resolvedTracks.map((track) => track.uri),
    accessToken,
  );

  return {
    playlistId: playlist.id,
    playlistUrl: playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`,
    embedUrl: `https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator`,
    tracks: resolvedTracks.map(({ name, artist, albumArt }) => ({
      name,
      artist,
      albumArt,
    })),
  };
}

module.exports = {
  createPersonalizedPlaylist,
  getSpotifyAccessToken,
};
