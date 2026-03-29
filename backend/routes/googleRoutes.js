const express = require("express");
const router = express.Router();
const {
  googleAuthStart,
  googleAuthCallback,
} = require("../controllers/googleController");

router.get("/google/auth", googleAuthStart);
router.get("/google/callback", googleAuthCallback);

module.exports = router;
