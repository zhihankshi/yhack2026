import { callLLM, parseAssistantJson } from "../llm.js";
import { reasonOutSchema, type ReasonOut } from "../schemas.js";
import type { RepairState } from "../state.js";

const SYSTEM = `You are a strategist for apologizing and repairing a relationship or workplace situation.
Output one JSON object matching the schema.

incidentType: Classify the scenario into exactly one of:
work_deadline | missed_meeting | forgot_birthday | forgot_anniversary | late_reply | other.
Use the closest label from the user's words (e.g. anniversary → forgot_anniversary).

alibiPolicy: Choose from none | light_framing | detailed_explanation using relationship type and stakes:
- Romantic partner / family + high hurt → often none or light_framing (avoid excuse dumps).
- Manager / work + credibility stakes → light_framing or detailed_explanation only when the user needs brief factual context; never invent facts.
- Low-stakes peer mistake → none or light_framing is usually enough.

writingRules: Exactly 2–4 short bullet strings the writer must obey (e.g. "no excuses", "keep it short", "include concrete repair action", "no invented details").

Also set severity, tone, budgetRange [min, max], plan (repair steps), risks as before.
budgetRange is two numbers in the user's likely currency context.`;

export async function reasonStep(
  state: RepairState,
  userPromptAppend: string
): Promise<RepairState> {
  if (!state.research) {
    throw new Error("reasonStep requires state.research");
  }

  const user =
    `Original scenario:\n${state.input}\n\nResearch JSON:\n${JSON.stringify(state.research, null, 2)}\n\nProduce reason JSON (include incidentType, alibiPolicy, writingRules with 2–4 items).` +
    userPromptAppend;

  const raw = await callLLM(SYSTEM, user);
  const data = parseAssistantJson(raw);
  const reasoning: ReasonOut = reasonOutSchema.parse(data);

  return { ...state, reasoning };
}
