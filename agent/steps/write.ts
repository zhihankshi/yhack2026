import { config } from "../config.js";
import { writeDemoSuffix } from "../demoMode.js";
import { callLLMJson } from "../llmJson.js";
import { writeOutSchema, type WriteOut } from "../schemas.js";
import type { RepairState } from "../state.js";

const SYSTEM = `You write the actual messages to send: apologyMessage and followUpMessage, plus optional optionalLightFraming.

You MUST obey reasoning.alibiPolicy and every bullet in reasoning.writingRules.

alibiPolicy behavior:
- none: Do not explain why it happened. No background, no "I was busy because…". OMIT optionalLightFraming entirely. Focus on clean apology + concrete repair action only.
- light_framing: At most ONE sentence of factual context total, and it must not be a lie or speculation—only what the user situation plausibly implies. You may place it in optionalLightFraming OR at the start of apologyMessage, not both with duplicate meaning.
- detailed_explanation: At most THREE sentences of factual context across the apology (and optionalLightFraming if used). Still no invented facts or embellished details—stick to generic truths (e.g. "I double-booked myself") only if consistent with the scenario; otherwise stay vague.

Match reasoning.tone and severity. Output one JSON object: apologyMessage, followUpMessage, optional optionalLightFraming (omit the field when unused).`;

export async function writeStep(state: RepairState): Promise<RepairState> {
  if (!state.research || !state.reasoning) {
    throw new Error("writeStep requires state.research and state.reasoning");
  }

  const user = `Scenario:\n${state.input}\n\nResearch:\n${JSON.stringify(state.research, null, 2)}\n\nReasoning:\n${JSON.stringify(state.reasoning, null, 2)}\n\nWrite messages JSON. Follow alibiPolicy=${state.reasoning.alibiPolicy} strictly.`;

  const writing: WriteOut = await callLLMJson(
    writeOutSchema,
    {
      model: config.modelWrite,
      systemPrompt: SYSTEM + writeDemoSuffix(),
      maxTokens: config.maxTokensWrite,
      temperature: config.temperature,
    },
    user
  );

  return { ...state, writing };
}
