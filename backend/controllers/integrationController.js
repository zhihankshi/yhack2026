const {
  generateGoogleAuthUrl,
  exchangeCodeForTokens,
  isConnected,
  createDraftMessage,
} = require("../services/googleGmail");

const { createCalendarEvent } = require("../services/googleCalendarService");
const { googleTokensStore } = require("./googleController");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function googleAuthStart(req, res) {
  try {
    const url = generateGoogleAuthUrl();
    res.redirect(302, url);
  } catch (e) {
    console.error("googleAuthStart:", e);
    const hint =
      e instanceof Error ? e.message : "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in backend/.env";
    res.status(500).send(`Google OAuth is not configured.\n\n${hint}`);
  }
}

async function googleAuthCallback(req, res) {
  try {
    const code = req.query.code;
    const err = req.query.error;
    if (err) {
      const desc = String(req.query.error_description || "").replace(/\+/g, " ");
      if (err === "access_denied") {
        return res.status(403).type("html").send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Access denied</title></head>
<body style="font-family:system-ui,sans-serif;max-width:42rem;padding:2rem;line-height:1.5">
<h2>Google blocked this app (403 access_denied)</h2>
<p>Common fix while the app is in <strong>Testing</strong> on the OAuth consent screen:</p>
<ol>
<li>Open <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener">Google Cloud → APIs &amp; Services → OAuth consent screen</a>.</li>
<li>Under <strong>Test users</strong>, click <strong>Add users</strong> and add the <strong>exact Gmail address</strong> you use to sign in.</li>
<li>Save, wait a minute, then try <strong>Authorize</strong> again (same account).</li>
</ol>
<p>Also ensure <strong>Gmail API</strong> is enabled for this project, and you are not blocked by an org policy.</p>
<p style="color:#666;font-size:0.9rem">Technical: ${desc || err}</p>
</body></html>`);
      }
      return res
        .status(400)
        .send(`Google OAuth error: ${err} — ${desc}`);
    }
    if (!code || typeof code !== "string") {
      return res.status(400).send("Missing authorization code");
    }
    await exchangeCodeForTokens(code);

    return res.redirect("http://localhost:5173/?google_gmail_connected=1");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("googleAuthCallback:", msg, e);
    let hint = "";
    if (/invalid_client/i.test(msg)) {
      hint =
        "<p><strong>Client secret / client ID mismatch.</strong> Open <a href=\"https://console.cloud.google.com/apis/credentials\" target=\"_blank\" rel=\"noopener\">Google Cloud → APIs &amp; Services → Credentials</a>, select your <strong>OAuth 2.0 Client ID</strong> (type: Web application). Copy the <strong>Client ID</strong> and create a <strong>new Client secret</strong> if needed, then paste into <code>backend/.env</code> as <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> with no extra spaces or duplicate quotes. Both must be from the <em>same</em> OAuth client.</p>";
    } else if (/invalid_grant/i.test(msg) || /redirect/i.test(msg)) {
      hint =
        "<p><strong>Typical fixes:</strong> In Google Cloud → Credentials, the <strong>Authorized redirect URI</strong> must match <code>GOOGLE_REDIRECT_URI</code> exactly (including <code>http://</code> vs <code>https://</code>, and <code>localhost</code> vs <code>127.0.0.1</code>). Start OAuth from the same host you registered. Authorization codes are one-time — use a fresh visit to <code>/api/auth/google/start</code>.</p>";
    }
    res
      .status(500)
      .type("html")
      .send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Token exchange failed</title></head>
<body style="font-family:system-ui,sans-serif;max-width:44rem;padding:2rem;line-height:1.5">
<h2>Failed to connect Google</h2>
<p style="background:#f5f5f5;padding:12px;border-radius:8px;font-family:ui-monospace,monospace;font-size:0.9rem;word-break:break-word">${escapeHtml(msg)}</p>
${hint}
<p style="color:#666;font-size:0.9rem">Check the terminal where the backend runs for full logs.</p>
</body></html>`);
  }
}

function authStatus(req, res) {
  res.json({ ok: true, connected: isConnected() });
}

async function createEmailDraft(req, res) {
  try {
    const { to, subject, body, apology } = req.body || {};

    const subj = subject ?? apology?.subject;
    const text =
      body ??
      (apology
        ? [apology.body, apology.ps_line].filter(Boolean).join("\n\n")
        : undefined);

    if (!subj || !text) {
      return res.status(400).json({
        ok: false,
        error: "Missing subject and body (or apology with subject/body)",
      });
    }

    const out = await createDraftMessage({
      to: to?.trim?.() || undefined,
      subject: subj,
      body: text,
    });

    return res.status(200).json({
      ok: true,
      draftId: out.draftId,
      messageId: out.messageId,
    });
  } catch (error) {
    if (error.code === "NOT_AUTHENTICATED" || error.message === "NOT_AUTHENTICATED") {
      return res.status(401).json({ ok: false, error: "NOT_AUTHENTICATED" });
    }
    console.error("createEmailDraft error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to create email draft",
    });
  }
}

function buildFollowupEvent({ followup, person_name }) {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  start.setHours(12, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  return {
    summary: followup.calendar_title || "Follow up",
    description: followup.followup_message || "",
    start: {
      dateTime: start.toISOString(),
    },
    end: {
      dateTime: end.toISOString(),
    },
  };
}

async function scheduleFollowup(req, res) {
  try {
    const { failure_id, followup, person_name } = req.body;

    console.log("scheduleFollowup body:", JSON.stringify(req.body, null, 2));

    if (
      !failure_id ||
      !followup ||
      !followup.followup_timing ||
      !followup.followup_message ||
      !followup.calendar_title
    ) {
      return res.status(400).json({
        ok: false,
        error: "Missing followup scheduling fields",
      });
    }

    const tokens = googleTokensStore.defaultUser;

    if (!tokens) {
      return res.status(401).json({
        ok: false,
        error: "Google Calendar not connected",
      });
    }

    const event = buildFollowupEvent({ followup, person_name });
    const created = await createCalendarEvent(tokens, event);
    console.log("calendar event created:", created.id, created.htmlLink);

    return res.status(200).json({
      ok: true,
      eventId: created.id,
      htmlLink: created.htmlLink,
    });
  } catch (error) {
    console.error("scheduleFollowup error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to schedule follow-up",
    });
  }
}

module.exports = {
  googleAuthStart,
  googleAuthCallback,
  authStatus,
  createEmailDraft,
  scheduleFollowup,
};
