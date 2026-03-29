import { config } from "../config.js";
import { perceptionDemoSuffix } from "../demoMode.js";
import { callLLMJson } from "../llmJson.js";
import { perceptionOutSchema, type PerceptionOut } from "../schemas.js";
import type { RepairState } from "../state.js";

const SYSTEM = `You are a perception layer for a relationship/workplace repair assistant.

Output ONE JSON object matching the schema exactly.

Rules:
- If the app provides Gmail/Calendar metadata in the user message under "Integration metadata", you MAY reference those signals explicitly (e.g. last contact, owed reply, subject keywords, next free window). Do NOT claim you read full emails or full calendar bodies—only what is listed.
- If NO integration metadata is present, infer only from the incident text. Do NOT say you accessed email or calendar.
- signals: short bullet-like facts (strings), grounded in allowed inputs.
- clarifyingQuestions: at most 2 items (0–2).
- confidence fields are 0–1 floats.
- constraints.hrSafe: true for workplace-sensitive scenarios unless clearly personal-only.
- constraints.urgencyHours: rough hours until a response feels overdue (integer).
- constraints.budgetMax: optional; set only if user or metadata implies a cap.

Be conservative: assumptions and missingInfo should reflect uncertainty.`;

/** Builds an extra user block for downstream steps (research / reason / write). */
export function formatPerceptionBlock(state: RepairState): string {
  const p = state.perception;
  if (!p) return "";
  const lines: string[] = [
    "## Perception Summary",
    p.situationSummary,
    "",
    "### Signals",
    ...p.signals.map((s) => `- ${s}`),
    "",
    "### Confidence (0–1)",
    `- relationship: ${p.confidence.relationship}, stakes: ${p.confidence.stakes}, tone: ${p.confidence.tone}`,
    "",
    "### Assumptions (do not treat as verified facts)",
    ...p.assumptions.map((a) => `- ${a}`),
    "",
    "### Constraints",
    `- hrSafe: ${p.constraints.hrSafe}, urgencyHours: ${p.constraints.urgencyHours}${
      p.constraints.budgetMax != null
        ? `, budgetMax: ${p.constraints.budgetMax}`
        : ""
    }`,
  ];
  const ctx = state.perceptionContext;
  if (ctx && Object.keys(ctx).length > 0) {
    lines.push(
      "",
      "### Integration metadata (from app; not full email/calendar content)",
      JSON.stringify(ctx, null, 2)
    );
  }
  return lines.join("\n");
}

export async function perceptionStep(
  state: RepairState
): Promise<RepairState> {
  const hasCtx = !!(
    state.perceptionContext && Object.keys(state.perceptionContext).length > 0
  );
  const ctxBlock = hasCtx
    ? `\n\nIntegration metadata (structured):\n${JSON.stringify(state.perceptionContext, null, 2)}`
    : "\n\n(No Gmail/Calendar metadata provided—use only the incident text.)";

  const user = `Incident / scenario (raw):\n${state.input}${ctxBlock}\n\nReturn Perception JSON (situationSummary, signals, confidence, assumptions, missingInfo, clarifyingQuestions max 2, constraints).`;

  const perception: PerceptionOut = await callLLMJson(
    perceptionOutSchema,
    {
      model: config.modelFast,
      systemPrompt: SYSTEM + perceptionDemoSuffix(),
      maxTokens: config.maxTokensPerception,
      temperature: config.temperature,
    },
    user
  );

  return { ...state, perception };
}
