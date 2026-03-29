const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const googleRoutes = require("./routes/googleRoutes");
const agentRoutes = require("./routes/agentRoutes");
const integrationRoutes = require("./routes/integrationRoutes");

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "backend healthy" });
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** When DEMO_MODE=true, skip the real agent and stream canned SSE (same shape as live pipeline). */
app.post("/api/run-agent", async (req, res, next) => {
  if (process.env.DEMO_MODE !== "true") return next();

  try {
    const input = req.body;
    if (!input || !input.name || !input.relationship || !input.failure_type) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields",
      });
    }

    const GOLDEN_PATH_RESULT = {
      research: {
        inferred_interests: [
          "specialty coffee",
          "team lunches",
          "thoughtful gestures",
        ],
        communication_style: "professional but warm",
        sensitivity_level: "medium",
        research_complete: true,
      },
      damage_assessment: {
        severity: "high",
        recommended_tone: "warm",
        urgency: "within 24 hours",
        recovery_strategy:
          "Personal sincere message + meaningful gift + follow-up",
      },
      alibi: {
        narrative:
          "My grandmother had a health scare that week — I have been juggling family calls and back-to-back deadlines and completely lost track of the date. Every time I looked up from my desk another day had slipped by. That is not an excuse — I just wanted you to know it was not carelessness. You matter enough that I feel genuinely bad about this.",
        plausibility_score: 0.92,
        recommended_delivery:
          "warm and genuine, like you are telling her over coffee",
      },
      apology: {
        subject: "I owe you a proper apology — and a coffee",
        body: "Sarah,\n\nI have been meaning to write this since I realized what I missed.\n\nI had a family situation come up last week that pulled me completely out of my routine — I should have reached out the moment things settled down, and I did not. That is on me.\n\nMissing your birthday was not okay, and I have been busy does not cut it for someone I actually like having around. You deserve better than that.\n\nCan we find time this week? Coffee is absolutely on me — somewhere good, not the office stuff.",
        ps_line: "P.S. I am buying the good stuff. Non-negotiable.",
      },
      gift: {
        primary_recommendation:
          "Curated specialty coffee gift set — a premium bag from Onyx, Intelligentsia, or Trade Coffee with a handwritten note. Ships next-day, feels personal.",
        backup_recommendation:
          "Take her to lunch at a restaurant she has been wanting to try — make it about her, let her pick the place.",
        gesture_alternative:
          "Show up for the next thing that matters to her. No last-minute bail.",
        estimated_impact: "high",
        purchase_link:
          "https://www.etsy.com/search?q=specialty+coffee+gift+set",
        price_range: "$28-$48",
      },
      followup: {
        followup_timing: "5 days",
        followup_message:
          "Hey Sarah — just checking in properly. Hope the week has been a bit lighter. I meant everything I said.",
        calendar_title: "Check in with Sarah — make sure we are good",
        reminder_set: true,
      },
    };

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const sendEvent = (payload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const stepEvents = [
      { type: "agent_step", tool: "research_person", step_number: 1 },
      { type: "agent_step", tool: "assess_damage", step_number: 2 },
      { type: "agent_step", tool: "build_alibi_narrative", step_number: 3 },
      { type: "agent_step", tool: "draft_apology", step_number: 4 },
      { type: "agent_step", tool: "recommend_gift", step_number: 5 },
      { type: "agent_step", tool: "schedule_followup", step_number: 6 },
    ];

    for (const payload of stepEvents) {
      sendEvent(payload);
      await sleep(800);
    }

    sendEvent({
      type: "agent_complete",
      failure_id: "demo-001",
      result: GOLDEN_PATH_RESULT,
    });

    res.end();
  } catch (err) {
    console.error("DEMO_MODE run-agent error:", err);
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
});

app.use("/api", agentRoutes);
app.use("/api", integrationRoutes);
app.use("/api", googleRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
