# yhack2026

Repo for YHack26.

## Lava / LLM

- Set **`LAVA_API_KEY`** to your Lava gateway secret key (Dashboard → Gateway → Secrets; values look like `aks_live_…`). The repair agent reads it in `agent/llm.ts` for `Authorization: Bearer …` on the forward endpoint.
- Run the pipeline locally: **`npm install`** then **`npm run dev`** (runs `agent/testHarness.ts` via `tsx`).
