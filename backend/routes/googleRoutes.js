const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { googleTokensStore } = require("../controllers/googleController");

// Calendar OAuth: start — builds consent URL using the same redirect URI registered in Google Cloud
router.get("/google/auth", (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      // Must use the SAME redirect URI registered in Google Cloud Console
      process.env.GOOGLE_REDIRECT_URI,
    );
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state: "calendar",
    });
    res.redirect(url);
  } catch (err) {
    console.error("calendar googleAuthStart:", err);
    res.status(500).json({ ok: false, error: "Google OAuth not configured" });
  }
});

// Calendar OAuth: callback — shares the /api/auth/google/callback URI with Gmail,
// so this is only reached if the integration route doesn't handle it.
// The main callback is registered in integrationRoutes; we keep this as a fallback.
router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ ok: false, error: "Missing code" });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    const { tokens } = await oauth2Client.getToken(code);
    googleTokensStore.defaultUser = tokens;
    res.redirect("http://localhost:5173/?google_calendar_connected=1");
  } catch (err) {
    console.error("calendar callback error:", err);
    res.status(500).json({ ok: false, error: "Failed to complete Google auth" });
  }
});

module.exports = router;
