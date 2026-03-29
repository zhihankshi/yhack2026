import { config } from "../config.js";
import { researchDemoSuffix } from "../demoMode.js";
import { callLLMJson } from "../llmJson.js";
import { researchOutSchema, type ResearchOut } from "../schemas.js";
import type { RepairState } from "../state.js";

const SYSTEM = `You are a research assistant for relationship "repair" gift planning.
Output a single JSON object matching the requested schema.

When hobbies or tastes are unclear or missing, still propose gift ideas that are coworker-safe: neutral, professional, unlikely to embarrass or overstep (e.g., nice desk item, quality snacks basket, plant, generic experience voucher theme—not intimate or controversial items).

If interests are unknown or thin, include 1–2 clarifyingQuestions in clarifyingQuestions that the product could ask the user next to narrow gifts—while still outputting those safe gift ideas in giftIdeas anyway.

For every gift idea, searchQuery must be something the user can paste into Google as a full query string, e.g. "same-day flowers delivery New Haven CT" or "premium chocolate gift box delivery"—concrete, location or context aware when the scenario implies it.

purchaseLink rules: omit purchaseLink unless it is (a) a generic search URL such as a Google search link encoding the same intent as searchQuery, or (b) a well-known site homepage (e.g. major retailers’ home URLs). Never invent or guess specific product/detail/checkout URLs.

CRITICAL: Do NOT claim you verified stock, pricing, or shipping. You have NOT checked real availability.`;

export async function researchStep(state: RepairState): Promise<RepairState> {
  const user = `Scenario:\n${state.input}\n\nReturn JSON for: clarifyingQuestions, inferredInterests, giftIdeas (title, priceRange, whyItFits, searchQuery as Google-pastable query, purchaseLink only per system rules or omit), followUpWindowSuggestion.`;

  const research: ResearchOut = await callLLMJson(
    researchOutSchema,
    {
      model: config.modelFast,
      systemPrompt: SYSTEM + researchDemoSuffix(),
      maxTokens: config.maxTokensResearch,
      temperature: config.temperature,
    },
    user
  );

  return { ...state, research };
}
