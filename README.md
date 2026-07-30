# AuricleHealth — demo-day prototype

A marketing site plus an interactive product demo for a platform that lets shift-based physicians run small cash-pay patient panels asynchronously, with AI handling triage, chart synthesis, and documentation.

The centerpiece is a **real intake-to-synthesis pipeline**. Paste in a synthetic case and it flows end to end — patient intake → live Claude API synthesis → physician review and edit → patient response. There is no scripted content in that path.

> **This is a prototype, not a clinical product.** It is not HIPAA/BAA-grade infrastructure, it has no auth or persistence, and nothing it produces is medical advice. **Use synthetic case data only — never real PHI.**

---

## Setup

```bash
npm install
cp .env.example .env      # then add your Anthropic API key
npm run dev               # http://localhost:5173
```

Open `http://localhost:5173/demo` to run the flow.

### The API key

Put it in `.env` as `ANTHROPIC_API_KEY` (gitignored). It is read **server-side only**, by the Vite dev-server middleware in `server/anthropicProxy.js`. It is deliberately *not* `VITE_`-prefixed, because Vite inlines `VITE_*` vars into the client bundle where anyone can read them in devtools.

Two things worth knowing:

- **A shell-exported key is also picked up.** Vite's `loadEnv(mode, cwd, '')` merges matching `process.env` entries, so if you already have `ANTHROPIC_API_KEY` exported the app works with no `.env` file at all. Convenient, but with two keys around you can bill an org you didn't intend to — so the dev server prints which source it used at startup:
  ```
  [auricle] API key loaded from: .env
  ```
  `.env` takes precedence over the shell.
- **Without a key, Step 2 fails cleanly** with an in-UI "API key not configured" state and setup instructions. The rest of the app works.

### Optional config

| Variable | Default | Notes |
|---|---|---|
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Structured output is forced via tool + `tool_choice`, which works on every current model — swap in `claude-opus-5` or `claude-sonnet-5` without code changes. |
| `ANTHROPIC_MAX_TOKENS` | `8000` | Raise if you see a `max_tokens` stop reason on long cases. |

### LiveKit (video visits)

Video visits need a [LiveKit Cloud](https://cloud.livekit.io) project — free tier is ample for two participants. Create a project, then from its dashboard:

| Variable | Where to find it |
|---|---|
| `LIVEKIT_URL` | Project overview / Settings → Project. Starts with `wss://` |
| `LIVEKIT_API_KEY` | Settings → **Keys**. Starts with `API` |
| `LIVEKIT_API_SECRET` | Settings → **Keys**. **Shown once at creation** — if lost, delete the key and mint a new pair |

All three go in `.env`. The API secret is the credential for the *entire project* — it can mint a token for any room — so it is read only in `server/livekitToken.js` and never reaches the browser. The token endpoint returns the WebSocket URL alongside the token, which is why there is no `VITE_LIVEKIT_URL`: all three values stay server-side and the browser learns only the one non-secret value it needs.

Without these, video shows an in-UI setup message and the rest of the app works normally.

Expect **10–20s** per synthesis on a real case (non-streaming, `effort: medium`). The UI shows real elapsed time and adds a "still working" note past 20s.

---

## What's real vs. what's mocked

Worth being precise about, since the whole point is demonstrating the real pipeline.

### Real

| | |
|---|---|
| **Step 2 synthesis** | Live `POST /v1/messages` call to the Anthropic API on whatever you paste in. Real model output, rendered as-is. |
| **Structured output** | Guaranteed by a single tool + forced `tool_choice`, not prose parsing. |
| **Loading state** | Real elapsed time on the actual in-flight request. |
| **Error handling** | Real typed SDK errors mapped to distinct in-UI states. |
| **Physician edits** | Real, and they persist in state — what you edit is what Step 4 shows. |
| **Step 1 → 4 data flow** | One case object threaded through all four steps. |
| **Step 1 triage agent** | Every patient message is a live model call. Returns the reply *and* structured intake state, rendered live beside the chat. |
| **Emergency routing** | The agent sets `scope: "emergency"` on possible acute presentations, which halts intake and directs to in-person care. |
| **Abuse guards** | Turn caps, rate limits, message-length caps, and off-topic strike escalation — all enforced server-side (`server/guards.js`). |
| **Video visits** | Real LiveKit WebRTC between two browser contexts. Server-issued per-participant tokens, real camera/mic, mute and camera toggles, leave. |

### Mocked or placeholder

| | |
|---|---|
| **Physician panel list** | Static sample rows from `src/domain/mockPanel.js`, below the one live case. Marked as samples and not selectable. |
| **Video participant identity** | Both seats are unauthenticated. Anyone with the visit link can join the room. |
| **Login / auth** | None. The dashboard shows a hardcoded physician identity. |
| **Persistence** | React context only. A page refresh clears everything. |
| **"Sending" a response** | Updates state and advances the flow. No notification or delivery. |
| **Triage agent's opening turn** | Static, so it renders instantly and costs nothing. Every turn after it is a real model call. |
| **Call recording / transcription / screen share** | None. Deliberately out of scope for this pass. |
| **Panel economics figures** | Target operating model for the pitch, not measured results. Labelled as such on the page. |

---

## Running a video visit

The demo moment is two browser tabs connecting to each other for real.

1. Go to **`/demo/physician`** and click **Join video visit** on the case card.
2. Click **Allow camera and join** and accept the browser permission prompt.
3. Click **Copy patient link** in the modal header — that's `/visit/<caseId>`.
4. Open that link in a **second tab** and join. The two tiles connect.

Step 4 of the demo flow also has a patient-side **Join video visit** button, which opens the same route in a new tab.

### Both participants in one browser

This is a demo constraint worth understanding rather than working around:

- **Expect audio feedback.** Each tab plays the other's audio through your speakers and back into your mic. **Use headphones, or mute one side.** The pre-join screen says so.
- **The camera may only attach to one tab.** Chrome generally shares a camera across tabs; Safari often does not. If the second tab reports the camera is busy, it offers **Join with audio only** — an audio-only leg still proves the WebRTC connection.
- **Identity is keyed to role**, not to the browser. LiveKit disconnects an existing participant when a second joins with the same identity, so a shared identity would have each tab silently kicking the other — indistinguishable from a broken connection. `physician-<caseId>` and `patient-<caseId>` avoid that.

Two *physical* devices work too, and avoid both problems — but they need the app reachable over HTTPS or via a tunnel, since `getUserMedia` requires a secure context and a LAN IP over plain HTTP is not one.

### Token scope

`POST /api/livekit-token` takes a `caseId` and a `role`, and returns a token good for exactly one room and one identity:

- Room names are **derived** from the case ID, never accepted verbatim, so a client can't request an arbitrary room and land in another case's visit. `caseId` is charset-validated; `role` must be `physician` or `patient`.
- The grant allows publish and subscribe only. `roomAdmin`, `roomCreate`, and `canPublishData` are all off. TTL is 30 minutes.

---

## Two design decisions worth explaining

**Structured output uses a tool, not `output_config.format`.** The obvious way to get JSON out of the model is `output_config: { format: { type: 'json_schema', ... } }` — but that feature isn't available on Sonnet 4.6. Instead the synthesis call defines one tool and forces it with `tool_choice: { type: 'tool', name: ... }`. The model *must* emit a `tool_use` block, and its `input` arrives already parsed by the SDK. No JSON-from-prose extraction, so nothing breaks on a stray code fence, and it works on every current model.

**The Step 2 progress indicator doesn't fake its stages.** The tempting version is a stage sequence — "parsing chart… extracting findings… drafting response…" — advancing on timers. Those timings would be invented. A progress bar that lies about its stages undermines the one thing this demo exists to prove, so instead it shows a real elapsed-second counter off the in-flight request plus an indeterminate sweep, which is the honest shape of a non-streaming call.

---

## Architecture

```
server/devApi.js              Vite middleware: all /api routes (Node — holds the keys)
server/livekitToken.js        LiveKit token minting + room/role validation
server/guards.js              Triage abuse and cost guards
src/prompts/                  System prompt + tool schema, isolated from UI
src/domain/                   Framework-free data shapes (the Flutter-port boundary)
src/lib/api.js                Client fetch wrapper; one error contract
src/context/DemoProvider.jsx  Session state for Steps 1–4
src/components/ui/            Primitives + AiDraftBadge
src/components/demo/          Intake, processing, draft document, errors
src/components/physician/     Panel, editor, video placeholder
src/components/video/         LiveKit call UI (lazy-loaded chunk)
src/pages/                    Marketing pages
src/pages/demo/               Demo flow routes
```

**UI and data shape are kept separate on purpose.** `src/domain/models.js` holds plain factories and normalizers with no React, no browser APIs, no framework types — those are the structures that become Dart classes in a Flutter port, and the boundary a real backend would serve. Components never construct case shapes inline.

**The prompt is isolated.** `src/prompts/synthesisPrompt.js` holds the system prompt, the tool schema, and the user-message builder, so prompt iteration never touches UI code. Its framing constraints are product behavior rather than boilerplate: the output is shown to a patient after a physician edits it, so the model is instructed never to produce settled-diagnosis or act-on-this text, and to route anything it can't determine into `data_gaps` instead of estimating it.

### The "pending physician review" signal

`AiDraftBadge` is one component used everywhere that state appears — patient view, physician queue, marketing pages. Kept visually identical, the label becomes a status indicator users learn to read at a glance, and its absence becomes meaningful: when it flips to **physician reviewed** (green, check glyph), a named clinician has taken responsibility for the content. The violet `draft` color is reserved for this state and used nowhere else in the palette.

### Design system

Defined in `tailwind.config.js` before any component was written, so nothing invents colors inline.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#12232B` | Deep blue-graphite — body text, dark panels |
| `slate` | `#5B7482` | Secondary text, metadata |
| `mist` | `#DEE7EA` | Dividers, hairlines |
| `paper` | `#F6F8F9` | Page background (cool off-white) |
| `pulse` | `#14587F` | Primary action, links |
| `draft` | `#6D5BA6` | *Reserved:* AI-generated, pending review |
| `verified` | `#2F6B4F` | *Reserved:* physician-reviewed |

Type: **Newsreader** (display only) + **IBM Plex Sans** (body) + **IBM Plex Mono** (clinical field labels, timestamps). Cool and low-chroma throughout, deliberately avoiding warm-cream/terracotta and dark-mode-plus-neon defaults — this product asks people to trust it with serious decisions.

**Motion** appears in exactly two places: scroll reveals on marketing sections, and the Step 2 processing state. Both are adapted from [React Bits](https://reactbits.dev) patterns (`AnimatedContent`/`FadeContent`) and reimplemented as ~40 lines of IntersectionObserver plus CSS — no animation dependency, and they inherit the design tokens. No particle, glitch, or scramble effects. `prefers-reduced-motion` is handled globally in `src/index.css` (all animation and transition disabled), so a component added later can't reintroduce motion by accident.

The chat UI follows the [`chatscope/chat-ui-kit-react`](https://github.com/chatscope/chat-ui-kit-react) component split (`MessageList` / `Message` / `MessageInput`) but is built here — the component tree was worth borrowing, the default CSS was not.

---

## Next steps

### 1. Deployment (needed before this leaves localhost)

The synthesis proxy is **Vite dev-server middleware**, so `npm run build` produces a static bundle with no `/api/synthesize` endpoint. To deploy, port `server/anthropicProxy.js` to a serverless function — Vercel `api/synthesize.js`, a Netlify function, or a Cloudflare Worker. The handler body transfers nearly as-is; only the request/response adapter changes.

### 2. Real backend

Today: React context, cleared on refresh. Needed:

- **Persistence** — Postgres for cases, intake, drafts, and an append-only edit history (who changed what, when). A physician-reviewed medical response needs an audit trail.
- **Auth** — patient and physician roles with real sessions. The current physician identity is hardcoded.
- **Async delivery** — sending a response should actually notify the patient (email/SMS/push) rather than advancing local state.

### 3. Video visit hardening

Video is now real (Phase 2), but two things stand between it and production:

- **Per-participant auth.** The token endpoint issues a token to anyone who asks for a `caseId` and a `role`. Nothing verifies that the caller *is* that patient or that physician, so the visit link is effectively a bearer credential — anyone holding it can join. A real version issues tokens only to an authenticated session whose identity is checked against the case's participants, and treats the room name as an internal detail rather than something derivable from a URL.
- **Lifecycle.** There is no waiting room, no scheduling, no "physician has joined" notification, and no server-side room cleanup. Rooms are created implicitly on first join and expire on LiveKit's default timeout.

Also out of scope by design and easy to add later: recording (needs a retention policy and consent capture before it should exist at all), transcription, and screen sharing.

### 4. Synthesis improvements

- **Streaming.** The call is non-streaming, which is why Step 2 shows an indeterminate indicator. Switching to SSE would let the draft materialize token by token — more honest still, and it removes the 10–20s dead wait.
- **Prompt caching.** The system prompt plus tool schema is ~2.1k input tokens on every call, byte-identical each time. A `cache_control` breakpoint would bring that to ~0.1× cost on repeat calls.
- **Chart parsing.** PDF and DOCX are rejected today. A parser (or the Files API for PDFs) would remove the copy-paste step, which is the most common real-world intake format.
- **Model evaluation.** `claude-sonnet-4-6` is the default. Worth A/B-ing against `claude-opus-5` on real synthetic cases for differential quality, and sweeping `effort` for the latency/quality tradeoff.

### 5. Flutter port

`src/domain/models.js` is the intended boundary — plain shapes, no framework coupling. `makeIntake`, `makeCase`, `normalizeDraft`, and the `CaseStatus` union translate to Dart directly. The synthesis contract (`POST /api/synthesize` → `{ draft, meta }`) is transport-agnostic and would be shared by both clients.

### 6. Compliance (before any real patient data)

Out of scope for this pass and genuinely blocking for real use: a BAA with the model provider, encryption at rest and in transit, access logging, a data-retention policy, and a documented clinical-scope boundary with escalation paths for urgent findings.

---

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server with the synthesis proxy at `:5173` |
| `npm run build` | Static production bundle (**no** API endpoint — see Next steps) |
| `npm run preview` | Serve the build; the proxy is attached here too |

## Stack

React 18 · Vite 5 · Tailwind CSS 3.4 (utility classes only, no compiler-dependent features) · React Router 6 · `@anthropic-ai/sdk` · `livekit-server-sdk` · `@livekit/components-react`
