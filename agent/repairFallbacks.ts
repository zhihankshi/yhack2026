import type {
  ResearchOut,
  ReasonOut,
  WriteOut,
  AlibiPolicy,
  PerceptionOut,
} from "./schemas.js";
import type { RepairState } from "./state.js";

export function perceptionFallback(state: RepairState): RepairState {
  const perception: PerceptionOut = {
    situationSummary:
      "The user described a repair scenario; details come only from their message (perception step used a safe default).",
    signals: ["Parsed from incident text without external mail/calendar claims."],
    confidence: { relationship: 0.5, stakes: 0.55, tone: 0.5 },
    assumptions: ["The user wants to apologize and rebuild trust."],
    missingInfo: ["Full relationship context may be incomplete."],
    clarifyingQuestions: [],
    constraints: { hrSafe: true, urgencyHours: 48 },
  };
  return { ...state, perception };
}

export function researchFallback(state: RepairState): RepairState {
  const research: ResearchOut = {
    clarifyingQuestions: [],
    inferredInterests: [],
    giftIdeas: [
      {
        title: "Artisan coffee or local pastry box delivery",
        priceRange: "$25–45",
        whyItFits:
          "A thoughtful gesture that is universally appreciated and feels more personal than a generic item.",
        searchQuery: "same-day artisan bakery delivery near me",
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

export function reasonFallback(state: RepairState): RepairState {
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

export function extractOptionalName(input: string): string | undefined {
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

export function writeFallback(state: RepairState): RepairState {
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
      optionalLightFraming: "I'm not looking to make excuses—I own this.",
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
