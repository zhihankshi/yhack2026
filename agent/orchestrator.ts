import { ZodError } from "zod";
import { initState, type RepairState, type LogEntry } from "./state.js";
import { researchStep } from "./steps/research.js";
import { reasonStep } from "./steps/reason.js";
import { writeStep } from "./steps/write.js";
import type {
  ResearchOut,
  ReasonOut,
  WriteOut,
  AlibiPolicy,
} from "./schemas.js";

const JSON_RETRY_SUFFIX =
  "\n\nRETURN ONLY VALID JSON. NO MARKDOWN. NO EXTRA TEXT.";

export type RepairAgentEvent =
  | { type: "step_start"; step: string; data?: unknown }
  | { type: "step_done"; step: string; data?: unknown }
  | { type: "error"; step: string; data?: unknown };

export type RepairAgentOnEvent = (e: RepairAgentEvent) => void;

function appendLog(state: RepairState, step: string, msg: string): RepairState {
  const entry: LogEntry = { step, msg };
  return { ...state, logs: [...state.logs, entry] };
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function isParseOrZodError(e: unknown): boolean {
  if (e instanceof SyntaxError) return true;
  if (e instanceof ZodError) return true;
  return false;
}

export async function runStepWithRetry(
  stepName: string,
  fn: (state: RepairState, userPromptAppend: string) => Promise<RepairState>,
  fallbackFn: (state: RepairState) => RepairState,
  state: RepairState,
  onEvent?: RepairAgentOnEvent
): Promise<{ state: RepairState; usedFallback: boolean }> {
  let s = appendLog(state, stepName, "start");
  onEvent?.({ type: "step_start", step: stepName });

  try {
    const out = await fn(s, "");
    s = appendLog(out, stepName, "end");
    onEvent?.({ type: "step_done", step: stepName });
    return { state: s, usedFallback: false };
  } catch (e1: unknown) {
    if (isParseOrZodError(e1)) {
      try {
        const out = await fn(s, JSON_RETRY_SUFFIX);
        s = appendLog(out, stepName, "end");
        onEvent?.({ type: "step_done", step: stepName });
        return { state: s, usedFallback: false };
      } catch (e2: unknown) {
        onEvent?.({
          type: "error",
          step: stepName,
          data: { fallback: true, error: errMsg(e2) },
        });
        const fb = fallbackFn(s);
        return {
          state: appendLog(fb, stepName, "fallback"),
          usedFallback: true,
        };
      }
    }
    onEvent?.({
      type: "error",
      step: stepName,
      data: { fallback: true, error: errMsg(e1) },
    });
    const fb = fallbackFn(s);
    return { state: appendLog(fb, stepName, "fallback"), usedFallback: true };
  }
}

function researchFallback(state: RepairState): RepairState {
  const research: ResearchOut = {
    clarifyingQuestions: [
      "What city or region should we assume for delivery?",
      "Any dietary restrictions or scent sensitivities?",
    ],
    inferredInterests: [],
    giftIdeas: [
      {
        title: "Same-day flowers or local florist bouquet",
        priceRange: "$35–75",
        whyItFits:
          "Neutral and widely appropriate; search locally rather than guessing inventory.",
        searchQuery: "same-day flower delivery near me",
      },
      {
        title: "Premium chocolate or snack gift box",
        priceRange: "$25–50",
        whyItFits:
          "Coworker-safe when interests are unknown; easy to verify via search.",
        searchQuery: "premium chocolate gift box delivery",
      },
      {
        title: "Small desk plant or succulent",
        priceRange: "$20–45",
        whyItFits:
          "Low-risk tone; avoids strong personal taste assumptions.",
        searchQuery: "small desk plant gift delivery",
      },
    ],
    followUpWindowSuggestion: {
      daysFromNow: 3,
      rationale:
        "Space to cool off while you follow through with a concrete gesture soon.",
    },
  };
  return { ...state, research };
}

function reasonFallback(state: RepairState): RepairState {
  const lower = state.input.toLowerCase();
  const incidentType =
    lower.includes("anniversary")
      ? ("forgot_anniversary" as const)
      : lower.includes("birthday")
        ? ("forgot_birthday" as const)
        : lower.includes("meeting") || lower.includes("manager")
          ? ("missed_meeting" as const)
          : lower.includes("deadline") || lower.includes("late on")
            ? ("work_deadline" as const)
            : lower.includes("reply") || lower.includes("texted")
              ? ("late_reply" as const)
              : ("other" as const);

  let alibiPolicy: AlibiPolicy = "light_framing";
  if (
    incidentType === "forgot_anniversary" ||
    incidentType === "forgot_birthday"
  ) {
    alibiPolicy = "none";
  } else if (
    incidentType === "missed_meeting" &&
    /\bmanager\b/i.test(state.input)
  ) {
    alibiPolicy = "detailed_explanation";
  }

  const reasoning: ReasonOut = {
    severity: "med",
    tone: "contrite",
    incidentType,
    alibiPolicy,
    budgetRange: [20, 50],
    plan: [
      "Acknowledge what went wrong without deflecting.",
      "Offer one specific repair action (time, place, or gesture).",
      "Ask what they need to feel respected.",
      "Follow up once after a pause—no pressure.",
    ],
    writingRules: [
      "No excuses; center impact on them.",
      "Keep it short.",
      "Include one concrete repair action.",
      "Do not invent facts or detailed alibis.",
    ],
    risks: [
      "They may need time before responding.",
      "Long or repeated messages can feel like pressure.",
    ],
  };
  return { ...state, reasoning };
}

function extractOptionalName(input: string): string | undefined {
  const quoted = input.match(/["']([A-Za-z][A-Za-z '-]{1,40})["']/);
  if (quoted) {
    const first = quoted[1].trim().split(/\s+/)[0];
    if (first) return first;
  }
  for (const re of [
    /\b(?:with|for|to)\s+([A-Z][a-z]+)\b/,
    /\bpartner\s+([A-Z][a-z]+)\b/i,
  ]) {
    const m = input.match(re);
    if (m) return m[1];
  }
  return undefined;
}

function writeFallback(state: RepairState): RepairState {
  const name = extractOptionalName(state.input);
  const hi = name ? `Hi ${name},` : "Hi,";
  const policy = state.reasoning?.alibiPolicy ?? "light_framing";

  let writing: WriteOut;
  if (policy === "none") {
    writing = {
      apologyMessage: `${hi}\n\nI'm truly sorry—I messed up, and I'm sorry for the hurt it caused. I'd like to make this right; tell me what would help, or I can suggest a concrete next step on my end.`,
      followUpMessage: `${hi}\n\nI'll give you space. When you're ready, I'm here—no pressure to reply quickly.`,
    };
  } else if (policy === "light_framing") {
    writing = {
      apologyMessage: `${hi}\n\nI'm sorry for what happened and how it affected you.`,
      followUpMessage: `${hi}\n\nI'm checking in because I meant what I said. If you're open to it, I'd like to make this right.`,
      optionalLightFraming:
        "I'm not looking to make excuses—I own this.",
    };
  } else {
    writing = {
      apologyMessage: `${hi}\n\nI'm sorry I let you down and wasted your time.`,
      followUpMessage: `${hi}\n\nI'll follow your lead on timing. When it makes sense, I'd like to show you I'll be more reliable.`,
      optionalLightFraming:
        "I didn't treat your time with the respect it deserves. Going forward I'll flag conflicts earlier and keep my commitments—or renegotiate before the meeting, not after.",
    };
  }
  return { ...state, writing };
}

export async function runRepairAgent(
  input: string,
  onEvent?: RepairAgentOnEvent
): Promise<{ state: RepairState; ok: boolean }> {
  let state = initState(input);
  let ok = true;

  const r1 = await runStepWithRetry(
    "research",
    researchStep,
    researchFallback,
    state,
    onEvent
  );
  state = r1.state;
  if (r1.usedFallback) ok = false;

  const r2 = await runStepWithRetry(
    "reason",
    reasonStep,
    reasonFallback,
    state,
    onEvent
  );
  state = r2.state;
  if (r2.usedFallback) ok = false;

  const r3 = await runStepWithRetry(
    "write",
    writeStep,
    writeFallback,
    state,
    onEvent
  );
  state = r3.state;
  if (r3.usedFallback) ok = false;

  return { state, ok };
}
