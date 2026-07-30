#!/usr/bin/env node
/**
 * Repository guard rails. Zero dependencies — Node built-ins only, so `npm run
 * check` works on a fresh clone before anything is installed.
 *
 * This is not a linter. It checks the handful of invariants that a normal linter
 * cannot see and that this project would be actively harmed by breaking:
 *
 *   1. No secret ever becomes a `VITE_` variable. Vite inlines `VITE_*` into the
 *      client bundle, so a single well-meaning rename would ship an API key to
 *      every visitor's devtools. Nothing else in the toolchain would object.
 *
 *   2. No secret is read outside the server modules. `import.meta.env` and
 *      `process.env` reads of credential names belong in `server/` and
 *      `vite.config.js`, nowhere else.
 *
 *   3. No obsolete product language survives. The product changed shape — from
 *      asynchronous written second opinions on a longitudinal panel, to one
 *      bounded scheduled voice visit — and copy is where an abandoned model
 *      lingers longest. A stale sentence on a marketing page is a false claim
 *      about a medical service, which is worth failing a build over.
 *
 *   4. Nothing claims to transcribe the call, and nothing claims to calculate a
 *      risk score. Those are the two capabilities the build deliberately does not
 *      have, and the two most tempting things to imply.
 *
 *   5. Nothing claims production compliance.
 *
 * ── Why this is negation-aware ─────────────────────────────────────────────
 * The phrases below appear legitimately all over the codebase, because a product
 * defined by its boundaries has to name the things it does not do: "no
 * asynchronous physician chat", "nothing transcribes the call", "no risk score
 * was calculated". A plain substring scan flags every one of those, which leaves
 * two bad options — allow-list half the repo, or delete the sentences that are
 * doing the most important work on the page.
 *
 * So a match is only a violation when it is *asserted*. `isNegated` looks in a
 * window either side of the hit for a negator ("no", "never", "nothing",
 * "cannot", "without") or a historical marker ("previously", "an earlier
 * version", "replaced"), and skips it if one is present. Bidirectional because
 * English puts the negation on either side: "there is no async chat" and "async
 * chat does not exist here" both need to pass.
 *
 * The residual risk is a false negative — an affirmative claim that happens to
 * sit near the word "not". That is the right way round: this check exists to
 * catch a stale sentence surviving a rewrite, and a reviewer reading the diff is
 * the backstop.
 *
 * Rules also keep an `allow` list for files where the phrase is unavoidable and
 * structural rather than lexical — a "not in the product" list whose items are
 * negated by the heading above them, not by any word near them.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-ssr', '.vite', 'coverage'])
const SCAN_EXTENSIONS = ['.js', '.jsx', '.mjs', '.css', '.html', '.md', '.json']

/** Credential names that must never reach the browser. */
const SECRET_NAMES = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_MAX_TOKENS',
  'LIVEKIT_URL',
  'LIVEKIT_API_KEY',
  'LIVEKIT_API_SECRET',
]

/** Files permitted to read credentials from the environment. */
const SERVER_SIDE = ['vite.config.js', 'server/devApi.js', 'server/livekitToken.js']

/**
 * Files permitted to *name* credentials in prose or config without reading them:
 * setup docs, the example env file, error messages telling an operator what to
 * set, and this checker.
 */
const MAY_NAME_SECRETS = [
  'README.md',
  '.env.example',
  'scripts/check-repo.mjs',
  'server/devApi.js',
  'server/livekitToken.js',
  'vite.config.js',
  'src/components/demo/ErrorPanel.jsx',
  'src/components/voice/VoiceVisitPanel.jsx',
]

const LANGUAGE_RULES = [
  {
    id: 'async-correspondence',
    // Matches the abandoned model: a written answer posted back to the patient
    // some hours later, rather than a scheduled call.
    pattern:
      /\b(asynchronous(ly)? (review|care|second opinion|physician|correspondence|question)|async (review|care|concierge|panel)|written second opinion|second-opinion draft|reply to patient|response sent|send (the )?response to (the )?patient|within 48 hours|48-hour)\b/i,
    message:
      'Obsolete asynchronous-correspondence language. The product is one scheduled voice call, not a written answer returned later.',
    allow: ['scripts/check-repo.mjs'],
  },
  {
    id: 'longitudinal-panel',
    pattern:
      /\b(patient panel|panel economics|run a panel|running a panel|cash-pay panel|panel of patients|longitudinal care|ongoing care relationship|review queue)\b/i,
    message:
      'Obsolete panel/longitudinal-care language. Visits are bounded and episodic; there is no roster under continuing care.',
    allow: ['scripts/check-repo.mjs'],
  },
  {
    id: 'patient-subscription',
    pattern:
      /\b(per month[^)\n]{0,40}(patient|plan|tier)|patient subscription|subscribe to (your|a) (plan|tier)|included in your plan|unlimited (asynchronous )?questions|revenue share|platform fee|takes? a cut)\b/i,
    message:
      'Obsolete patient-subscription or revenue-share language. Patients are not subscribers, and the platform takes no share of the visit fee.',
    allow: ['scripts/check-repo.mjs'],
  },
  {
    id: 'video-visit',
    pattern:
      /\b(video visit|video call|join video|camera and join|allow camera|video tile|screen shar|webcam)\b/i,
    message:
      'Obsolete video language. The visit is audio-only — no camera is requested and the token grant refuses video.',
    // The voice-visit test asserts that no media-error message ever mentions a
    // camera, which means it has to name the words it is banning. Structural, not
    // lexical: no negator sits near a term inside a regex literal.
    allow: ['scripts/check-repo.mjs', 'tests/voiceVisit.test.js'],
  },
  {
    id: 'claims-transcription',
    // The build has no speech-to-text. Anything implying otherwise is the single
    // most misleading thing it could say.
    pattern:
      /\b(auto(matic|matically)?[- ]transcrib|transcribes the call|call is transcribed|speech[- ]to[- ]text (is|will be) (on|enabled|available)|we transcribe|transcript is generated|generated transcript)\b/i,
    message:
      'Implies speech-to-text. There is none: the visit transcript is always typed in by a human.',
    allow: ['scripts/check-repo.mjs'],
  },
  {
    id: 'calculates-risk-score',
    pattern:
      /\b((calculat|comput|estimat)\w*\s+(the\s+)?(your\s+)?(10[- ]year\s+)?(PREVENT|ASCVD|SCORE2|QRISK|Framingham|risk score)|risk score (is|was) (calculated|computed|estimated)|your (10[- ]year )?risk is \d)/i,
    message:
      'Implies a calculated cardiovascular risk score. Scores are only ever reported as supplied by the record.',
    allow: ['scripts/check-repo.mjs'],
  },
  {
    id: 'production-compliance',
    pattern:
      /\b(HIPAA[- ]compliant|HIPAA compliant|fully compliant|BAA in place|production[- ]ready|clinically validated|FDA[- ]cleared)\b/i,
    message: 'Claims production or regulatory compliance. This prototype has none.',
    allow: ['scripts/check-repo.mjs'],
  },
  {
    id: 'preventative-spelling',
    // Not a correctness issue, a consistency one: the product name for the
    // specialty is "preventive cardiology", and both spellings appearing across
    // the copy reads as carelessness on a page asking for medical trust.
    pattern: /\bpreventative\b/i,
    message: 'Use "preventive", not "preventative", for consistency across the product copy.',
    allow: ['scripts/check-repo.mjs'],
  },
]

/* ------------------------------------------------------------------------- */

/**
 * Words that turn a nearby phrase into a statement about what does NOT happen,
 * plus markers that make it a statement about what USED to happen.
 */
const NEGATORS =
  /\b(no|not|never|none|nothing|nobody|neither|nor|without|cannot|can't|don't|doesn't|didn't|won't|isn't|aren't|refus\w*|absen\w*|lack\w*|exclud\w*|omit\w*|instead of|rather than|deliberately|avoid\w*|prevent\w*\s+from|previously|earlier version|used to|no longer|formerly|superseded|replaced|obsolete|stale|abandoned)\b/i

const LOOK_BEHIND = 140
const LOOK_AHEAD = 90

/**
 * True when the match at `index` sits inside a negated or historical statement.
 *
 * The windows are clamped to the surrounding blank-line-delimited block so a
 * negator three paragraphs away cannot silently excuse an affirmative claim.
 */
function isNegated(text, index, matchLength) {
  const behindStart = Math.max(0, index - LOOK_BEHIND)
  const aheadEnd = Math.min(text.length, index + matchLength + LOOK_AHEAD)

  let behind = text.slice(behindStart, index)
  let ahead = text.slice(index + matchLength, aheadEnd)

  // Don't reach across a blank line in either direction.
  const paragraphBreak = /\n\s*\n/g
  const lastBreak = [...behind.matchAll(paragraphBreak)].pop()
  if (lastBreak) behind = behind.slice(lastBreak.index + lastBreak[0].length)
  const firstBreak = paragraphBreak.exec(ahead)
  if (firstBreak) ahead = ahead.slice(0, firstBreak.index)

  return NEGATORS.test(behind) || NEGATORS.test(ahead)
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (SCAN_EXTENSIONS.some((ext) => entry.endsWith(ext))) out.push(full)
  }
  return out
}

/** Repo-relative path with forward slashes, so `allow` lists are portable. */
function rel(file) {
  return relative(ROOT, file).split(sep).join('/')
}

const failures = []

function fail(file, line, rule, detail) {
  failures.push({ file, line, rule, detail })
}

/** Line number of an index into the file text. */
function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

const files = walk(ROOT).filter((f) => rel(f) !== 'package-lock.json')

for (const file of files) {
  const path = rel(file)
  const text = readFileSync(file, 'utf8')

  // --- 1. No VITE_-prefixed secrets, anywhere. ---------------------------
  //
  // Negation-aware for the same reason as the copy rules: the server modules and
  // the README explain at length that there is deliberately *no* VITE_LIVEKIT_URL,
  // and that explanation is the thing keeping the next person from adding one.
  if (path !== 'scripts/check-repo.mjs') {
    for (const name of SECRET_NAMES) {
      for (const m of text.matchAll(new RegExp(`VITE_${name}\\b`, 'g'))) {
        if (isNegated(text, m.index, m[0].length)) continue
        fail(
          path,
          lineOf(text, m.index),
          'vite-secret',
          `VITE_${name} would be inlined into the client bundle. Read it server-side instead.`,
        )
        break
      }
    }

    // A bare `VITE_` + anything that smells like a credential.
    const suspiciousVite = /VITE_[A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)[A-Z0-9_]*/g
    for (const m of text.matchAll(suspiciousVite)) {
      if (isNegated(text, m.index, m[0].length)) continue
      fail(
        path,
        lineOf(text, m.index),
        'vite-secret',
        `${m[0]} looks like a credential and would be inlined into the client bundle.`,
      )
      break
    }
  }

  // --- 2. Credentials read only server-side. -----------------------------
  if (!SERVER_SIDE.includes(path) && path !== 'scripts/check-repo.mjs') {
    for (const name of SECRET_NAMES) {
      const read = new RegExp(`(process\\.env|import\\.meta\\.env)\\s*(\\.${name}\\b|\\[['"\`]${name}['"\`]\\])`)
      const m = read.exec(text)
      if (m) {
        fail(
          path,
          lineOf(text, m.index),
          'client-secret-read',
          `${name} is read outside the server modules. Credentials belong in ${SERVER_SIDE.join(', ')}.`,
        )
      }
    }
  }

  // `import.meta.env` is client-visible by definition — a credential name
  // anywhere near it is wrong regardless of which file it is in.
  if (path !== 'scripts/check-repo.mjs') {
    for (const m of text.matchAll(/import\.meta\.env\.(\w+)/g)) {
      const varName = m[1]
      if (/KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL/i.test(varName)) {
        fail(
          path,
          lineOf(text, m.index),
          'client-secret-read',
          `import.meta.env.${varName} is client-visible and named like a credential.`,
        )
      }
    }
  }

  // Any credential named in a file with no business naming one. Catches a
  // credential leaking into a component's copy or a comment that drifted.
  if (!MAY_NAME_SECRETS.includes(path)) {
    for (const name of SECRET_NAMES) {
      if (!name.includes('KEY') && !name.includes('SECRET')) continue
      const m = new RegExp(`\\b${name}\\b`).exec(text)
      if (m) {
        fail(
          path,
          lineOf(text, m.index),
          'secret-name-leak',
          `${name} is named here. Keep credential names in the server modules, .env.example, and the README.`,
        )
      }
    }
  }

  // --- 3–7. Obsolete or misleading product language. ---------------------
  for (const rule of LANGUAGE_RULES) {
    if (rule.allow.includes(path)) continue
    // Global flag so every occurrence is considered: the first hit in a file is
    // often the comment explaining why the phrase is gone, and stopping there
    // would mask a live one further down.
    const pattern = new RegExp(rule.pattern.source, `${rule.pattern.flags.replace('g', '')}g`)
    for (const m of text.matchAll(pattern)) {
      if (isNegated(text, m.index, m[0].length)) continue
      fail(path, lineOf(text, m.index), rule.id, `"${m[0].trim()}" — ${rule.message}`)
      break
    }
  }
}

/* ---------------------------------------------------------- structural ---- */

/**
 * Structural invariants that are cheap to assert here and expensive to notice by
 * eye. These are about files, not text, so they sit outside the per-file loop.
 */
const allPaths = new Set(files.map(rel))

const MUST_NOT_EXIST = [
  'src/lib/videoVisit.js',
  'src/hooks/useVideoVisit.js',
  'src/domain/mockPanel.js',
  'src/prompts/synthesisPrompt.js',
  'src/prompts/triagePrompt.js',
  'src/pages/Services.jsx',
]
for (const path of MUST_NOT_EXIST) {
  if (allPaths.has(path)) {
    fail(path, 0, 'stale-module', 'Superseded module still present. It should have been removed.')
  }
}

const MUST_EXIST = [
  'src/prompts/carePacketPrompt.js',
  'src/prompts/documentationPrompt.js',
  'src/prompts/intakePrompt.js',
  'src/lib/voiceVisit.js',
  'src/hooks/useVoiceVisit.js',
  'src/domain/mockSchedule.js',
  'src/pages/TheVisit.jsx',
]
for (const path of MUST_EXIST) {
  if (!allPaths.has(path)) {
    fail(path, 0, 'missing-module', 'Expected module is missing.')
  }
}

// The .env file must never be tracked. Checking for its presence in the tree is
// not enough — it is gitignored, so this asserts the ignore rule still names it.
const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8')
if (!/^\.env$/m.test(gitignore)) {
  fail('.gitignore', 0, 'env-not-ignored', '.env is not gitignored. Secrets would be committable.')
}

/* -------------------------------------------------------------- report ---- */

if (failures.length === 0) {
  console.log(`check-repo: ${files.length} files scanned, no violations.`)
  process.exit(0)
}

console.error(`check-repo: ${failures.length} violation(s).\n`)
for (const f of failures) {
  console.error(`  ${f.file}${f.line ? `:${f.line}` : ''}  [${f.rule}]`)
  console.error(`    ${f.detail}\n`)
}
process.exit(1)
