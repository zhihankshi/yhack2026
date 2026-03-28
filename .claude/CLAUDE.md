**Frontend & Demo Breakdown (Person 3)**  
- **Scope**: Own the judge-facing experience: React UI (inputs, progress, outputs), live demo flow, and ElevenLabs playback.

- **Key Responsibilities**
  - Input flow: form for “who you failed,” severity slider, relationship type select, optional context field.
  - Progress display: stepper showing Research → Reasoning → Writing → Action → Observe with live statuses and timestamps.
  - Output cards: alibi narrative, apology draft, gift recommendation with link, follow-up schedule confirmation.
  - Media: ElevenLabs text-to-speech for the alibi narrative (play/pause UI).
  - Demo readiness: a scripted flow the judge follows; resilient to flaky network (graceful loading/error states).

- **Architecture / Components**
  - `App` shell with layout and theme tokens.
  - `InputForm` component: controlled fields, validation, submit triggers agent run.
  - `ProgressPanel` component: step list with status (pending/active/done/error), optional sub-events.
  - `OutputCards`:
    - `AlibiCard` (narrative + TTS play).
    - `ApologyCard` (apology text + copy).
    - `GiftCard` (gift idea, price range, CTA link).
    - `FollowUpCard` (scheduled time, “Add to calendar” / confirmed).
  - `Toast`/`Banner` for errors/network issues.
  - `Loader` and skeletons for outputs while steps run.
  - ElevenLabs hook/service: `useTTS(text)` returning audio URL, playing state, errors.

- **Data Flow (happy path)**
  1) User submits form → call backend to start agent run (returns runId).  
  2) Poll or stream step updates → update `ProgressPanel`.  
  3) When artifacts arrive, populate cards; enable TTS on alibi text.  
  4) Show follow-up scheduled status and gift link.

- **States to Handle**
  - Idle → Running → Partial results → Completed.  
  - Errors per step (recover with retry or friendly message).  
  - TTS failures (fallback: text only).  
  - Network slow: show spinners/skeletons; keep UI responsive.

- **Demo Script (judge confession moment)**
  - Prompt script: Judge says “I forgot Sarah’s birthday; she’s my coworker.”  
  - You narrate: click “Run”; call out each step lighting up; when alibi appears, hit “Play” (ElevenLabs); copy/paste apology; show gift link and follow-up timestamp.  
  - Keep a canned successful run cached in case live call is slow.

- **Time Breakdown (starting 8pm, done by ~11am)**
  - 8pm–10pm: Frontend scaffold, layout, input form with validation; dummy data for outputs.
  - 10pm–1am: Progress UI + output card components wired to mock data; skeleton/loading/error states.
  - 1am–3am: ElevenLabs integration (TTS hook, play controls); audio UI polish.
  - 3am–5am: Wire to real agent endpoints (stream/poll), basic retries, copy buttons.
  - 5am–7am: Visual polish, spacing, responsive tweaks; add cached “golden path” run for demo safety.
  - 7am–9am: Full demo run-through; fix showstopper bugs; rehearse script and timing.

- **Risks & Mitigations**
  - Network flake: cached response + retry buttons; clear error banners.
  - Audio fail: text-only fallback, disable play button on error.
  - Latency: optimistic loaders and progress heartbeat; avoid blocking UI.

- **Nice-to-haves if time**
  - Theme toggle (light for projector clarity).  
  - Keyboard-friendly form + copy buttons.  
  - Sub-step logs in ProgressPanel for extra “agent” feel.