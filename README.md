# yhack2026

Repo for YHack26.

## Lava / LLM

Configuration lives in **`agent/config.ts`** and reads **environment variables** (e.g. a project `.env` loaded by your shell or tooling). **Switch models and caps by editing env only.**

| Variable | Required | Default |
| --- | --- | --- |
| **`LAVA_API_KEY`** | yes | — |
| **`MODEL_FAST`** | no | `gpt-4o-mini` (research + reason) |
| **`MODEL_WRITE`** | no | `gpt-4o-mini` (write step) |
| **`MAX_TOKENS_RESEARCH`** | no | `400` |
| **`MAX_TOKENS_REASON`** | no | `300` |
| **`MAX_TOKENS_WRITE`** | no | `600` |
| **`TEMPERATURE`** | no | `0.4` |
| **`DEMO_MODE`** | no | unset (`false`) — see below |

- **`LAVA_API_KEY`**: Lava gateway secret (Dashboard → Gateway → Secrets; e.g. `aks_live_…`). Used as `Authorization: Bearer …` on the forward endpoint (`agent/llm.ts`).

### `DEMO_MODE=true`

Use for live demos: **same pipeline and honest `debug.usedFallback`**, but:

- **Write step** uses **`MODEL_FAST`** (cheap model for all steps).
- **Lower `max_tokens`** (research / reason / write) and **temperature 0.3**.
- **Shorter prompts** via `agent/demoMode.ts` (fewer gift ideas, no optional framing in write, terse bullets).

PowerShell: `$env:DEMO_MODE = "true"; npm run dev`

### Golden snapshots (regression)

Running **`npm run dev`** writes each case’s JSON to **`agent/__snapshots__/<slug>.json`**. Baseline cases include **`anniversary`** and **`coworker-birthday`**. After intentional prompt changes, diff these files in git to spot contract or tone drift.

Run the pipeline locally: **`npm install`** then **`npm run dev`** (runs `agent/testHarness.ts` via `tsx`). The harness prints resolved model + token limits at startup, then **`runAlibiAgent(input)`** output as JSON (stable contract in `agent/runAgentContract.ts`).
