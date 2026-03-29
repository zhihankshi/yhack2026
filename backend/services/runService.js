const path = require("path");
const { pathToFileURL } = require("url");

function buildAgentInputText(body) {
  return `
Person name: ${body.name || ""}
Relationship: ${body.relationship || ""}
Failure type: ${body.failure_type || ""}
Time elapsed: ${body.time_elapsed || ""}
Prior failures: ${body.prior_failures || ""}
Budget: ${body.budget || ""}
Medium: ${body.medium || ""}
Additional context: ${body.additional_context || ""}
  `.trim();
}

function normalizeAgentResponse(raw, input) {
  return {
    failure_id: raw?.failure_id || `failure_${Date.now()}`,
    result: {
      research: raw?.research ||
        raw?.result?.research || {
          person_name: input.name,
          relationship: input.relationship,
        },
      damage_assessment:
        raw?.damage_assessment ||
        raw?.damageAssessment ||
        raw?.result?.damage_assessment ||
        {},
      alibi: raw?.alibi || raw?.result?.alibi || {},
      apology: raw?.apology ||
        raw?.result?.apology || {
          subject: "I owe you an apology",
          body: `Hey ${input.name}, I’m really sorry for missing this.`,
          ps_line: "",
        },
      gift: raw?.gift || raw?.result?.gift || {},
      followup: raw?.followup ||
        raw?.result?.followup || {
          followup_timing: "3 days from now",
          followup_message: `Hey ${input.name}, just checking in again.`,
          calendar_title: `Follow up with ${input.name}`,
        },
    },
  };
}

async function runAlibiAgent(input, onStep) {
  const userText = buildAgentInputText(input);

  onStep?.({ tool: "research_person" });
  onStep?.({ tool: "assess_damage" });
  onStep?.({ tool: "build_alibi_narrative" });
  onStep?.({ tool: "draft_apology" });
  onStep?.({ tool: "recommend_gift" });
  onStep?.({ tool: "schedule_followup" });

  const modulePath = pathToFileURL(
    path.resolve(__dirname, "../../agent/runAlibiAgent.ts"),
  ).href;

  const agentModule = await import(modulePath);
  const realRunAlibiAgent = agentModule.runAlibiAgent || agentModule.default;

  if (!realRunAlibiAgent) {
    throw new Error("runAlibiAgent export not found");
  }

  const raw = await realRunAlibiAgent(userText);

  return normalizeAgentResponse(raw, input);
}

module.exports = { runAlibiAgent };
