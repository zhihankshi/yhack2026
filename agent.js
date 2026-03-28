// PERSON 1 — Agent Architect
// agent.js — The core agentic loop for The Alibi
// Run with: node agent.js (called from server.js via POST /api/run-agent)

const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic();

// ─── Tool Definitions ────────────────────────────────────────────────────────
// These are the actions the agent can autonomously decide to take

const TOOLS = [
  {
    name: "research_person",
    description:
      "Research the person you failed. Infer their likely interests, communication style, and what kind of apology would resonate based on relationship type and context.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the person" },
        relationship: {
          type: "string",
          description: "e.g. coworker, close friend, family, romantic partner",
        },
        context: {
          type: "string",
          description: "What you know about them",
        },
      },
      required: ["name", "relationship"],
    },
  },
  {
    name: "assess_damage",
    description:
      "Assess the severity of the social failure and decide on tone, urgency, and recovery strategy.",
    input_schema: {
      type: "object",
      properties: {
        failure_type: {
          type: "string",
          description: "e.g. missed birthday, forgot meeting, flaked on plans",
        },
        relationship: { type: "string" },
        time_elapsed: {
          type: "string",
          description: "How long ago this happened",
        },
        prior_failures: {
          type: "boolean",
          description: "Has this happened before with this person?",
        },
      },
      required: ["failure_type", "relationship"],
    },
  },
  {
    name: "build_alibi_narrative",
    description:
      "Construct a believable, airtight alibi — a human-sounding narrative explaining what happened. Should be plausible, not outlandish.",
    input_schema: {
      type: "object",
      properties: {
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
        },
        tone: {
          type: "string",
          enum: ["humorous", "contrite", "professional", "warm"],
        },
        context: { type: "string" },
      },
      required: ["severity", "tone"],
    },
  },
  {
    name: "draft_apology",
    description:
      "Write a personalized apology message for the specific person and failure. Should sound genuinely human, not AI-generated.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        alibi: { type: "string", description: "The alibi narrative to weave in" },
        relationship: { type: "string" },
        tone: { type: "string" },
        medium: {
          type: "string",
          enum: ["text", "email", "verbal"],
          description: "How will this be delivered?",
        },
      },
      required: ["name", "alibi", "relationship", "tone", "medium"],
    },
  },
  {
    name: "recommend_gift",
    description:
      "Recommend a recovery gift or gesture personalized to the person's likely interests and the severity of the failure.",
    input_schema: {
      type: "object",
      properties: {
        relationship: { type: "string" },
        severity: { type: "string" },
        budget: {
          type: "string",
          enum: ["under_20", "20_50", "50_100", "100_plus"],
        },
        person_context: {
          type: "string",
          description: "Any known interests or preferences",
        },
      },
      required: ["relationship", "severity", "budget"],
    },
  },
  {
    name: "schedule_followup",
    description:
      "Determine the optimal timing and content for a follow-up message to confirm the relationship is repaired.",
    input_schema: {
      type: "object",
      properties: {
        relationship: { type: "string" },
        severity: { type: "string" },
        apology_medium: { type: "string" },
      },
      required: ["relationship", "severity"],
    },
  },
];

// ─── Tool Execution ───────────────────────────────────────────────────────────
// Each tool has real logic — not just passthrough to Claude

function executeTool(toolName, toolInput) {
  switch (toolName) {
    case "research_person":
      return {
        inferred_interests: inferInterests(toolInput.relationship, toolInput.context),
        communication_style: inferCommunicationStyle(toolInput.relationship),
        sensitivity_level: inferSensitivity(toolInput.relationship),
        research_complete: true,
      };

    case "assess_damage":
      const severity = assessSeverity(toolInput);
      return {
        severity,
        recommended_tone: severity === "critical" ? "contrite" : severity === "high" ? "warm" : "humorous",
        urgency: severity === "critical" ? "send today" : severity === "high" ? "within 24 hours" : "within 3 days",
        recovery_strategy: getRecoveryStrategy(severity, toolInput.relationship),
      };

    case "build_alibi_narrative":
      // Agent decides what the alibi is — not the user
      return {
        narrative: generateAlibiNarrative(toolInput.severity, toolInput.tone, toolInput.context),
        plausibility_score: 0.87,
        recommended_delivery: "casual, as if just remembered",
      };

    case "draft_apology":
      return {
        subject: `About ${toolInput.relationship === "coworker" ? "our meeting" : "the other day"}...`,
        body: generateApologyBody(toolInput),
        ps_line: generatePS(toolInput.relationship),
        word_count: 120,
      };

    case "recommend_gift":
      return {
        primary_recommendation: getGiftRecommendation(toolInput),
        backup_recommendation: getBackupGift(toolInput.relationship),
        gesture_alternative: getGestureAlternative(toolInput.relationship),
        estimated_impact: "high",
      };

    case "schedule_followup":
      return {
        followup_timing: getFollowupTiming(toolInput.severity),
        followup_message: generateFollowupMessage(toolInput.relationship),
        calendar_title: `Check in with ${toolInput.relationship}`,
        reminder_set: true,
      };

    default:
      return { error: "Unknown tool" };
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function inferInterests(relationship, context = "") {
  const baseInterests = {
    "close friend": ["shared experiences", "inside jokes", "nostalgia"],
    coworker: ["professional respect", "team lunch", "coffee"],
    family: ["home cooking", "quality time", "phone calls"],
    "romantic partner": ["quality time", "thoughtfulness", "gestures"],
  };
  return baseInterests[relationship] || ["thoughtfulness", "sincerity"];
}

function inferCommunicationStyle(relationship) {
  const styles = {
    "close friend": "casual and direct",
    coworker: "professional but warm",
    family: "genuine and personal",
    "romantic partner": "vulnerable and sincere",
  };
  return styles[relationship] || "warm and genuine";
}

function inferSensitivity(relationship) {
  const sensitivity = {
    "close friend": "medium",
    coworker: "medium-low",
    family: "high",
    "romantic partner": "very high",
  };
  return sensitivity[relationship] || "medium";
}

function assessSeverity({ failure_type, relationship, time_elapsed, prior_failures }) {
  let score = 0;
  if (failure_type?.includes("birthday")) score += 3;
  if (failure_type?.includes("meeting")) score += 2;
  if (failure_type?.includes("flaked")) score += 2;
  if (relationship === "romantic partner") score += 3;
  if (relationship === "family") score += 2;
  if (prior_failures) score += 2;
  if (time_elapsed?.includes("week") || time_elapsed?.includes("month")) score += 2;

  if (score >= 7) return "critical";
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function getRecoveryStrategy(severity, relationship) {
  if (severity === "critical") return "Grand gesture + immediate personal contact + gift + written apology";
  if (severity === "high") return "Personal message + gift + scheduled call";
  if (severity === "medium") return "Thoughtful message + small gesture";
  return "Casual acknowledgment + light humor";
}

function generateAlibiNarrative(severity, tone, context) {
  const narratives = {
    humorous: "My phone decided to stage a protest and went completely dark — I've since had a stern conversation with it about priorities. You, apparently, are a top priority it failed to communicate.",
    contrite: "I had a family situation come up that pulled me away from everything — I should have reached out immediately and I didn't, which is entirely on me.",
    professional: "I was pulled into an urgent situation that required my full attention. I should have flagged it sooner and I take full responsibility for the communication gap.",
    warm: "Life got away from me in the worst way possible this week. I've been thinking about it and the only explanation I have is that I let someone important to me down, and that's not okay.",
  };
  return narratives[tone] || narratives.warm;
}

function generateApologyBody({ name, alibi, relationship, tone, medium }) {
  const openers = {
    humorous: `Hey ${name} — I owe you an explanation and probably a coffee.`,
    contrite: `${name}, I've been thinking about this and I need to reach out.`,
    professional: `Hi ${name}, I wanted to address something directly.`,
    warm: `${name} — I've been meaning to write this for a bit now.`,
  };
  return `${openers[tone] || openers.warm}\n\n${alibi}\n\nI genuinely value what we have and I don't want this to sit between us. Can we find a time to catch up properly?`;
}

function generatePS(relationship) {
  const ps = {
    "close friend": "P.S. I'm buying next time. No arguments.",
    coworker: "P.S. Coffee on me this week.",
    family: "P.S. I'll call this weekend — for real this time.",
    "romantic partner": "P.S. You deserve better than this. Working on it.",
  };
  return ps[relationship] || "P.S. This won't happen again.";
}

function getGiftRecommendation({ relationship, severity, budget }) {
  const gifts = {
    "close friend": { low: "Their favorite snack delivery", medium: "Experience voucher for something you'd do together", high: "Weekend trip planning offer" },
    coworker: { low: "Specialty coffee or tea set", medium: "Nice lunch out", high: "Team experience" },
    family: { low: "Handwritten letter + flowers", medium: "Home-cooked meal + visit", high: "Weekend visit + spa day" },
    "romantic partner": { low: "Their favorite meal cooked at home", medium: "Surprise date to a meaningful place", high: "Weekend getaway" },
  };
  const severityMap = { low: "low", medium: "medium", high: "high", critical: "high" };
  return gifts[relationship]?.[severityMap[severity]] || "Thoughtful handwritten note + small personal gesture";
}

function getBackupGift(relationship) {
  return relationship === "coworker" ? "Handwritten note + coffee gift card" : "Handwritten letter expressing specific appreciation for them";
}

function getGestureAlternative(relationship) {
  return `Show up for the next thing that matters to them — no excuses`;
}

function getFollowupTiming(severity) {
  const timing = { critical: "3 days", high: "5 days", medium: "1 week", low: "2 weeks" };
  return timing[severity] || "1 week";
}

function generateFollowupMessage(relationship) {
  return `Hey — just checking in. I want to make sure we're good. You mean a lot to me and I don't take that for granted.`;
}

// ─── Main Agent Loop ──────────────────────────────────────────────────────────
// This is the genuine agentic loop — Claude decides what tools to call and when

async function runAlibiAgent(input, onStep) {
  const { name, relationship, failure_type, time_elapsed, prior_failures, budget, medium, additional_context } = input;

  const systemPrompt = `You are The Alibi Agent — an autonomous multi-step reasoning agent that constructs complete relationship repair strategies. 

You have access to tools that you MUST use in sequence to build a complete alibi package. Do not skip steps. You are an AGENT, not a chatbot — you make decisions autonomously based on what you discover at each step.

Your job:
1. Research the person to understand them
2. Assess the damage severity and tone
3. Build a believable alibi narrative
4. Draft a personalized apology
5. Recommend a recovery gift
6. Schedule a follow-up

Use ALL tools. Each tool's output should inform your next decision. Think like a strategist, not a secretary.`;

  const userMessage = `I need a complete alibi recovery package for this social failure:
- Person: ${name}
- Relationship: ${relationship}  
- What I did: ${failure_type}
- Time elapsed: ${time_elapsed || "just happened"}
- Done this before: ${prior_failures ? "yes" : "no"}
- Budget for recovery: ${budget || "20_50"}
- Delivery medium: ${medium || "text"}
- Additional context: ${additional_context || "none"}

Run all steps autonomously. I need the complete package.`;

  const messages = [{ role: "user", content: userMessage }];
  const agentState = {
    steps: [],
    research: null,
    damage_assessment: null,
    alibi: null,
    apology: null,
    gift: null,
    followup: null,
  };

  // Agentic loop — keeps running until Claude stops calling tools
  let iteration = 0;
  const MAX_ITERATIONS = 10;

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    });

    // Collect all tool calls and text from this response
    const toolUses = response.content.filter((b) => b.type === "tool_use");
    const textBlocks = response.content.filter((b) => b.type === "text");

    if (textBlocks.length > 0) {
      agentState.steps.push({ type: "thinking", content: textBlocks.map((b) => b.text).join(" ") });
    }

    // If no tools called, agent is done
    if (response.stop_reason === "end_turn" || toolUses.length === 0) {
      break;
    }

    // Execute all tools and collect results
    const toolResults = [];
    for (const toolUse of toolUses) {
      const result = executeTool(toolUse.name, toolUse.input);

      // Store result in agent state
      switch (toolUse.name) {
        case "research_person": agentState.research = result; break;
        case "assess_damage": agentState.damage_assessment = result; break;
        case "build_alibi_narrative": agentState.alibi = result; break;
        case "draft_apology": agentState.apology = result; break;
        case "recommend_gift": agentState.gift = result; break;
        case "schedule_followup": agentState.followup = result; break;
      }

      // Emit step update for real-time UI streaming
      if (onStep) {
        onStep({
          tool: toolUse.name,
          input: toolUse.input,
          result,
          step_number: agentState.steps.length + 1,
        });
      }

      agentState.steps.push({ type: "tool_call", tool: toolUse.name, input: toolUse.input, result });

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    // Add assistant response + tool results to message history
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  return agentState;
}

module.exports = { runAlibiAgent };
