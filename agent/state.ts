import type { PerceptionContext } from "./perceptionContext.js";
import type { PerceptionOut, ReasonOut, ResearchOut, WriteOut } from "./schemas.js";

export type LogEntry = { step: string; msg: string };

export type RepairStatus =
  | "running"
  | "needs_user_input"
  | "ready_to_send"
  | "error";

export type DraftEmailAction = {
  type: "draft_email";
  to?: string;
  subject: string;
  body: string;
};

export type ScheduleFollowupAction = {
  type: "schedule_followup";
  whenDaysFromNow: number;
  title: string;
  notes: string;
};

export type ReadyToExecuteAction = DraftEmailAction | ScheduleFollowupAction;

export type StepTiming = {
  step: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
};

export type StepTimingsState = {
  runStartedAt: string;
  runEndedAt: string;
  totalDurationMs: number;
  steps: StepTiming[];
};

export type RepairState = {
  input: string;
  context: Record<string, unknown>;
  status: RepairStatus;
  runId: string;
  stepTimings: StepTimingsState;
  perception?: PerceptionOut;
  perceptionContext?: PerceptionContext;
  research?: ResearchOut;
  reasoning?: ReasonOut;
  writing?: WriteOut;
  actions: {
    readyToExecute: ReadyToExecuteAction[];
  };
  observe: string;
  logs: LogEntry[];
};

export function initState(
  input: string,
  perceptionContext?: PerceptionContext
): RepairState {
  const runStartedAt = new Date().toISOString();
  return {
    input,
    context: {},
    status: "running",
    runId: crypto.randomUUID(),
    stepTimings: {
      runStartedAt,
      runEndedAt: runStartedAt,
      totalDurationMs: 0,
      steps: [],
    },
    perception: undefined,
    perceptionContext,
    research: undefined,
    reasoning: undefined,
    writing: undefined,
    actions: { readyToExecute: [] },
    observe: "",
    logs: [],
  };
}
