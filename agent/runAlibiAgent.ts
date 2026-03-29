import crypto from "node:crypto";
import { performance } from "node:perf_hooks";
import { shouldPausePipeline } from "./incident.js";
import type { PerceptionContext } from "./perceptionContext.js";
import { initState, type RepairState } from "./state.js";
import {
  perceptionFallback,
  researchFallback,
  reasonFallback,
  writeFallback,
  extractOptionalName,
} from "./repairFallbacks.js";
import { perceptionStep } from "./steps/perception.js";
import { researchStep } from "./steps/research.js";
import { reasonStep } from "./steps/reason.js";
import { writeStep } from "./steps/write.js";
import type { ResearchOut, ReasonOut } from "./schemas.js";
import {
  makeHardFallbackResponse,
  validateFinalResponse,
  type RunAgentResponse,
} from "./runAgentContract.js";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function humanizeIncident(t: ReasonOut["incidentType"]): string {
  return t.replace(/_/g, " ");
}

function parseStructuredInput(raw: string): RunAgentResponse["input"] {
  const personName = extractOptionalName(raw) ?? "";
  let relationshipType: RunAgentResponse["input"]["relationshipType"] =
    "other";
  if (/\b(partner|spouse|wife|husband|girlfriend|boyfriend)\b/i.test(raw)) {
    relationshipType = "partner";
  } else if (/\bmanager\b/i.test(raw)) {
    relationshipType = "manager";
  } else if (/\bdirect\s*report\b/i.test(raw) || /\bmy\s+report\b/i.test(raw)) {
    relationshipType = "direct_report";
  } else if (/\bcoworker\b/i.test(raw) || /\bcolleague\b/i.test(raw)) {
    relationshipType = "coworker";
  } else if (/\bfriend\b/i.test(raw)) {
    relationshipType = "friend";
  }

  let channelPreference: RunAgentResponse["input"]["channelPreference"] =
    "unsure";
  if (/\bemail\b/i.test(raw)) channelPreference = "email";
  else if (/\btext\b|texted|sms/i.test(raw)) channelPreference = "text";
  else if (/\bslack\b/i.test(raw)) channelPreference = "slack";
  else if (/in\s*person|face\s*to\s*face/i.test(raw)) {
    channelPreference = "in_person";
  }

  return {
    incident: raw,
    personName,
    relationshipType,
    channelPreference,
  };
}

function buildGiftLinks(research: ResearchOut): string[] {
  const out: string[] = [];
  for (const g of research.giftIdeas) {
    const link = g.purchaseLink?.trim();
    if (link) out.push(link);
    else
      out.push(
        `https://www.google.com/search?q=${encodeURIComponent(g.searchQuery)}`
      );
  }
  return out;
}

/** Prefer calendar next-free window for follow-up when valid; else research suggestion. */
function resolveFollowUpDays(state: RepairState, researchDays: number): number {
  const iso = state.perceptionContext?.calendar?.nextFreeWindowISO;
  if (!iso) return researchDays;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return researchDays;
  const fromNow = Math.ceil((t - Date.now()) / 86400000);
  if (fromNow < 1) return researchDays;
  return Math.min(Math.max(fromNow, 1), 30);
}

function repairStateToResponse(
  state: RepairState,
  meta: {
    usedFallback: boolean;
    pausedForUserInput: boolean;
    stepTimingsMs: { research: number; reason: number; write: number };
    logs: string[];
    status: RunAgentResponse["status"];
  }
): RunAgentResponse {
  const structured = parseStructuredInput(state.input);
  const research = state.research!;
  const reasoning = state.reasoning!;
  const writing = state.writing!;
  const days = resolveFollowUpDays(
    state,
    research.followUpWindowSuggestion.daysFromNow
  );

  const apologyBlock = [
    writing.apologyMessage.trim(),
    writing.optionalLightFraming
      ? `\n\n${writing.optionalLightFraming.trim()}`
      : "",
    "\n\n—\n\n",
    writing.followUpMessage.trim(),
  ]
    .join("")
    .trim();

  const subject = `Re: ${humanizeIncident(reasoning.incidentType)}`;
  const emailMatch = state.input.match(/[\w.+-]+@[\w.-]+\.\w+/);

  const rules = reasoning.writingRules ?? [];
  const notes = [
    ...rules.map((r) => `• ${r}`),
    "",
    `Plan: ${reasoning.plan.join(" ")}`,
  ].join("\n");

  return {
    runId: state.runId,
    ok: true,
    status: meta.status,
    input: structured,
    research: {
      clarifyingQuestions: [...research.clarifyingQuestions],
      giftIdeas: research.giftIdeas.map((g) => ({
        title: g.title,
        priceRange: g.priceRange,
        whyItFits: g.whyItFits,
        searchQuery: g.searchQuery,
        ...(g.purchaseLink ? { purchaseLink: g.purchaseLink } : {}),
      })),
      followUpWindowDays: days,
    },
    reasoning: {
      incidentType: reasoning.incidentType,
      severity: reasoning.severity,
      tone: reasoning.tone,
      budgetRange: [...reasoning.budgetRange] as [number, number],
      alibiPolicy: reasoning.alibiPolicy,
      plan: [...reasoning.plan],
      risks: [...reasoning.risks],
    },
    writing: {
      subject,
      apologyMessage: writing.apologyMessage,
      followUpMessage: writing.followUpMessage,
      ...(writing.optionalLightFraming
        ? { optionalLightFraming: writing.optionalLightFraming }
        : {}),
    },
    actions: {
      email: {
        ...(emailMatch ? { to: emailMatch[0] } : {}),
        subject,
        body: apologyBlock,
        sendEndpoint: "/api/send-apology-email",
      },
      followup: {
        daysFromNow: days,
        title: `Follow up: ${humanizeIncident(reasoning.incidentType)}`,
        notes,
        scheduleEndpoint: "/api/schedule-followup",
      },
      giftLinks: buildGiftLinks(research),
    },
    debug: {
      usedFallback: meta.usedFallback,
      pausedForUserInput: meta.pausedForUserInput,
      stepTimingsMs: { ...meta.stepTimingsMs },
      logs: [...meta.logs],
    },
  };
}

export async function runAlibiAgent(
  input: string,
  perceptionContext?: PerceptionContext
): Promise<RunAgentResponse> {
  const runId = crypto.randomUUID();

  try {
    let usedFallback = false;
    const logs: string[] = [];
    const stepTimingsMs = { research: 0, reason: 0, write: 0 };

    let state = initState(input, perceptionContext);
    state = { ...state, runId };

    try {
      const t0 = performance.now();
      state = await perceptionStep(state);
      const perceptionMs = Math.round(performance.now() - t0);
      logs.push(`perception: ok (${perceptionMs}ms)`);
    } catch (e) {
      usedFallback = true;
      state = perceptionFallback(state);
      logs.push(`perception: fallback — ${errMsg(e)}`);
    }

    try {
      const t0 = performance.now();
      state = await researchStep(state);
      stepTimingsMs.research = Math.round(performance.now() - t0);
      logs.push("research: ok");
    } catch (e) {
      usedFallback = true;
      state = researchFallback(state);
      logs.push(`research: fallback — ${errMsg(e)}`);
    }

    const paused = shouldPausePipeline(state);

    if (paused) {
      state = reasonFallback(state);
      state = writeFallback(state);
      logs.push(
        "pipeline: paused for clarifiers (high-stakes); reason/write from defaults"
      );
      const finalResponse = repairStateToResponse(state, {
        usedFallback,
        pausedForUserInput: true,
        stepTimingsMs,
        logs,
        status: "needs_user_input",
      });
      return validateFinalResponse(finalResponse);
    }

    try {
      const t0 = performance.now();
      state = await reasonStep(state);
      stepTimingsMs.reason = Math.round(performance.now() - t0);
      logs.push("reason: ok");
    } catch (e) {
      usedFallback = true;
      state = reasonFallback(state);
      logs.push(`reason: fallback — ${errMsg(e)}`);
    }

    try {
      const t0 = performance.now();
      state = await writeStep(state);
      stepTimingsMs.write = Math.round(performance.now() - t0);
      logs.push("write: ok");
    } catch (e) {
      usedFallback = true;
      state = writeFallback(state);
      logs.push(`write: fallback — ${errMsg(e)}`);
    }

    const finalResponse = repairStateToResponse(state, {
      usedFallback,
      pausedForUserInput: false,
      stepTimingsMs,
      logs,
      status: "ready_to_act",
    });
    return validateFinalResponse(finalResponse);
  } catch (e) {
    const fb = makeHardFallbackResponse(runId, input);
    fb.debug.usedFallback = true;
    fb.debug.pausedForUserInput = false;
    fb.debug.logs = [`runAlibiAgent: fatal — ${errMsg(e)}`];
    return validateFinalResponse(fb);
  }
}
