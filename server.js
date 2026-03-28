// PERSON 2 — Integrations & Backend
// server.js — Express backend wiring agent to real-world actions
// Run with: node server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { runAlibiAgent } = require("./agent");

const app = express();
app.use(cors());
app.use(express.json());

// ─── MongoDB Setup ────────────────────────────────────────────────────────────
// Stores: user sessions, past failures, repair status tracking

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "alibi_db";
let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("✅ MongoDB connected");
}

// Collections:
// - failures: each alibi request + outcome
// - relationships: repair status per person
// - followups: scheduled follow-up reminders

// ─── Auth0 Middleware ─────────────────────────────────────────────────────────
// Validates JWT from Auth0 on protected routes
// Person 2 sets up Auth0 app at manage.auth0.com
// Gets DOMAIN and CLIENT_ID, puts in .env

const { auth } = require("express-oauth2-jwt-bearer");

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  tokenSigningAlg: "RS256",
});

// Helper to get user ID from JWT
function getUserId(req) {
  return req.auth?.payload?.sub || "anonymous";
}

// ─── Core Route: Run the Agent ────────────────────────────────────────────────
// This is the main endpoint — kicks off the agentic loop
// Person 1's agent.js is called here

app.post("/api/run-agent", checkJwt, async (req, res) => {
  const userId = getUserId(req);
  const input = req.body;

  // Validate required fields
  if (!input.name || !input.relationship || !input.failure_type) {
    return res.status(400).json({ error: "name, relationship, and failure_type are required" });
  }

  // Set up SSE for real-time step streaming to frontend
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent({ type: "agent_start", message: "Agent initializing..." });

    // Run the agent with step callback for real-time updates
    const result = await runAlibiAgent(input, (step) => {
      sendEvent({ type: "agent_step", ...step });
    });

    // Save to MongoDB
    const failureDoc = {
      userId,
      input,
      result,
      repair_status: "pending",
      apology_sent: false,
      gift_sent: false,
      followup_sent: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const { insertedId } = await db.collection("failures").insertOne(failureDoc);

    // Upsert relationship repair tracking
    await db.collection("relationships").updateOne(
      { userId, name: input.name, relationship: input.relationship },
      {
        $set: {
          last_failure: input.failure_type,
          last_failure_date: new Date(),
          repair_status: "in_progress",
          severity: result.damage_assessment?.severity,
          updated_at: new Date(),
        },
        $inc: { total_failures: 1 },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true }
    );

    sendEvent({
      type: "agent_complete",
      failure_id: insertedId.toString(),
      result,
    });

    res.end();
  } catch (err) {
    console.error("Agent error:", err);
    sendEvent({ type: "agent_error", message: err.message });
    res.end();
  }
});

// ─── Gmail Integration via MCP ────────────────────────────────────────────────
// Calls Claude API with Gmail MCP to draft + queue email
// Person 2 wires this to the agent's apology output

app.post("/api/send-apology-email", checkJwt, async (req, res) => {
  const { failure_id, apology } = req.body;
  const userId = getUserId(req);

  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic();

    // Use Gmail MCP to draft the email
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      mcp_servers: [
        {
          type: "url",
          url: "https://gmail.mcp.claude.com/mcp",
          name: "gmail-mcp",
        },
      ],
      messages: [
        {
          role: "user",
          content: `Draft an email with subject "${apology.subject}" and body: "${apology.body}\n\n${apology.ps_line}". Save it as a draft, do not send.`,
        },
      ],
    });

    // Mark as sent in MongoDB
    await db.collection("failures").updateOne(
      { _id: require("mongodb").ObjectId(failure_id), userId },
      { $set: { apology_sent: true, apology_sent_at: new Date() } }
    );

    res.json({ success: true, message: "Email drafted in Gmail" });
  } catch (err) {
    console.error("Gmail MCP error:", err);
    res.status(500).json({ error: "Failed to draft email", details: err.message });
  }
});

// ─── Google Calendar Integration via MCP ─────────────────────────────────────
// Schedules the follow-up reminder in user's calendar

app.post("/api/schedule-followup", checkJwt, async (req, res) => {
  const { failure_id, followup, person_name } = req.body;
  const userId = getUserId(req);

  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic();

    // Calculate follow-up date based on agent recommendation
    const daysMap = { "3 days": 3, "5 days": 5, "1 week": 7, "2 weeks": 14 };
    const days = daysMap[followup.followup_timing] || 7;
    const followupDate = new Date();
    followupDate.setDate(followupDate.getDate() + days);
    const dateStr = followupDate.toISOString().split("T")[0];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      mcp_servers: [
        {
          type: "url",
          url: "https://gcal.mcp.claude.com/mcp",
          name: "gcal-mcp",
        },
      ],
      messages: [
        {
          role: "user",
          content: `Create a calendar event titled "${followup.calendar_title}" on ${dateStr} at 10:00 AM for 15 minutes. Description: "${followup.followup_message}"`,
        },
      ],
    });

    // Mark followup scheduled in MongoDB
    await db.collection("failures").updateOne(
      { _id: require("mongodb").ObjectId(failure_id), userId },
      {
        $set: {
          followup_scheduled: true,
          followup_date: followupDate,
          updated_at: new Date(),
        },
      }
    );

    // Add to followups collection for tracking
    await db.collection("followups").insertOne({
      userId,
      failure_id,
      person_name,
      scheduled_date: followupDate,
      message: followup.followup_message,
      completed: false,
      created_at: new Date(),
    });

    res.json({ success: true, scheduled_date: followupDate });
  } catch (err) {
    console.error("GCal MCP error:", err);
    res.status(500).json({ error: "Failed to schedule followup", details: err.message });
  }
});

// ─── History Routes ───────────────────────────────────────────────────────────
// Fetch past failures and repair statuses for the dashboard

app.get("/api/failures", checkJwt, async (req, res) => {
  const userId = getUserId(req);
  try {
    const failures = await db
      .collection("failures")
      .find({ userId })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();
    res.json(failures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/relationships", checkJwt, async (req, res) => {
  const userId = getUserId(req);
  try {
    const relationships = await db
      .collection("relationships")
      .find({ userId })
      .sort({ updated_at: -1 })
      .toArray();
    res.json(relationships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update repair status (did the apology work?)
app.patch("/api/failures/:id/status", checkJwt, async (req, res) => {
  const userId = getUserId(req);
  const { repair_status } = req.body; // "resolved" | "pending" | "failed"
  try {
    await db.collection("failures").updateOne(
      { _id: require("mongodb").ObjectId(req.params.id), userId },
      { $set: { repair_status, updated_at: new Date() } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", service: "alibi-backend" }));

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Alibi backend running on port ${PORT}`));
});
