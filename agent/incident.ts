import type { IncidentType } from "./schemas.js";
import type { RepairState } from "./state.js";

/** Same heuristics as reason fallback — keeps early-stop aligned with later classification. */
export function inferIncidentTypeFromInput(input: string): IncidentType {
  const lower = input.toLowerCase();
  if (lower.includes("anniversary")) return "forgot_anniversary";
  if (lower.includes("birthday")) return "forgot_birthday";
  if (lower.includes("meeting") || lower.includes("manager")) return "missed_meeting";
  if (lower.includes("deadline") || lower.includes("late on")) return "work_deadline";
  if (lower.includes("reply") || lower.includes("texted")) return "late_reply";
  return "other";
}

const HIGH_STAKES_INCIDENT_TYPES: IncidentType[] = [
  "forgot_anniversary",
  "forgot_birthday",
];

export function isHighStakesIncidentType(t: IncidentType): boolean {
  return HIGH_STAKES_INCIDENT_TYPES.includes(t);
}

/** Research asked clarifiers and scenario maps to a high-stakes incident type. */
export function shouldPauseForUserInput(state: RepairState): boolean {
  const r = state.research;
  if (!r || r.clarifyingQuestions.length < 1) return false;
  const t = inferIncidentTypeFromInput(state.input);
  return isHighStakesIncidentType(t);
}

/**
 * Pause before reason/write when research heuristics fire OR perception asks clarifiers
 * with high stakes (or low confidence in stakes when reason not run yet).
 */
export function shouldPausePipeline(state: RepairState): boolean {
  if (shouldPauseForUserInput(state)) return true;
  const cq = state.perception?.clarifyingQuestions ?? [];
  if (cq.length === 0) return false;
  if (state.reasoning !== undefined) {
    return state.reasoning.severity === "high";
  }
  return (state.perception?.confidence?.stakes ?? 1) < 0.6;
}
