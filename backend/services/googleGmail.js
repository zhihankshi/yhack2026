const { google } = require("googleapis");

/** Single demo-user token bag (hackathon — no DB). */
let storedCredentials = null;

const GOOGLE_ENV_KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
];

/** Trim and strip accidental wrapping quotes from .env lines. */
function envClean(key) {
  let s = String(process.env[key] ?? "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function assertGoogleEnv() {
  const missing = GOOGLE_ENV_KEYS.filter((k) => !envClean(k));
  if (missing.length) {
    throw new Error(
      `Missing env: ${missing.join(", ")}. Example GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback`,
    );
  }
}

function createOAuth2Client() {
  assertGoogleEnv();
  return new google.auth.OAuth2(
    envClean("GOOGLE_CLIENT_ID"),
    envClean("GOOGLE_CLIENT_SECRET"),
    envClean("GOOGLE_REDIRECT_URI"),
  );
}

function generateGoogleAuthUrl() {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.compose"],
  });
}

function formatGoogleOAuthError(e) {
  const data = e?.response?.data;
  if (data && typeof data === "object") {
    const err = data.error;
    const desc = data.error_description || data.error_uri || "";
    if (err || desc) {
      return `${err || "oauth_error"}: ${String(desc).replace(/\+/g, " ")}`.trim();
    }
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

async function exchangeCodeForTokens(code) {
  const oauth2Client = createOAuth2Client();
  const redirectUri = envClean("GOOGLE_REDIRECT_URI");
  const authCode = typeof code === "string" ? code.trim() : code;
  try {
    const { tokens } = await oauth2Client.getToken({
      code: authCode,
      redirect_uri: redirectUri,
    });
    if (!tokens?.access_token) {
      throw new Error("Google token response had no access_token");
    }
    storedCredentials = tokens;
    return tokens;
  } catch (e) {
    const detail = formatGoogleOAuthError(e);
    console.error("exchangeCodeForTokens:", detail, e?.response?.data || e);
    throw new Error(detail);
  }
}

function isConnected() {
  return !!(storedCredentials && storedCredentials.access_token);
}

function getAuthorizedClient() {
  if (!isConnected()) return null;
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(storedCredentials);
  return oauth2Client;
}

/**
 * RFC 2822 message, base64url for Gmail API.
 * @param {{ to: string, subject: string, body: string }} opts
 */
function encodeRawMessage({ to, subject, body }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    body.replace(/\r?\n/g, "\r\n"),
  ];
  const str = lines.join("\r\n");
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * @param {{ to?: string, subject: string, body: string }} opts
 * If `to` is omitted, drafts to the authenticated account's address.
 */
async function createDraftMessage(opts) {
  const auth = getAuthorizedClient();
  if (!auth) {
    const err = new Error("NOT_AUTHENTICATED");
    err.code = "NOT_AUTHENTICATED";
    throw err;
  }

  const gmail = google.gmail({ version: "v1", auth });

  let to = opts.to?.trim();
  if (!to) {
    const profile = await gmail.users.getProfile({ userId: "me" });
    to = profile.data.emailAddress;
    if (!to) {
      throw new Error("Could not resolve recipient email");
    }
  }

  const raw = encodeRawMessage({
    to,
    subject: opts.subject,
    body: opts.body,
  });

  const created = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: { raw },
    },
  });

  return {
    draftId: created.data.id,
    messageId: created.data.message?.id ?? null,
  };
}

/** For tests / hot reload — not normally needed. */
function _clearStoredCredentialsForTests() {
  storedCredentials = null;
}

module.exports = {
  generateGoogleAuthUrl,
  exchangeCodeForTokens,
  isConnected,
  createDraftMessage,
  _clearStoredCredentialsForTests,
};
