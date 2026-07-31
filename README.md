# AuricleHealth — prototype

A patient-facing site plus an end-to-end demo of **one bounded preventive-cardiology expert-opinion visit**.

```
book  →  AI-assisted intake  →  care packet  →  scheduled 20–30 min voice call
      →  AI-drafted note + patient summary + billing suggestion  →  physician approves
```

The centrepiece is that three of those steps are real. The care packet and the post-call documentation are live Anthropic API calls on whatever you submit; the call is real WebRTC audio between two browser contexts. There is no scripted content in that path.

> **This is a prototype, not a clinical product.** It is not HIPAA/BAA-grade infrastructure, it has no auth or persistence, and nothing it produces is medical advice. **Use synthetic case data only — never real patient information.**

---

## The product this models

Getting this right matters more than any implementation detail below, because the code is shaped by it.

**One call, then done.** A patient books a single scheduled voice visit with a preventive-cardiology physician, 20–30 minutes. The physician reads an assembled care packet beforehand, so the call starts from the record rather than from scratch. Afterwards the patient gets a plain-language summary and a clinical note for their own doctor, both approved by the physician. Then the visit is complete.

**Physicians are the customers.** A preventive-cardiology physician pays $150–300/month for the software. Priced so about two visits a month covers it. They set their own visit price, bill their own patients directly, and keep all of it — there is **no patient subscription and no revenue share**. The platform is not in the middle of the payment.

**What it deliberately is not:**

| | |
|---|---|
| No asynchronous physician messaging | No inbox, no thread, no follow-up queue |
| No longitudinal care | One episodic visit; the patient's own doctor manages their care |
| No prescribing | The physician discusses medication questions; they do not prescribe through this |
| No test ordering | They say which tests would change things, for the patient's own clinician to arrange |
| No recording | Audio is never stored. Transcription is live text only — see [Transcription](#transcription) |
| No risk-score calculation | See [Risk scores](#risk-scores) |

**No patient price appears anywhere on the site.** There is no payment path in this build and the patient price has not been set, so quoting one would be inventing a commercial fact. `/services` — which used to carry three priced tiers — now redirects to `/the-visit`, a scope explainer with no pricing.

### Risk scores

Nothing in this build calculates, estimates, or infers a cardiovascular risk score. Not PREVENT, not the ASCVD pooled cohort equations, not SCORE2, QRISK, or Framingham.

Validated risk equations need a complete, specific input set, and records submitted to a service like this are routinely missing at least one required variable. A score computed from a partial record is a fabricated number wearing a clinical name — the most dangerous possible output, because it looks exactly like a real one and gets acted on.

So the rule, enforced in the prompts and asserted in the tests:

- A score **stated in the submitted material** is reported as supplied — its name, its value verbatim, and where in the material it appears. Never recomputed, never adjusted.
- Otherwise the packet says plainly that **no score was calculated**, and names the inputs that would be needed.
- No qualitative substitute that functions as a score ("roughly intermediate risk"). Naming the missing inputs is useful; producing a number is not.

The rule lives in one place — `RISK_SCORE_RULE` in `src/prompts/carePacketPrompt.js` — and is interpolated into both clinical system prompts, so the two cannot drift. `tests/prompts.test.js` fails if either prompt stops containing it.

---

## Setup

```bash
npm install
cp .env.example .env      # then add your Anthropic API key
npm run dev               # http://localhost:5173
```

Open `http://localhost:5173/demo` to run the flow.

### The Anthropic key

Put it in `.env` as `ANTHROPIC_API_KEY` (gitignored). It is read **server-side only** — by `server/api.js`, reached either through the Vite plugin in development or `server/prod.js` in the container. It is deliberately *not* `VITE_`-prefixed, because Vite inlines `VITE_*` vars into the client bundle where anyone can read them in devtools.

Two things worth knowing:

- **A shell-exported key is also picked up.** Vite's `loadEnv(mode, cwd, '')` merges matching `process.env` entries, so if you already have `ANTHROPIC_API_KEY` exported the app works with no `.env` file at all. Convenient, but with two keys around you can bill an org you didn't intend to — so the dev server prints which source it used at startup:
  ```
  [auricle] anthropic key from: .env
  ```
  `.env` takes precedence over the shell.
- **Without a key, both model calls fail cleanly** with an in-UI "API key not configured" state and setup instructions. The rest of the app works.

### Optional config

| Variable | Default | Notes |
|---|---|---|
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Structured output is forced via tool + `tool_choice`, which works on every current model — swap in `claude-opus-5` or `claude-sonnet-5` without code changes. |
| `ANTHROPIC_MAX_TOKENS` | `8000` | Raise if you see a `max_tokens` stop reason on long cases. |

### LiveKit (the voice call)

The call needs a [LiveKit Cloud](https://cloud.livekit.io) project — the free tier is ample for two participants. Create a project, then from its dashboard:

| Variable | Where to find it |
|---|---|
| `LIVEKIT_URL` | Project overview / Settings → Project. Starts with `wss://` |
| `LIVEKIT_API_KEY` | Settings → **Keys**. Starts with `API` |
| `LIVEKIT_API_SECRET` | Settings → **Keys**. **Shown once at creation** — if lost, delete the key and mint a new pair |

All three go in `.env`. Without them the call shows an in-UI setup message and the rest of the app works normally.

Expect **10–20s** per model call on a real case (non-streaming, `effort: medium`). The UI shows real elapsed time and adds a "still working" note past 20s.

---

## Secret boundaries

The one invariant worth stating separately, because breaking it is a single careless rename:

**No credential is ever `VITE_`-prefixed, and none is ever read outside `server/` or `vite.config.js`.**

- `ANTHROPIC_API_KEY` is read only in `server/devApi.js`.
- `LIVEKIT_API_SECRET` is read only in `server/livekitToken.js`. It is the credential for the *entire* LiveKit project — it can mint a token for any room — so it never leaves Node.
- **There is deliberately no `VITE_LIVEKIT_URL`.** The token endpoint returns the WebSocket URL *alongside* the token, so all three LiveKit values stay server-side and the browser learns only the one non-secret value it needs, at the moment it needs it. That asymmetry is the whole reason the URL is in the response body rather than the bundle.
- `.env` is gitignored, along with `.env.*` (except `.env.example`). `npm run check` fails if that ignore rule disappears.

`npm run check` enforces all of this mechanically — see [Automated checks](#automated-checks).

---

## What's real vs. mocked vs. future

Worth being precise about, since the point is demonstrating the real pipeline.

### Real

| | |
|---|---|
| **Care packet** | Live `POST /v1/messages` call on whatever you submit. Real model output, rendered as-is, with a source on every factual claim. |
| **Post-call documentation** | A second live call: clinical note, patient summary, and billing-code suggestion, drafted from the transcript you entered. |
| **Structured output** | Guaranteed by a single tool + forced `tool_choice`, not prose parsing. |
| **The voice call** | Real LiveKit WebRTC audio between two browser contexts. Server-issued per-participant tokens, real microphone, mute, participant status, elapsed timer, leave. |
| **Audio-only enforcement** | Not just a UI choice — the token grant is narrowed to `TrackSource.MICROPHONE`, so a client asking to publish video is refused server-side. |
| **Loading states** | Real elapsed time on the actual in-flight request. |
| **Error handling** | Real typed SDK errors mapped to distinct in-UI states. |
| **AI-assisted intake** | Every patient message is a live model call. Returns the reply *and* structured intake state, rendered live beside the chat. |
| **Emergency routing** | The agent sets `scope: "emergency"` on possible acute presentations, which halts intake rather than booking a call for next week. |
| **Abuse guards** | Turn caps, rate limits, message-length caps, and off-topic strike escalation — all enforced server-side (`server/guards.js`), all tested. |
| **Physician edits** | Real, and they persist in state — the note, summary, and billing code you approve are what the approved record shows. |

### Mocked or placeholder

| | |
|---|---|
| **The visit transcript** | Live browser speech recognition, both sides merged over the data channel. Consumer-grade; correctable by hand. No audio stored. |
| **Scheduling** | The slot picker offers three plausible times generated from the current clock. There is no calendar, no availability check, and no reminder. |
| **Sample scheduled visits** | Invented records in `src/domain/mockSchedule.js`, beside the one live case. Marked as samples; a real care packet can be generated for any of them on demand. |
| **Participant identity** | Both seats are unauthenticated. Anyone with the visit link can join the room. |
| **Login / auth** | None. The physician identity is hardcoded and marked as a placeholder. |
| **Persistence** | React context only. A page refresh clears everything. |
| **Approval** | Updates local state and stamps a named clinician on it. Nothing is delivered — no patient inbox, no email, no fax to the patient's clinician. |
| **Billing** | The code suggestion is a suggestion. Nothing is submitted to a payer, a clearing house, or any billing system. There is no claims pathway. |
| **Physician identity and portrait** | Dr. Imani Reyes is fictional. The portrait slot is gitignored (see `.gitignore` for the licensing reasoning) so a fresh clone renders a document photo slot. |
| **Intake agent's opening turn** | Static, so it renders instantly and costs nothing. Every turn after it is a real model call. |
| **Pricing** | The $150–300/month physician figure is an indicative target, not a live offer. No subscription can be purchased and no payment is processed anywhere. |

### Future / out of scope

Recording and transcription (both need a retention policy and consent capture before they should exist at all), screen sharing, a real calendar, per-participant auth, claims submission, and anything that would make this handle real patient data. See [Next steps](#next-steps).

---

## Transcription

The call is transcribed live by the **browser's own speech recognition** (`SpeechRecognition`). No third-party STT service, no credential, no cost. Four limitations matter enough to be on screen rather than in this file:

**It hears one microphone — the local one.** Echo cancellation strips the remote party before recognition sees the signal, so on two separate machines each side transcribes only itself. Each side therefore publishes its recognised text over the LiveKit data channel and the two halves are merged by call time. Without that, the physician's transcript would contain half the conversation — and the one-machine two-tab setup hides the problem, because a single microphone hears everyone in the room.

**Speaker labels come from whose device spoke**, not from voice identification. There is no diarisation.

**Chrome performs recognition on Google's servers.** Audio leaves the machine even though nothing is stored. For anything touching a real consultation that is a disclosure, not a footnote.

**iOS Safari has no `SpeechRecognition` at all.** The call works; transcription does not. The panel says so and the paste path stays available.

Accuracy is consumer-grade — it drops audio under load and mangles drug names. So the captured text is a **draft the physician corrects**, and the transcript panel labels its provenance three ways: `captured live from the call`, `captured, then edited`, or `entered by hand`. A physician about to sign a note needs to know which.

**No audio is recorded or stored anywhere**, and the transcript text lives in memory for the life of the page. The generated transcript carries a provenance header into the documentation call, so a later reader cannot mistake it for a recording.

The authored synthetic example remains, behind an explicit button, for demoing the write-up without two people and a working browser.

## Running the voice call

The demo moment is two browser tabs connecting to each other for real.

1. Book a visit at **`/demo`**, let the care packet assemble, then go to **`/demo/visit`**.
2. Click **Start the call**, then **Allow microphone and join**, and accept the browser permission prompt.
3. Click **Copy patient link** in the dialog header — that's `/visit/<caseId>`.
4. Open that link in a **second tab** and join. The two participants connect.
5. Back in the physician tab, click **End visit and write it up** — which moves the case to the documentation stage.

### Both participants on one machine

- **Expect audio feedback.** Each tab plays the other's audio through your speakers and back into your microphone. **Use headphones, or mute one side.** The pre-join screen says so.
- **Identity is keyed to role**, not to the browser. LiveKit disconnects an existing participant when a second joins with the same identity, so a shared identity would have each tab silently kicking the other — indistinguishable from a broken connection. `physician-<caseId>` and `patient-<caseId>` avoid that.
- Dropping video removed the *other* two-tab problem this used to have: a camera that only one tab could hold.

Two physical devices work too, but they need the app reachable over HTTPS or via a tunnel, since `getUserMedia` requires a secure context and a LAN IP over plain HTTP is not one.

### On a phone

Layouts are responsive and the viewport meta is set, so both seats work on a phone — with two caveats worth knowing before you hand someone a link:

- **iOS and Safari block audio until a tap.** The call connects and plays nothing until the user taps. There is a prominent in-call prompt for this; without it a participant sits in a working call hearing silence with no explanation.
- **iOS Safari cannot transcribe.** No `SpeechRecognition` API. The call is fine, the transcript panel says it is unsupported, and the paste path still works. For live transcription on mobile, use Android Chrome.

Microphone permission is requested from a button press, which is what iOS requires — a permission prompt fired without a user gesture is rejected outright.

### Token scope

`POST /api/livekit-token` takes a `caseId` and a `role`, and returns a token good for exactly one room and one identity:

- Room names are **derived** from the case ID, never accepted verbatim, so a client can't request an arbitrary room and land in another case's visit. `caseId` is charset-validated; `role` must be `physician` or `patient`.
- The grant allows subscribing, and publishing **the microphone only**. `roomAdmin`, `roomCreate`, and `canPublishData` are all off. TTL is 45 minutes — long enough for a 30-minute visit with a late start, short enough that a leak decays.

`tests/livekitToken.test.js` decodes a minted JWT and asserts all of that, rather than trusting the call site.

---

## Three design decisions worth explaining

**Structured output uses a tool, not `output_config.format`.** The obvious way to get JSON out of the model is `output_config: { format: { type: 'json_schema', ... } }` — but that feature isn't available on Sonnet 4.6. Instead each call defines one tool and forces it with `tool_choice: { type: 'tool', name: ... }`. The model *must* emit a `tool_use` block, and its `input` arrives already parsed by the SDK. No JSON-from-prose extraction, so nothing breaks on a stray code fence, and it works on every current model.

**The progress indicator doesn't fake its stages.** The tempting version is a stage sequence — "parsing chart… extracting findings… drafting…" — advancing on timers. Those timings would be invented. A progress bar that lies about its stages undermines the one thing this demo exists to prove, so instead it shows a real elapsed-second counter off the in-flight request plus an indeterminate sweep, which is the honest shape of a non-streaming call.

**Every claim in the care packet carries its source.** Each item in `key_history`, `current_treatment`, and a discussion point's `supporting` list has a `statement`, a `source` naming where in the submitted material it came from, and a `basis` of `stated` or `inferred`. The physician is checking this against the chart in the three minutes before a call, so an unattributed assertion is worse than no assertion — it either gets trusted blindly or ignored entirely. `inferred` renders visually distinct from `stated` for the same reason, and the schema has no way to omit either field.

---

## Architecture

```
server/devApi.js              Vite middleware: all /api routes (Node — holds the keys)
server/livekitToken.js        LiveKit token minting + room/role validation + audio-only grant
server/guards.js              Intake abuse and cost guards
src/prompts/                  System prompts + tool schemas, isolated from UI
src/domain/                   Framework-free data shapes (the Flutter-port boundary)
src/lib/api.js                Client fetch wrapper; one error contract
src/lib/voiceVisit.js         Token fetch, microphone pre-flight, timer formatting
src/context/DemoProvider.jsx  Session state for the four stages
src/components/ui/            Primitives + AiDraftBadge
src/components/case/          Case-sheet primitives (sheet, meta rows, rules, status)
src/components/demo/          Intake, progress, care packet, transcript, documentation
src/components/physician/     Schedule, sample detail, call launcher, approval
src/components/voice/         LiveKit call UI (lazy-loaded chunk)
src/components/marketing/     Homepage sections + hero care-packet artifact
src/pages/                    Marketing pages
src/pages/demo/               The four demo stages
scripts/check-repo.mjs        Repository guard rails
tests/                        node:test suites
```

### API routes

| Route | Does |
|---|---|
| `POST /api/intake` | One turn of the AI-assisted intake conversation |
| `POST /api/intake/reset` | Clears one client's intake counters (wired to Reset) |
| `POST /api/care-packet` | Assembles the packet the physician reads before the call |
| `POST /api/visit-documentation` | Note + patient summary + billing suggestion, from the transcript |
| `POST /api/livekit-token` | Issues a scoped, audio-only voice-visit token |

**UI and data shape are kept separate on purpose.** `src/domain/models.js` holds plain factories, normalizers, and the stage mapping with no React, no browser APIs, no framework types — those are the structures that become Dart classes in a Flutter port, and the boundary a real backend would serve. Components never construct case shapes inline.

The absences in `makeCase` are load-bearing: there is no `messages`, `followUps`, `prescriptions`, `orders`, or `subscription` field, because the product has none of those. `tests/models.test.js` asserts they stay absent — if one appears, the product has quietly changed shape and the marketing copy is now wrong.

**The prompts are isolated.** `src/prompts/` holds the system prompts, tool schemas, and message builders, so prompt iteration never touches UI code. Their framing constraints are product behaviour rather than boilerplate.

### The "pending physician approval" signal

`AiDraftBadge` is one component used everywhere that state appears — patient view, physician view, marketing pages. Kept visually identical, the label becomes a status indicator users learn to read at a glance, and its absence becomes meaningful: when it flips to **physician reviewed** (green, check glyph), a named clinician has taken responsibility for the content. The violet `draft` colour is reserved for this state and used nowhere else in the palette.

### Design system

Defined in `tailwind.config.js` before any component was written, so nothing invents colours inline. The visual concept is a specialist's case file: documents, rules, and annotations rather than floating cards; hierarchy through precision rather than scale.

| Token | Hex | Role |
|---|---|---|
| `sandstone` | `#F4EFE6` | Warm ivory — page background |
| `sandstone.raised` | `#FDFBF6` | Pale cream — case-file surfaces |
| `ink` | `#241B15` | Near-black warm brown — primary text |
| `umber` | `#6F5F50` | Muted taupe — secondary text |
| `dune` | `#DCD1C2` | Rules, hairlines, borders |
| `pulse` | `#A84B23` | Burnt sienna — primary action, selective emphasis |
| `oxblood` | `#6E1F24` | Clinical annotations, active states, document rules |
| `crimson` | `#A32A25` | *Reserved:* urgency only (emergency routing, errors) |
| `draft` | `#645A94` | *Reserved:* AI-generated, pending physician approval |
| `verified` | `#4E6B4A` | *Reserved:* physician-approved |

Two deep reds are kept distinct on purpose: `oxblood` is annotation and structure at hairline scale, `crimson` is alarm in filled blocks. Collapsing them would stop a red flag reading as one.

Every text token clears WCAG AA 4.5:1 on both the page background and the case surface. **Corner radii** are 1–4px, set by overriding Tailwind's `borderRadius` scale rather than editing every `rounded-md`/`rounded-lg` className, so anything added later inherits it.

Type: **Newsreader** (display only) + **IBM Plex Sans** (body) + **IBM Plex Mono** (clinical field labels, timestamps). The sans face carries body copy, navigation, controls, metadata, and *all headings*; the serif is selective — patient questions, the physician's philosophy, pull quotes, and the wordmark. The display size tops out at `2.25rem`, so hierarchy comes from weight, rule, and spacing rather than scale.

**Motion** appears in one place: the in-flight model-call state, where it signals a real request. `prefers-reduced-motion` is handled globally in `src/index.css` (all animation and transition disabled), so a component added later can't reintroduce motion by accident.

**No LiveKit stylesheet.** The call UI is built from this design system's primitives rather than LiveKit's prebuilt `GridLayout`/`ParticipantTile` — those exist to render video, and a grid of black rectangles with names on them would be a video UI with the video missing, which reads as broken rather than deliberate. So `@livekit/components-styles` is not a dependency and `src/index.css` carries no `--lk-*` overrides. The one LiveKit component still rendered is `RoomAudioRenderer`, which emits unstyled `<audio>` elements.

The chat UI follows the [`chatscope/chat-ui-kit-react`](https://github.com/chatscope/chat-ui-kit-react) component split (`MessageList` / `Message` / `MessageInput`) but is built here — the component tree was worth borrowing, the default CSS was not.

---

## Deploying (Docker / GHCR)

`vite build` emits static assets only. `server/prod.js` is a dependency-free Node server that serves those assets **and** the API on one listener, so the deployed app can actually reach the model and mint LiveKit tokens — which a static host cannot do.

Dev and production share one implementation: every handler lives in `server/api.js`, which imports nothing from Vite. The Vite plugin and `prod.js` are both thin adapters over it. Two copies would drift, and the drift would surface as a demo that works on a laptop and fails on the server.

### Run it locally

```bash
npm run build
npm start            # http://localhost:8080
```

### Run the image

```bash
docker compose up -d                 # reads .env, binds 127.0.0.1:8080
# or
docker run --rm -p 8080:8080 --env-file .env ghcr.io/amnidhiry/concierge-ai-doctor:main
```

`.github/workflows/docker.yml` publishes `linux/amd64` and `linux/arm64` to GHCR on push. GHCR authenticates with the built-in `GITHUB_TOKEN`; no PAT needed. The package inherits the repository's visibility, so a public repo means a **public image** — which is exactly why no credential is baked into it.

### Configuration

All runtime, all environment variables. Nothing secret is in the image.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | Listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `STATIC_DIR` | `../dist` | Where the built assets live |
| `ALLOWED_HOSTS` | *(empty = permissive)* | Comma-separated `Host` allowlist |
| `ANTHROPIC_API_KEY` | — | Required for intake, packet, documentation |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | — | Required for the voice call |

`GET /healthz` returns `{ ok, anthropic, livekit, staticDir }` — readiness per dependency, naming no credential. It backs the image's `HEALTHCHECK`.

> **`ANTHROPIC_API_KEY` must actually be set in `.env` on the server.** In development Vite also picks up a shell-exported value, so a blank `ANTHROPIC_API_KEY=` line still works locally. A container gets only what `--env-file` and `-e` pass it, so a blank line means intake, care packet, and documentation all return a config error while LiveKit works — a confusing half-broken state. `GET /healthz` reports `{"anthropic": false}` when this happens.

`ALLOWED_HOSTS` is **permissive by default on purpose**: a Cloudflare quick-tunnel hostname regenerates on every restart, so a mandatory allowlist would lock you out of your own deployment at the worst moment. Set it once the hostname is stable.

### Two people on two machines

This is the reason to deploy at all. Running both sides in one browser produces audio feedback — each tab plays the other's audio into the shared microphone — and the two tabs contend for the same input device.

```bash
docker compose up -d
cloudflared tunnel --url http://localhost:8080
```

Hand the printed HTTPS URL to the second person. HTTPS matters beyond privacy: `getUserMedia` and the Web Speech API both refuse to run in a non-secure context, so a bare LAN IP over HTTP will not work at all.

**The container is a public entry point.** With the tunnel up, anyone holding the URL can hit `/api/*` and spend your Anthropic credits, and `/api/livekit-token` will mint a token for anyone who asks — there is no authentication anywhere in this build. `server/guards.js` limits turns, rate, and a per-process call budget, which is a cost backstop and not access control. Take the tunnel down when you are not testing.

### What the image contains

Multi-stage: the build stage runs `check`, `test`, and `build` — a red suite fails the image rather than producing something that looks deployable. The runtime stage carries production dependencies, `dist/`, `server/`, and `src/prompts/` (the only `src/` path the server imports, verified by tracing the import graph). It runs as the non-root `node` user.

The image is ~313 MB (about 66 MB of that the app layer, the rest the `node:22-alpine` base and Node itself). `npm ci --omit=dev` keeps the React and `livekit-client` packages because they are genuine dependencies of the browser bundle, even though the server never imports them. Trading that for a hand-written runtime manifest would cost lockfile reproducibility, which is the worse deal for a prototype.

## Automated checks

Deliberately dependency-free: `node:test` and Node built-ins, no test framework, no linter config to maintain. `npm run check` works on a fresh clone before `npm install`.

| | |
|---|---|
| `npm run check` | Repository guard rails (`scripts/check-repo.mjs`) |
| `npm test` | 158 unit tests across 5 suites |
| `npm run verify` | check → test → build, in that order |

### What `npm run check` enforces

It is not a linter. It checks invariants a linter cannot see and that this project would be actively harmed by breaking:

1. **No secret is `VITE_`-prefixed**, and none is read via `import.meta.env`. Vite would inline it into the client bundle and nothing else in the toolchain would object.
2. **No credential is read outside** `server/` and `vite.config.js`, and credential *names* appear only in the server modules, `.env.example`, the README, and operator-facing error messages.
3. **No obsolete product language survives** — asynchronous correspondence, longitudinal panels, patient subscriptions or revenue share, video calls. Copy is where an abandoned model lingers longest, and a stale sentence on a marketing page is a false claim about a medical service.
4. **Nothing claims to transcribe** the call or to **calculate a risk score** — the two capabilities the build deliberately does not have, and the two most tempting to imply.
5. **Nothing claims production compliance.**
6. **Structural invariants**: superseded modules stay deleted, expected modules exist, `.env` stays gitignored, and "preventive" is spelled consistently.

The copy rules are **negation-aware**, which is the interesting part. A product defined by its boundaries has to name what it does not do — "no asynchronous messaging", "nothing transcribes the call", "no risk score was calculated" — and a plain substring scan flags every one of those, leaving you to either allow-list half the repo or delete the sentences doing the most important work on the page. So a match only fails when it is *asserted*: `isNegated` looks in a window either side of the hit for a negator or a historical marker, and skips it if one is present. The residual risk is a false negative near the word "not", which is the right way round — this catches a stale sentence surviving a rewrite, and a reviewer reading the diff is the backstop.

### What the tests cover

| Suite | Covers |
|---|---|
| `tests/models.test.js` | Normalizers against malformed and hostile payloads; note flattening; the stage mapping is total and never shows two active stages; `VISIT_SCOPE` promises nothing it also excludes; the forbidden case fields stay absent |
| `tests/prompts.test.js` | Tool schemas are internally consistent and match the normalizer shapes; the risk-score rule and every scope clause are present in the prompts that need them; message builders state absences rather than sending blanks |
| `tests/livekitToken.test.js` | Room derivation; hostile `caseId` and unknown roles refused; a decoded JWT grants microphone-only publishing, no admin capability, and the documented TTL |
| `tests/guards.test.js` | Every limit actually trips; limits are per-client; off-topic escalation blocks without spending budget; Reset clears a block but does not refund the process ceiling |
| `tests/voiceVisit.test.js` | Timer formatting including non-finite input; media-error mapping never mentions a camera; patient-link encoding |

Two of these found real bugs while being written, which is the argument for them: `canPublishSources: ['microphone']` throws a `TypeError` inside the LiveKit SDK — the grant needs `TrackSource.MICROPHONE` from `@livekit/protocol`, so **every token request would have failed at runtime**; and `formatElapsed` rendered `NaN:NaN` for a non-numeric input, in the call header, during a live call.

### Not covered

`preflightMicrophone` and `fetchVisitToken` need `navigator`/`fetch`, and the React components need a DOM. Both want a browser harness this prototype does not have — noted here rather than faked with a mock deep enough that you end up testing the mock. The build is the current smoke test for the component tree.

---

## Next steps

### 1. Shared state for the guards

`server/guards.js` keeps its rate-limit and turn counters **in memory, per process**. One container is fine; two replicas behind a load balancer would each enforce the limits separately, so the effective ceiling doubles. A real deployment needs a shared store (Redis) keyed on an authenticated session rather than an IP.

### 2. Real backend

Today: React context, cleared on refresh. Needed:

- **Persistence** — Postgres for cases, intake, packets, transcripts, and an append-only edit history (who changed what, when). A physician-approved clinical note needs an audit trail.
- **Auth** — patient and physician roles with real sessions. The current physician identity is hardcoded.
- **Real scheduling** — a calendar with availability, confirmations, and reminders, rather than three generated slots.
- **Delivery** — approving should actually get the summary to the patient and the note to their clinician.

### 3. Call hardening

- **Per-participant auth.** The token endpoint issues a token to anyone who asks for a `caseId` and a `role`. Nothing verifies that the caller *is* that patient or physician, so the visit link is effectively a bearer credential. A real version issues tokens only to an authenticated session whose identity is checked against the case's participants, and treats the room name as an internal detail rather than something derivable from a URL.
- **Lifecycle.** There is no waiting room, no "physician has joined" notification, and no server-side room cleanup. Rooms are created implicitly on first join and expire on LiveKit's default timeout.

### 4. The transcript problem

The documentation stage is the one that most needs a real input. Options, in rough order of how much consent machinery each needs: live STT with no retention; recording with an explicit consent step and a retention policy; or physician-dictated notes with no patient audio captured at all. **None of these should ship before the consent and retention policy exists**, which is why the current build asks a human to paste instead.

### 5. Model improvements

- **Streaming.** Both calls are non-streaming, which is why the progress indicator is indeterminate. SSE would let output materialise token by token and remove the 10–20s dead wait.
- **Prompt caching.** Each system prompt plus tool schema is a couple of thousand input tokens, byte-identical every call. A `cache_control` breakpoint would bring that to ~0.1× cost on repeat calls.
- **Chart parsing.** PDF and DOCX are rejected today. A parser (or the Files API for PDFs) would remove the copy-paste step, which is the most common real-world intake format.
- **Model evaluation.** `claude-sonnet-4-6` is the default. Worth A/B-ing against `claude-opus-5` on synthetic cases, and sweeping `effort` for the latency/quality tradeoff.
- **Real evals for the safety clauses.** The tests assert the risk-score rule is *present in the prompt*; they cannot assert the model *obeys* it. That needs an eval set of records with missing inputs, checking that no number comes back.

### 6. Flutter port

`src/domain/models.js` is the intended boundary — plain shapes, no framework coupling. `makeIntake`, `makeCase`, `makeVisit`, `normalizeCarePacket`, `normalizeDocumentation`, `stageStateFor`, and the `CaseStatus` union translate to Dart directly. The API contracts are transport-agnostic and would be shared by both clients.

### 7. Compliance (before any real patient data)

Out of scope for this pass and genuinely blocking for real use: a BAA with the model provider, encryption at rest and in transit, access logging, a data-retention policy, and a documented clinical-scope boundary with escalation paths for urgent findings.

---

## Scripts

| | |
|---|---|
| `npm run dev` | Dev server with the API mounted, at `:5173` |
| `npm run build` | Static assets into `dist/` |
| `npm start` | **Production server — built assets plus the API, at `:8080`** |
| `npm run preview` | Vite's static preview. Dev-only; prefer `npm start` |
| `npm test` | Node's test runner over `tests/` |
| `npm run check` | Secret-boundary and obsolete-language checks |
| `npm run verify` | `check` + `test` + `build` |
| `npm run docker:build` | Build the image locally |
| `npm run docker:run` | Run the local image with `.env` |

## Stack

React 18 · Vite 5 · Tailwind CSS 3.4 (utility classes only) · React Router 6 · `@anthropic-ai/sdk` · `livekit-server-sdk` · `@livekit/components-react` · `node:test`
