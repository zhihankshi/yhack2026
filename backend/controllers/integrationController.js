async function createEmailDraft(req, res) {
  try {
    const { failure_id, apology } = req.body;

    if (!failure_id || !apology || !apology.subject || !apology.body) {
      return res.status(400).json({
        ok: false,
        error: "Missing failure_id or apology fields",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("createEmailDraft error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to create email draft",
    });
  }
}

async function scheduleFollowup(req, res) {
  try {
    const { failure_id, followup, person_name } = req.body;

    if (
      !failure_id ||
      !followup ||
      !followup.followup_timing ||
      !followup.followup_message ||
      !followup.calendar_title ||
      !person_name
    ) {
      return res.status(400).json({
        ok: false,
        error: "Missing followup scheduling fields",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("scheduleFollowup error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to schedule follow-up",
    });
  }
}

module.exports = {
  createEmailDraft,
  scheduleFollowup,
};
