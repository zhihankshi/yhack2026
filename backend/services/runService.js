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

/** Maps agent `RunAgentResponse` (writing/reasoning/research) to the UI bundle used by the frontend. */
function mapRunAgentContractToUi(raw, input) {
  const w = raw.writing;
  const r = raw.reasoning;
  const res = raw.research;
  const actions = raw.actions;
  const name = input?.name?.trim() || raw.input?.personName || "there";

  const sev = r?.severity === "med" ? "medium" : r?.severity;
  const primaryGift = res?.giftIdeas?.[0];
  const backupGift = res?.giftIdeas?.[1];

  const narrativeParts = [
    w?.optionalLightFraming?.trim(),
    r?.plan?.length ? r.plan.map((p) => `• ${p}`).join("\n") : "",
  ].filter(Boolean);
  const narrative =
    narrativeParts.join("\n\n").trim() ||
    (w?.apologyMessage ? String(w.apologyMessage).slice(0, 1200) : "");

  return {
    failure_id: raw.runId || raw.failure_id || `failure_${Date.now()}`,
    result: {
      research: {
        name,
        inferred_interests:
          res?.giftIdeas?.map((g) => g.title).filter(Boolean) ?? [],
        communication_style: r
          ? `${r.tone} tone · ${r.alibiPolicy?.replace(/_/g, " ") ?? "balanced"} framing`
          : "",
        sensitivity_level: r?.severity ?? "med",
        research_complete: true,
        clarifying_questions: res?.clarifyingQuestions ?? [],
      },
      damage_assessment: r
        ? {
            severity: sev,
            recommended_tone: r.tone,
            urgency: `within ~${res?.followUpWindowDays ?? 3} days`,
            recovery_strategy: r.plan?.join(" ") || r.risks?.join(" ") || "",
          }
        : {},
      alibi: narrative
        ? {
            narrative,
            plausibility_score:
              r?.alibiPolicy === "full_alibi"
                ? 0.88
                : r?.alibiPolicy === "light_framing"
                  ? 0.78
                  : 0.72,
            recommended_delivery: `${r?.tone ?? "sincere"} · ${r?.alibiPolicy?.replace(/_/g, " ") ?? "direct"}`,
          }
        : {},
      apology: {
        subject: w?.subject || "Message",
        body: w?.apologyMessage || "",
        // Follow-up copy lives in `followup` only — do not duplicate it here or Gmail drafts repeat it.
        ps_line: "",
      },
      gift: primaryGift
        ? {
            primary_recommendation: `${primaryGift.title} — ${primaryGift.whyItFits}`,
            backup_recommendation: backupGift
              ? `${backupGift.title} — ${backupGift.whyItFits}`
              : "",
            gesture_alternative: r?.risks?.[0] || "",
            estimated_impact: r?.severity === "high" ? "high" : "medium",
            purchase_link:
              primaryGift.purchaseLink?.trim() ||
              `https://www.google.com/search?q=${encodeURIComponent(primaryGift.searchQuery)}`,
            price_range: primaryGift.priceRange,
          }
        : actions?.giftLinks?.length
          ? {
              primary_recommendation:
                "See suggested links from research — pick what fits your relationship best.",
              purchase_link: actions.giftLinks[0],
              price_range: "",
            }
          : {},
      followup: {
        followup_timing: `${actions?.followup?.daysFromNow ?? res?.followUpWindowDays ?? 3} days`,
        followup_message: w?.followUpMessage || "",
        calendar_title:
          actions?.followup?.title || `Follow up with ${name}`,
        reminder_set: true,
      },
    },
  };
}

function normalizeAgentResponse(raw, input) {
  // Live pipeline: `agent/runAlibiAgent` returns `RunAgentResponse` (writing + reasoning + research).
  if (raw?.writing && raw?.reasoning) {
    return mapRunAgentContractToUi(raw, input);
  }

  return {
    failure_id: raw?.failure_id || raw?.runId || `failure_${Date.now()}`,
    result: {
      research: raw?.research ||
        raw?.result?.research || {
          name: input.name,
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

async function runAlibiAgent(input) {
  const userText = buildAgentInputText(input);

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
