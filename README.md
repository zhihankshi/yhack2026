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

## What is The Alibi?

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

## Architecture

```
Frontend (React + Vite)  →  Backend (Express + Node)  →  OpenAI (via Lava Gateway)
     Port 5173                    Port 3001               tool-use agentic loop
                                      │
                          ┌───────────┼───────────────┐
                          ▼           ▼               ▼
                    Gmail API    Tremendous API   Google Calendar
                    (apology     (brand gift      (follow-up
                     drafts)      cards)           scheduling)
```

The agent runs an **OpenAI tool-use agentic loop**, proxied through **Lava's AI Gateway** for usage tracking and cost metering. The frontend streams agent steps in real time via SSE.

---

## Environment Variables

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|---|---|
| `PORT` | Backend port (default: `3001`) |
| `OPENAI_API_KEY` | OpenAI API key |
| `LAVA_API_KEY` | Lava AI Gateway API key |
| `LAVA_BASE_URL` | Lava gateway base URL (from your Lava dashboard) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3001/api/auth/google/callback` |
| `TREMENDOUS_API_KEY` | Tremendous sandbox key (prefix: `TEST_`) |
| `TREMENDOUS_API_URL` | `https://testflight.tremendous.com` |
| `TREMENDOUS_ENVIRONMENT` | `testflight` |
| `FUNDING_SOURCE_ID` | Tremendous funding source ID |
| `CAMPAIGN_ID` | Tremendous campaign ID |
| `GIFT_TIER_AMOUNT_LOW` | Optional tier override (USD) |

---

## Service Setup

### Lava AI Gateway (10 min)

Lava sits in front of OpenAI as a proxy — it tracks usage, meters costs, and lets you swap models without changing your code.

1. Sign up at [lava.so](https://lava.so/sign-up)
2. Go to **Secret Keys** → **Create secret key** → copy it into `LAVA_API_KEY`
3. Copy your **gateway base URL** from the dashboard into `LAVA_BASE_URL`
4. In your backend, point your OpenAI client at Lava's base URL instead of OpenAI directly:

```js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.LAVA_BASE_URL, // Lava proxies to OpenAI
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.LAVA_API_KEY}`
  }
});
```

All OpenAI calls go through Lava transparently — no other code changes needed. Usage and costs are tracked in the Lava dashboard automatically.

---

### Google OAuth — Gmail & Calendar (20 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → enable **Gmail API** and **Google Calendar API**
3. **OAuth consent screen** → External → add your email as a test user
4. **Credentials** → **OAuth 2.0 Client ID** → Application type: **Web application**
5. Add Authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
6. Copy **Client ID** and **Client Secret** into `.env`

**Link your Google account** (after starting the backend):

```bash
open http://localhost:3001/api/auth/google/start
```

**Verify connection:**

```bash
curl http://localhost:3001/api/auth/status
```

---

### Tremendous Gifting API (sandbox)

The Alibi bypasses the Tremendous Node SDK entirely to avoid versioning conflicts — all requests go directly to their v2 REST API via native `fetch`.

The agent sends a **brand gift card** — recipients choose from whatever brands you configure in your Tremendous Campaign (e.g. Amazon, Starbucks, Subway, Uber Eats, DoorDash). The gift amount is scaled to the severity score Claude assigns to your offense.

**Getting your sandbox API key:**

1. Sign up at [testflight.tremendous.com](https://testflight.tremendous.com) (free, no credit card)
2. Go to **Team Settings** → **Developers** → **Generate API Key**
3. Your key will be prefixed with `TEST_`
4. Copy your **Funding Source ID** (pre-loaded with $100,000 test balance)
5. Create a **Campaign** and copy its ID

Every sandbox account replenishes $100,000 in test balance daily.

**Offense severity → gift tier mapping:**

| AI Score | Gift Amount |
|---|---|
| `<= 0` | No gift sent |
| `< 20` | $15 |
| `< 50` | $30 |
| `< 100` | $75 |
| `>= 100` | $150 |

**Test a gift order directly:**

```bash
curl -X POST http://localhost:3001/api/send-gift \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_name": "Taylor Smith",
    "recipient_email": "taylor@example.com",
    "ai_evaluation_score": 62,
    "failure_id": "failure_123"
  }'
```

`failure_id` is reused as Tremendous `external_id` for idempotency — prevents double-sending if the agent retries.

---

## Project Structure

```
the-alibi/
├── agent/                  # AI agent logic (TypeScript, Claude tool-use loop)
│   └── testHarness.ts      # Standalone agent test runner
├── backend/                # Express API server
│   ├── server.js           # Entry point (port 3001)
│   ├── routes/             # API route handlers
│   ├── controllers/        # Business logic
│   └── services/           # Gmail, Tremendous, Calendar services
├── frontend/               # React + Vite UI
│   ├── src/
│   │   ├── components/     # React components (KnightScene, forms, etc.)
│   │   └── App.jsx         # Main app + agent streaming
│   └── public/             # Static assets (3D models, etc.)
├── package.json            # Root — agent test harness
└── tsconfig.json
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/auth/google/start` | Begin Google OAuth (Gmail) |
| `GET` | `/api/google/auth` | Begin Google Calendar OAuth |
| `GET` | `/api/auth/status` | Check Google connection status |
| `POST` | `/api/run-agent` | Run the full Sir Alibi agent |
| `POST` | `/api/send-apology-email` | Create Gmail draft with apology |
| `POST` | `/api/send-gift` | Send gift card via Tremendous |

**Test the agent:**

```bash
curl -X POST http://localhost:3001/api/run-agent \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah",
    "relationship": "close friend",
    "failure_type": "forgot birthday"
  }'
```

---

## Testing the Agent Standalone

No server needed — runs the Claude tool-use loop directly:

```bash
# From project root
npm run dev
```

This executes `agent/testHarness.ts` via `tsx`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Three.js / React Three Fiber |
| Backend | Node.js, Express 5 |
| AI Agent | OpenAI (tool-use agentic loop) |
| AI Gateway | Lava (usage tracking, cost metering) |
| Auth | Google OAuth 2.0 |
| Integrations | Gmail API, Google Calendar API, Tremendous API |
| Streaming | Server-Sent Events (SSE) |

---

## Agent Flow

```
1. User confesses their crime
         ↓
2. OpenAI assesses offense severity (0–150 score)
         ↓
3. OpenAI constructs the alibi + narrative
         ↓
4. OpenAI drafts a personalized apology email → Gmail draft
         ↓
5. OpenAI selects gift tier → Tremendous sends brand gift card (Amazon, Starbucks, etc.) to recipient
         ↓
6. OpenAI schedules follow-up → Google Calendar event
         ↓
7. Done. You just show up.
```

---

## Community & Contact

- **GitHub Issues** — bugs and feature proposals
- **Built at YHack 2026** by the Sir Alibi team

---

## License

MIT
