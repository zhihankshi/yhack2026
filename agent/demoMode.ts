/** Live demos: lower cost, shorter outputs, same pipeline semantics (usedFallback still honest). */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/** Appended to research system prompt in demo mode. */
export function researchDemoSuffix(): string {
  if (!isDemoMode()) return "";
  return `

DEMO MODE: Minimize tokens. Use clarifyingQuestions: []. At most 2 gift ideas. Keep titles and whyItFits to one short line each.`;
}

/** Appended to reason system prompt in demo mode. */
export function reasonDemoSuffix(): string {
  if (!isDemoMode()) return "";
  return `

DEMO MODE: plan: at most 3 short bullets. risks: at most 2 short bullets. Keep writingRules terse.`;
}

/** Appended to write system prompt in demo mode. */
export function writeDemoSuffix(): string {
  if (!isDemoMode()) return "";
  return `

DEMO MODE: Do not output optionalLightFraming. Keep apologyMessage and followUpMessage short (under ~100 words each).`;
}
