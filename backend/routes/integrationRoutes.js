const express = require("express");
const router = express.Router();
const {
  googleAuthStart,
  googleAuthCallback,
  authStatus,
  createEmailDraft,
  scheduleFollowup,
} = require("../controllers/integrationController");

router.get("/auth/google/start", googleAuthStart);
router.get("/auth/google/callback", googleAuthCallback);
router.get("/auth/status", authStatus);

router.post("/send-apology-email", createEmailDraft);
router.post("/schedule-followup", scheduleFollowup);

module.exports = router;
