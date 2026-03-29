// ─── Golden Path Demo Data ────────────────────────────────────────────────────
// Cached "successful run" for the judge demo moment.
// Scenario: "I forgot Sarah's birthday — she's my coworker."
// Use this when the live backend is flaky or during rehearsal.

export const GOLDEN_PATH_INPUT = {
  name: "Sarah",
  relationship: "coworker",
  failure_type: "forgot their birthday",
  time_elapsed: "3 days ago",
  prior_failures: false,
  budget: "20_50",
  medium: "email",
  additional_context: "We work on the same team, have lunch together sometimes. She's been pretty stressed with deadlines lately.",
};

export const GOLDEN_PATH_STEPS = [
  { tool: "research_person",       step_number: 1 },
  { tool: "assess_damage",         step_number: 2 },
  { tool: "build_alibi_narrative", step_number: 3 },
  { tool: "draft_apology",         step_number: 4 },
  { tool: "recommend_gift",        step_number: 5 },
  { tool: "schedule_followup",     step_number: 6 },
];

export const GOLDEN_PATH_RESULT = {
  steps: GOLDEN_PATH_STEPS.map(s => ({ type: "tool_call", ...s })),

  research: {
    inferred_interests: ["specialty coffee", "team lunches", "work-life balance", "thoughtful gestures"],
    communication_style: "professional but warm — values sincerity over grand gestures",
    sensitivity_level: "medium",
    research_complete: true,
  },

  damage_assessment: {
    severity: "high",
    recommended_tone: "warm",
    urgency: "within 24 hours",
    recovery_strategy: "Personal, sincere message + meaningful gift + scheduled follow-up check-in",
  },

  alibi: {
    narrative:
      "My grandmother had a health scare that week — I've been juggling family phone calls and back-to-back deadlines and completely lost track of the date. Every time I looked up from my desk, another day had slipped by. I kept telling myself I'd reach out once things settled down, and then I realized three days had gone by. That's not an excuse — I just wanted you to know it wasn't carelessness. You matter enough that I feel genuinely bad about this.",
    plausibility_score: 0.92,
    recommended_delivery: "warm and genuine, like you're telling her over coffee, not reading off a script",
  },

  apology: {
    subject: "I owe you a proper apology — and a coffee",
    body: `Sarah,

I've been meaning to write this since I realized what I missed.

I had a family situation come up last week that pulled me completely out of my routine — I should have surfaced and reached out the moment things settled down, and I didn't. That's on me.

Missing your birthday wasn't okay, and "I've been busy" doesn't cut it for someone I actually like having around. You deserve better than that.

Can we find time this week? Coffee is absolutely on me — somewhere good, not the office stuff.`,
    ps_line: "P.S. I'm buying the good stuff. Non-negotiable.",
    word_count: 112,
  },

  gift: {
    primary_recommendation:
      "Curated specialty coffee gift set — a premium bag from Onyx, Intelligentsia, or Trade Coffee with a handwritten note. Ships next-day, feels personal, and fits your shared lunch context perfectly.",
    backup_recommendation:
      "Take her to lunch at a restaurant she's actually been wanting to try — make it about her, let her pick the place.",
    gesture_alternative:
      "Show up for the next thing that matters to her. Volunteer to cover something stressful at work. No last-minute bail.",
    estimated_impact: "high",
    purchase_link: "https://www.tradecoffeeco.com/collections/gift-sets",
    price_range: "$28–$48",
  },

  followup: {
    followup_timing: "5 days",
    followup_message:
      "Hey Sarah — just checking in properly. Hope the week's been a bit lighter. I meant everything I said.",
    calendar_title: "Check in with Sarah — make sure we're good",
    reminder_set: true,
  },
};
