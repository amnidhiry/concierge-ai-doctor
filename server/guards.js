/**
 * Abuse and cost guards for the triage endpoint.
 *
 * The synthesis endpoint is one call per submitted case, so it is largely
 * self-limiting. The triage agent is not: it is a chat loop reachable by anyone
 * who can load the page, and each turn is a billable request. Left ungoverned, a
 * single tab left open on a loop — or someone deciding to use it as a free
 * chatbot — is real money.
 *
 * Every limit is enforced server-side. The client mirrors some of them for a
 * better UX (disabled send button, character counter), but a client-side cap is
 * a hint, not a control: the payload can be forged, so the server never trusts
 * the turn count it is handed.
 *
 * State is in-memory and per-process, which is right for a prototype and wrong
 * for production. A deployed version needs a shared store (Redis) keyed on an
 * authenticated session rather than an IP — see README next steps.
 */

export const LIMITS = {
  /** Patient turns per conversation. Beyond this, submit or start over. */
  MAX_TURNS: 14,
  /** Characters in a single patient message. */
  MAX_MESSAGE_CHARS: 2_000,
  /** Characters across the whole transcript sent back to the model. */
  MAX_TRANSCRIPT_CHARS: 24_000,
  /** Off-topic replies before the session's triage access is revoked. */
  MAX_OFF_TOPIC_STRIKES: 3,
  /** Minimum gap between two triage calls from one client. */
  MIN_INTERVAL_MS: 1_200,
  /** Sliding-window cap per client. */
  WINDOW_MS: 60_000,
  MAX_PER_WINDOW: 15,
  /**
   * Hard ceiling for the life of the server process. A backstop against a
   * runaway loop or a tab left open overnight — not a per-user limit.
   */
  MAX_CALLS_PER_PROCESS: 120,
  /** Output cap per triage reply. Replies are meant to be under 90 words. */
  MAX_OUTPUT_TOKENS: 700,
}

/** @type {Map<string, { hits: number[], last: number, strikes: number, blocked: boolean }>} */
const clients = new Map()
let processCalls = 0

function clientFor(key) {
  let entry = clients.get(key)
  if (!entry) {
    entry = { hits: [], last: 0, strikes: 0, blocked: false }
    clients.set(key, entry)
    // Bound the map so a long-running process with many distinct keys can't
    // grow it without limit.
    if (clients.size > 500) {
      const oldest = [...clients.entries()].sort((a, b) => a[1].last - b[1].last)[0]
      if (oldest) clients.delete(oldest[0])
    }
  }
  return entry
}

/** Derives a client key. Best-effort — an IP is all a local prototype has. */
export function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

/**
 * Runs every pre-flight check. Returns null when the call may proceed, or a
 * `{ status, kind, message }` to send back.
 */
export function checkTriageAllowed({ key, turnCount, message, transcriptChars }) {
  const now = Date.now()
  const entry = clientFor(key)

  if (entry.blocked) {
    return {
      status: 403,
      kind: 'scope_blocked',
      message:
        'Triage chat is disabled for this session after repeated off-topic requests. Reset the demo to start over.',
    }
  }

  if (processCalls >= LIMITS.MAX_CALLS_PER_PROCESS) {
    return {
      status: 429,
      kind: 'budget_exhausted',
      message: `This server process has hit its ${LIMITS.MAX_CALLS_PER_PROCESS}-call triage budget. Restart the dev server to reset it.`,
    }
  }

  if (typeof message !== 'string' || !message.trim()) {
    return { status: 400, kind: 'bad_request', message: 'Message was empty.' }
  }

  if (message.length > LIMITS.MAX_MESSAGE_CHARS) {
    return {
      status: 413,
      kind: 'too_long',
      message: `That message is ${message.length} characters; the limit is ${LIMITS.MAX_MESSAGE_CHARS}. Paste long records into the chart panel instead of the chat.`,
    }
  }

  if (turnCount >= LIMITS.MAX_TURNS) {
    return {
      status: 429,
      kind: 'turn_limit',
      message: `Intake chat is capped at ${LIMITS.MAX_TURNS} messages. Submit the case for synthesis, or reset to start over.`,
    }
  }

  if (transcriptChars > LIMITS.MAX_TRANSCRIPT_CHARS) {
    return {
      status: 413,
      kind: 'too_long',
      message:
        'This conversation has grown too long to continue. Submit it for synthesis, or reset the demo.',
    }
  }

  if (now - entry.last < LIMITS.MIN_INTERVAL_MS) {
    return {
      status: 429,
      kind: 'too_fast',
      message: 'Sending too quickly. Wait a moment and try again.',
    }
  }

  entry.hits = entry.hits.filter((t) => now - t < LIMITS.WINDOW_MS)
  if (entry.hits.length >= LIMITS.MAX_PER_WINDOW) {
    const waitMs = LIMITS.WINDOW_MS - (now - entry.hits[0])
    return {
      status: 429,
      kind: 'rate_limited',
      retryAfterSeconds: Math.ceil(waitMs / 1000),
      message: `Too many messages in a short period. Try again in about ${Math.ceil(waitMs / 1000)}s.`,
    }
  }

  return null
}

/** Records a call that is about to be made. */
export function recordTriageCall(key) {
  const entry = clientFor(key)
  const now = Date.now()
  entry.last = now
  entry.hits.push(now)
  processCalls += 1
}

/**
 * Records an off-topic reply and reports whether the client is now blocked.
 * Escalating from a soft redirect to a hard block means a scripted abuser can't
 * sit in a loop burning calls on refusals.
 */
export function recordOffTopic(key) {
  const entry = clientFor(key)
  entry.strikes += 1
  if (entry.strikes >= LIMITS.MAX_OFF_TOPIC_STRIKES) entry.blocked = true
  return { strikes: entry.strikes, blocked: entry.blocked }
}

/** Clears one client's counters. Wired to the demo's Reset control. */
export function resetClient(key) {
  clients.delete(key)
}

export function budgetRemaining() {
  return Math.max(0, LIMITS.MAX_CALLS_PER_PROCESS - processCalls)
}
