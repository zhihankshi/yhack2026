/** Lava gateway base; upstream URL is passed as query param `u`. */
const LAVA_FORWARD_BASE = "https://api.lava.so/v1/forward";

/**
 * Upstream chat endpoint to forward to (OpenAI-compatible).
 * TODO: change if you route via a different provider URL in Lava.
 */
const UPSTREAM_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";

/**
 * Model id in the forwarded body (must be allowed for your Lava key).
 * TODO: set to the model you want (e.g. gpt-4o-mini, gpt-4o).
 */
const CHAT_MODEL = "gpt-4o-mini";

function requireApiKey(): string {
  const key = process.env.LAVA_API_KEY?.trim();
  if (!key) throw new Error("Set LAVA_API_KEY (Lava secret key, e.g. aks_live_…)");
  return key;
}

function extractOpenAIAssistantText(data: unknown): string {
  if (!data || typeof data !== "object") {
    throw new Error("Lava response: expected JSON object");
  }
  const err = (data as { error?: { message?: string } }).error;
  if (err?.message) throw new Error(`Lava/provider error: ${err.message}`);

  const choices = (data as { choices?: { message?: { content?: unknown } }[] })
    .choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content === "string" && content.length > 0) return content;
  throw new Error("Lava response: missing choices[0].message.content");
}

export async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const key = requireApiKey();

  // TODO: add query params (e.g. metadata) if you need Lava request metadata
  const url = `${LAVA_FORWARD_BASE}?u=${encodeURIComponent(UPSTREAM_CHAT_COMPLETIONS_URL)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      // TODO: add generation params (temperature, max_tokens, etc.) as needed
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const bodyText = await res.text();

  if (!res.ok) {
    throw new Error(`Lava gateway HTTP ${res.status}: ${bodyText}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error(`Lava response not JSON: ${bodyText.slice(0, 800)}`);
  }

  return extractOpenAIAssistantText(data);
}

function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  if (fence) return fence[1].trim();
  return trimmed;
}

/** Parse JSON from assistant output (may strip ``` fences). */
export function parseAssistantJson(raw: string): unknown {
  return JSON.parse(extractJsonBlock(raw));
}
