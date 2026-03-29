const {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
} = require("../services/googleCalendarService");

const googleTokensStore = {};

async function googleAuthStart(req, res) {
  try {
    const url = getGoogleAuthUrl();
    res.redirect(url);
  } catch (error) {
    console.error("googleAuthStart error:", error);
    res.status(500).json({ ok: false, error: "Failed to start Google auth" });
  }
}

async function googleAuthCallback(req, res) {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).json({ ok: false, error: "Missing code" });
    }

    const tokens = await exchangeCodeForTokens(code);
    googleTokensStore.defaultUser = tokens;

    const frontendUrl = "http://localhost:5173";
    return res.redirect(`${frontendUrl}?google_calendar_connected=1`);
  } catch (error) {
    console.error("googleAuthCallback error:", error);
    res
      .status(500)
      .json({ ok: false, error: "Failed to complete Google auth" });
  }
}

module.exports = {
  googleAuthStart,
  googleAuthCallback,
  googleTokensStore,
};
