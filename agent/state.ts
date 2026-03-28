import type { ReasonOut, ResearchOut, WriteOut } from "./schemas.js";

export type LogEntry = { step: string; msg: string };

export type RepairState = {
  input: string;
  context: Record<string, unknown>;
  research?: ResearchOut;
  reasoning?: ReasonOut;
  writing?: WriteOut;
  actions: string[];
  observe: string;
  logs: LogEntry[];
};

export function initState(input: string): RepairState {
  return {
    input,
    context: {},
    research: undefined,
    reasoning: undefined,
    writing: undefined,
    actions: [],
    observe: "",
    logs: [],
  };
}
