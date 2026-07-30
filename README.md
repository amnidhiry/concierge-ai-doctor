# Concierge AI Doctor — demo-day prototype

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
  [concierge] API key loaded from: .env
  ```
  `.env` takes precedence over the shell.
- **Without a key, Step 2 fails cleanly** with an in-UI "API key not configured" state and setup instructions. The rest of the app works.

### Optional config

| Variable | Default | Notes |
|---|---|---|
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Structured output is forced via tool + `tool_choice`, which works on every current model — swap in `claude-opus-5` or `claude-sonnet-5` without code changes. |
| `ANTHROPIC_MAX_TOKENS` | `8000` | Raise if you see a `max_tokens` stop reason on long cases. |

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

### Mocked or placeholder

| | |
|---|---|
| **Physician panel list** | Static sample rows from `src/domain/mockPanel.js`, below the one live case. Marked as samples and not selectable. |
| **"Join Video Visit"** | Placeholder modal. No LiveKit, no WebRTC, no fake call UI. |
| **Login / auth** | None. The dashboard shows a hardcoded physician identity. |
| **Persistence** | React context only. A page refresh clears everything. |
| **"Sending" a response** | Updates state and advances the flow. No notification or delivery. |
| **Intake coordinator turns** | Static scripted prompts in the chat, not model output. Labelled as coordinator, not AI. |
| **Panel economics figures** | Target operating model for the pitch, not measured results. Labelled as such on the page. |

---

## Two design decisions worth explaining

**Structured output uses a tool, not `output_config.format`.** The obvious way to get JSON out of the model is `output_config: { format: { type: 'json_schema', ... } }` — but that feature isn't available on Sonnet 4.6. Instead the synthesis call defines one tool and forces it with `tool_choice: { type: 'tool', name: ... }`. The model *must* emit a `tool_use` block, and its `input` arrives already parsed by the SDK. No JSON-from-prose extraction, so nothing breaks on a stray code fence, and it works on every current model.

**The Step 2 progress indicator doesn't fake its stages.** The tempting version is a stage sequence — "parsing chart… extracting findings… drafting response…" — advancing on timers. Those timings would be invented. A progress bar that lies about its stages undermines the one thing this demo exists to prove, so instead it shows a real elapsed-second counter off the in-flight request plus an indeterminate sweep, which is the honest shape of a non-streaming call.

---

## Architecture

```
server/anthropicProxy.js      Vite middleware: POST /api/synthesize (Node — holds the key)
src/prompts/                  System prompt + tool schema, isolated from UI
src/domain/                   Framework-free data shapes (the Flutter-port boundary)
src/lib/api.js                Client fetch wrapper; one error contract
src/context/DemoProvider.jsx  Session state for Steps 1–4
src/components/ui/            Primitives + AiDraftBadge
src/components/demo/          Intake, processing, draft document, errors
src/components/physician/     Panel, editor, video placeholder
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

### 3. LiveKit video

`src/components/physician/JoinVideoVisitButton.jsx` is structurally isolated for this. It owns its trigger, modal, and state, and receives only a patient name — so real video means replacing that file's body (room-token endpoint, `<LiveKitRoom>`, track subscriptions, device permissions) with nothing else touched.

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

React 18 · Vite 5 · Tailwind CSS 3.4 (utility classes only, no compiler-dependent features) · React Router 6 · `@anthropic-ai/sdk`
