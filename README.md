# THE ALIBI — MVP Setup Guide

## Architecture Overview
```
Frontend (React + Vite)  →  Backend (Express)  →  Agent (Claude tool-use loop)
     Port 5173                 Port 3001              Anthropic API
         ↓                         ↓
    Auth0 (JWT)             MongoDB + Gmail MCP + GCal MCP
```

---

## Person 1 — Agent Architect
**File: `agent.js`**

### Setup
```bash
npm install @anthropic-ai/sdk
```

### What you own
- The 6-tool agentic loop in `agent.js`
- Tool definitions and execution logic
- The `runAlibiAgent(input, onStep)` function
- Making sure each tool output genuinely informs the next step

### Testing your agent solo (no server needed)
```bash
node test-agent.js
```

Create `test-agent.js`:
```js
const { runAlibiAgent } = require('./agent');
runAlibiAgent({
  name: "Sarah",
  relationship: "close friend",
  failure_type: "forgot their birthday",
  time_elapsed: "3 days ago",
  prior_failures: false,
  budget: "20_50",
  medium: "text",
}, (step) => console.log("STEP:", step.tool, "→", step.result))
.then(result => console.log("FINAL:", JSON.stringify(result, null, 2)));
```

### Key thing to verify
The agent calls ALL 6 tools autonomously — not just 1-2. If it stops early, add to the system prompt: "You MUST call all 6 tools before finishing."

---

## Person 2 — Integrations & Backend
**File: `server.js`**

### Setup
```bash
npm install express cors mongodb express-oauth2-jwt-bearer dotenv @anthropic-ai/sdk
```

### Environment variables
Copy `.env.example` to `.env` and fill in:
```
ANTHROPIC_API_KEY=sk-ant-...
MONGO_URI=mongodb+srv://...   # Use MongoDB Atlas free tier
AUTH0_DOMAIN=your-app.auth0.com
AUTH0_AUDIENCE=https://alibi-api
PORT=3001
```

### Auth0 Setup (30 min)
1. Go to manage.auth0.com → Create Application → Single Page App
2. Create API → Identifier: `https://alibi-api`
3. Set Allowed Callback URLs: `http://localhost:5173`
4. Set Allowed Logout URLs: `http://localhost:5173`
5. Set Allowed Web Origins: `http://localhost:5173`
6. Copy Domain and Client ID to `.env` and to `src/main.jsx`

### MongoDB Atlas Setup (15 min)
1. Go to mongodb.com/atlas → Free tier → Create cluster
2. Add your IP to allowlist
3. Create database user
4. Copy connection string to `.env`

### Run backend
```bash
cd backend && npx tsx server.js
```

### Google OAuth + Gmail draft (hackathon-simple)

Tokens are kept **in memory** on the server (one demo user); restart clears the session.

**1. Env (in `backend/.env`)**
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

**2. Google Cloud Console**
- Create a project → **APIs & Services** → enable **Gmail API**.
- **OAuth consent screen** (External / Test users as needed).
- **Credentials** → **OAuth 2.0 Client ID** → Application type **Web application**.
- **Authorized redirect URIs**: `http://localhost:3001/api/auth/google/callback` (must match `GOOGLE_REDIRECT_URI` exactly).

**3. Connect**
1. Start the backend, then open: `http://localhost:3001/api/auth/google/start`
2. Complete Google consent; you should see: *Google connected — you can close this tab.*

**4. Check status**
```bash
curl http://localhost:3001/api/auth/status
```
Expect `{ "ok": true, "connected": true }` after linking.

**5. Create a draft (not send)**
```bash
curl -X POST http://localhost:3001/api/send-apology-email \
  -H "Content-Type: application/json" \
  -d '{"to":"you@gmail.com","subject":"Hello","body":"Draft body"}'
```
If not connected: `401` with `{ "ok": false, "error": "NOT_AUTHENTICATED" }`.  
Omit `to` to draft to yourself (uses the signed-in Gmail address).

### Testing endpoints
```bash
# Health check
curl http://localhost:3001/health

# Test agent (need JWT — use Auth0 test token from dashboard)
curl -X POST http://localhost:3001/api/run-agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_JWT" \
  -d '{"name":"Sarah","relationship":"close friend","failure_type":"forgot birthday"}'
```

---

## Person 3 — Frontend & Demo
**File: `src/App.jsx`**

### Setup
```bash
npm create vite@latest alibi-frontend -- --template react
cd alibi-frontend
npm install @auth0/auth0-react
# Copy App.jsx into src/
```

### Auth0 frontend config
Edit `src/main.jsx`:
```jsx
import { Auth0Provider } from '@auth0/auth0-react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Auth0Provider
    domain="YOUR_AUTH0_DOMAIN"        // from Person 2
    clientId="YOUR_AUTH0_CLIENT_ID"   // from Person 2
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: "https://alibi-api",
    }}
  >
    <App />
  </Auth0Provider>
);
```

### Run frontend
```bash
npm run dev
# Runs at http://localhost:5173
```

### Demo checklist for presentation
- [ ] Pre-fill form with a real confession (practice this)
- [ ] Make sure all 6 steps animate in real time
- [ ] "Draft in Gmail" button actually creates a draft
- [ ] "Add to Calendar" button actually creates the event
- [ ] Have a backup screenshot in case WiFi dies

---

## Full Stack Run (all 3 together)
```bash
# Terminal 1 — Backend
cd alibi && node server.js

# Terminal 2 — Frontend  
cd alibi-frontend && npm run dev

# Open http://localhost:5173
```

---

## Prize Submission Checklist
- [ ] Devpost submission with demo video
- [ ] GitHub repo with commits during hackathon hours (11am Sat – 11am Sun)
- [ ] All team members checked in at OC Marsh
- [ ] At least 1 member present for judging Sunday
- [ ] Select tracks: Personal AI Agents, Most Creative, Best UI/UX
