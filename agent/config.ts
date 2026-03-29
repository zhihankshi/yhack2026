import { isDemoMode } from "./demoMode.js";

export { isDemoMode };

function envStr(key: string, fallback: string): string {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : fallback;
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key]?.trim();
  if (v === undefined || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envFloat(key: string, fallback: number): number {
  const v = process.env[key]?.trim();
  if (v === undefined || v === "") return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Central env-driven settings. Override via `.env` / process env (no code edits).
 * Set `DEMO_MODE=true` for cheaper models, lower caps, and shorter prompts (see `demoMode.ts`).
 */
export const config = {
  /** Required for live Lava calls; validated when the key is read. */
  get lavaApiKey(): string {
    const key = process.env.LAVA_API_KEY?.trim();
    if (!key) {
      throw new Error(
        "LAVA_API_KEY is required — set it in your environment or .env"
      );
    }
    return key;
  },

  get modelFast(): string {
    return envStr("MODEL_FAST", "gpt-4o-mini");
  },

  /** In demo mode, matches `modelFast` so all steps use the cheap model. */
  get modelWrite(): string {
    if (isDemoMode()) return envStr("MODEL_FAST", "gpt-4o-mini");
    return envStr("MODEL_WRITE", "gpt-4o-mini");
  },

  get maxTokensResearch(): number {
    if (isDemoMode()) return 180;
    return envInt("MAX_TOKENS_RESEARCH", 400);
  },

  get maxTokensReason(): number {
    if (isDemoMode()) return 140;
    return envInt("MAX_TOKENS_REASON", 300);
  },

  get maxTokensWrite(): number {
    if (isDemoMode()) return 220;
    return envInt("MAX_TOKENS_WRITE", 600);
  },

  get temperature(): number {
    if (isDemoMode()) return 0.3;
    return envFloat("TEMPERATURE", 0.4);
  },
};

/** Safe snapshot for logging (does not read LAVA_API_KEY). */
export function getModelConfigSummary(): {
  demoMode: boolean;
  modelFast: string;
  modelWrite: string;
  maxTokensResearch: number;
  maxTokensReason: number;
  maxTokensWrite: number;
  temperature: number;
} {
  return {
    demoMode: isDemoMode(),
    modelFast: config.modelFast,
    modelWrite: config.modelWrite,
    maxTokensResearch: config.maxTokensResearch,
    maxTokensReason: config.maxTokensReason,
    maxTokensWrite: config.maxTokensWrite,
    temperature: config.temperature,
  };
}
