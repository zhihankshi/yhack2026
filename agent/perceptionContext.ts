/**
 * Optional metadata from Gmail / Calendar integrations (no full content).
 * Backend may populate these; the agent must not claim access unless present.
 */
export type PerceptionContext = {
  gmail?: {
    to?: string;
    lastContactDaysAgo?: number;
    oweReply?: boolean;
    subjectKeywords?: string[];
    snippet?: string;
  };
  calendar?: {
    missedEventTitle?: string;
    missedEventEndedHoursAgo?: number;
    nextFreeWindowISO?: string;
  };
  userProvided?: {
    locationCity?: string;
    budgetMax?: number;
    deliveryUrgency?: "today" | "this_week" | "no_rush";
  };
};
