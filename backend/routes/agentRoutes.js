const express = require("express");
const router = express.Router();
const { runAgent, createPlaylist } = require("../controllers/agentController");

router.post("/run-agent", runAgent);
router.post("/create-playlist", createPlaylist);

module.exports = router;
