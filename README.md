<<img width="1338" height="851" alt="image" src="https://github.com/user-attachments/assets/0d93f9af-2edb-401d-903f-2b1fb1a21c2b" />
>

# Sir Alibi 🛡️

> **AI-powered social recovery agent** — confess what you did wrong, let Sir Alibi craft the perfect apology, draft a Gmail, schedule a Calendar follow-up, and send a real gift card (Amazon, Starbucks, Subway, and more) matched to the severity of what you did. Powered by OpenAI via Lava AI Gateway. Built at YHack 2026.

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#api-endpoints">API Reference</a> ·
  <a href="#tech-stack">Tech Stack</a>
</p>

<p align="center">
  <img alt="Node 18+" src="https://img.shields.io/badge/node-18%2B-brightgreen">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="Built at YHack 2026" src="https://img.shields.io/badge/built%20at-YHack%202026-orange">
  <img alt="Powered by OpenAI" src="https://img.shields.io/badge/AI-OpenAI-412991">
  <img alt="Lava Gateway" src="https://img.shields.io/badge/gateway-Lava-ff4d00">
  <img alt="Tremendous" src="https://img.shields.io/badge/gifts-Tremendous%20API-red">
</p>

---

## What is Sir Alibi?

You forgot. You flaked. You went MIA.

**Sir Alibi** is your autonomous relationship-repair agent. Tell it what you did wrong — it figures out the severity, constructs the alibi, writes the apology email, sends a real brand gift card (Amazon, Starbucks, Subway, etc.) scaled to how badly you messed up, and schedules the follow-up. You just show up.

```
Confess → Assess → Alibi → Apology → Gift → Follow-up
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- Google Cloud project (Gmail API enabled)
- OpenAI API key
- Lava account (AI gateway)
- Tremendous sandbox account

### 1. Clone the repo

```bash
git clone https://github.com/your-org/the-alibi.git
cd the-alibi
```

### 2. Install dependencies

```bash
# Root (agent test harness)
npm install

# Backend (Express API)
cd backend && npm install

# Frontend (React + Vite)
cd ../frontend && npm install
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your keys — see Environment Variables below
```

### 4. Run the app

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 3001)
cd backend
node server.js
```

```bash
# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Then open **http://localhost:5173** and confess your crime.

---

## Architecture (how the pieces connect)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite, :5173)                                         │
│  • Form → POST /api/run-agent (SSE) — optional Auth0 Bearer token       │
│  • “Draft in Gmail” → POST /api/send-apology-email                      │
│  • “Schedule follow-up” → POST /api/schedule-followup (stub success)    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Backend (Express, :3001) — backend/server.js                           │
│  • Loads agent via dynamic import of agent/runAlibiAgent.ts (tsx/node)  │
│  • Google OAuth in-memory session → Gmail drafts (googleapis)           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Agent (TypeScript) — agent/runAlibiAgent.ts                            │
│  • Perception → Research → [pause gate] → Reason → Write                │
│  • LLM: Lava forward → OpenAI-compatible chat/completions (agent/llm.ts)│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agentic reasoning: what “agentic” means here

The workflow is **deliberately staged**. Each step has its own **system prompt**, **user payload** (including outputs from earlier steps), and **Zod schema** (`agent/schemas.ts`). The model is asked for **one JSON object** per step; `callLLMJson` (`agent/llmJson.ts`) parses and validates it, with **one automatic retry** if JSON or schema validation fails.

### Pipeline (execution order)

| Step | File | Role |
|------|------|------|
| **1. Perception** | `agent/steps/perception.ts` | Reads the incident text + optional **integration metadata** (`agent/perceptionContext.ts`: Gmail signals, calendar hints, user-provided budget/location/urgency). Produces `situationSummary`, `signals`, `confidence`, `assumptions`, `missingInfo`, up to **2** `clarifyingQuestions`, and `constraints` (e.g. HR-safe, urgency). |
| **2. Research** | `agent/steps/research.ts` | Consumes a formatted **perception block** + scenario. Produces gift ideas (with search queries / optional links), clarifiers, and a suggested follow-up window. |
| **3. Pause gate** | `agent/incident.ts` → `shouldPausePipeline` | **Agentic safety / product behavior**: if research or perception surfaces clarifiers under **high-stakes** heuristics (e.g. birthday/anniversary patterns + clarifying questions, or perception questions with low confidence in stakes), the pipeline **stops before Reason/Write** and returns `status: "needs_user_input"` with deterministic fallbacks so the UI can ask the human first (`agent/runAlibiAgent.ts`). |
| **4. Reason** | `agent/steps/reason.ts` | Strategy: `incidentType`, severity, tone, `alibiPolicy`, plan, risks—grounded in research + perception. |
| **5. Write** | `agent/steps/write.ts` | Final messages: apology + follow-up, respecting `alibiPolicy`. |

So “reasoning” is not one monolithic answer: it is **factored** so later steps cannot ignore structured earlier outputs unless the run is intentionally paused or a **fallback** activates (`agent/repairFallbacks.ts`).

### Follow-up timing and “calendar perception”

If a caller attaches `perceptionContext.calendar.nextFreeWindowISO`, `runAlibiAgent` maps that timestamp into **days-from-now** for the bundled follow-up action (`resolveFollowUpDays` in `agent/runAlibiAgent.ts`). The HTTP path today passes **text only** from the backend (`backend/services/runService.js`); `PerceptionContext` is fully wired in **`agent/testHarness.ts`** for judges who want to experiment with rich metadata without changing the UI.

### Demo / cost controls

Set `DEMO_MODE=true` (see `agent/demoMode.ts` + `agent/config.ts`) for smaller prompts and token caps across steps.

---

## External APIs and services

| Service | Where | Purpose |
|---------|--------|--------|
| **Lava** | `agent/llm.ts` — `POST https://api.lava.so/v1/forward?u=<encoded OpenAI chat URL>` | API gateway; Bearer `LAVA_API_KEY`. Forwards to OpenAI-compatible **chat completions**. |
| **OpenAI (via Lava)** | Same request body: `model`, `messages`, `max_tokens`, `temperature` | Actual chat model (defaults e.g. `gpt-4o-mini`; overridable via `MODEL_FAST` / `MODEL_WRITE`). |
| **Google OAuth 2.0 + Gmail API** | `backend/services/googleGmail.js` (`googleapis`) | Scope `gmail.compose`; creates **drafts** only (no auto-send). Tokens stored **in memory** on the server (restart clears). |
| **Auth0** (optional) | `frontend/src/main.jsx`, `App.jsx` | SPA login; frontend attaches `Authorization: Bearer` when a token exists. **Backend does not enforce JWT** in the current Express routes—runs work without Auth0 for local judging. |
| **ElevenLabs** (optional) | `frontend/src/hooks/useTTS.js` via `VITE_ELEVENLABS_API_KEY` | Text-to-speech if enabled in the UI. |

---

## Repository map

| Path | Purpose |
|------|---------|
| `agent/runAlibiAgent.ts` | Orchestrates the full pipeline, pause logic, response assembly |
| `agent/steps/*.ts` | Perception, Research, Reason, Write LLM steps |
| `agent/llm.ts`, `agent/llmJson.ts` | Lava + JSON extraction/validation |
| `agent/runAgentContract.ts` | Public **`RunAgentResponse`** Zod schema (API contract) |
| `agent/perceptionContext.ts` | Optional structured Gmail/Calendar/user-fields for perception |
| `backend/server.js` | Express app, mounts `/api` routes |
| `backend/controllers/agentController.js` | SSE wrapper around `runAlibiAgent` |
| `backend/services/runService.js` | Builds agent text from form body; maps agent JSON → UI bundle |
| `frontend/src/App.jsx` | Form, SSE client, Gmail draft + follow-up buttons |

---

---
