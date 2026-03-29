const { runAlibiAgent } = require("../services/runService");
const { createPersonalizedPlaylist } = require("../spotify");

async function runAgent(req, res) {
  try {
    const input = req.body;

    if (!input || !input.name || !input.relationship || !input.failure_type) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields",
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const sendEvent = (payload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const result = await runAlibiAgent(input);

    sendEvent({
      type: "agent_complete",
      failure_id: result.failure_id,
      result: result.result,
    });

    res.end();
  } catch (error) {
    console.error("runAgent error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        ok: false,
        error: "Failed to run agent",
      });
    }

    res.write(
      `data: ${JSON.stringify({
        type: "agent_error",
        message: "Failed to run agent",
      })}\n\n`,
    );
    res.end();
  }
}

async function createPlaylist(req, res) {
  try {
    const { victimName, relationship, failureType, additionalContext } =
      req.body || {};

    if (!victimName || !relationship || !failureType) {
      return res.status(400).json({
        ok: false,
        error: "Missing required playlist fields",
      });
    }

    const playlist = await createPersonalizedPlaylist({
      victimName,
      relationship,
      failureType,
      additionalContext,
    });

    return res.json(playlist);
  } catch (error) {
    console.error("createPlaylist error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Failed to create playlist",
    });
  }
}

module.exports = { runAgent, createPlaylist };
