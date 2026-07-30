/**
 * Vite plugin exposing the API routes the demo needs, during `npm run dev` and
 * `npm run preview`:
 *
 *   POST /api/triage         — Step 1 conversational intake agent
 *   POST /api/synthesize     — Step 2 second-opinion synthesis
 *   POST /api/triage/reset   — clears one client's triage counters
 *   POST /api/livekit-token  — issues a video-visit access token
 *
 * Why a server-side proxy at all: the Anthropic API cannot be called safely
 * from browser JS. Doing so requires the
 * `anthropic-dangerous-direct-browser-access` header and ships the API key in
 * the client bundle, where anyone who opens devtools can read it. This
 * middleware runs in Node, so the key stays in `.env` and never crosses to the
 * browser.
 *
 * Both routes force structured output with a single tool plus
 * `tool_choice: {type: 'tool', name: ...}`. The model must emit a `tool_use`
 * block, and `block.input` arrives already parsed — so there is no "extract JSON
 * from prose" step that can fail on a stray code fence. This also works on every
 * current model; `output_config.format` does not (it is unavailable on
 * Sonnet 4.6).
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  SYNTHESIS_SYSTEM_PROMPT,
  SYNTHESIS_TOOL,
  buildSynthesisUserMessage,
} from '../src/prompts/synthesisPrompt.js'
import {
  TRIAGE_SYSTEM_PROMPT,
  TRIAGE_TOOL,
  buildTriageMessages,
} from '../src/prompts/triagePrompt.js'
import {
  LIMITS,
  budgetRemaining,
  checkTriageAllowed,
  clientKey,
  recordOffTopic,
  recordTriageCall,
  resetClient,
} from './guards.js'
import { TOKEN_TTL_SECONDS, mintToken, validateTokenRequest } from './livekitToken.js'

const DEFAULT_MODEL = 'claude-sonnet-4-6'
const DEFAULT_MAX_TOKENS = 8000

// Guards against a paste large enough to blow the context window. The Vite dev
// server has no body-size limit of its own, so we impose one.
const MAX_CHARS = 200_000

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function readBody(req, limit = MAX_CHARS * 2) {
  return new Promise((resolve, reject) => {
    let raw = ''
    let aborted = false
    req.on('data', (chunk) => {
      if (aborted) return
      raw += chunk
      if (raw.length > limit) {
        aborted = true
        reject(Object.assign(new Error('Request body too large.'), { httpStatus: 413 }))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (aborted) return
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(Object.assign(new Error('Request body was not valid JSON.'), { httpStatus: 400 }))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Maps an SDK error onto a shape the UI can render. Ordered most-specific
 * first; `APIConnectionError` is checked before `APIError` because in the
 * TypeScript SDK it is a subclass of it, so the reverse order would swallow it.
 */
function describeError(err, model) {
  if (err?.httpStatus) {
    return { status: err.httpStatus, kind: 'bad_request', message: err.message }
  }

  if (err instanceof Anthropic.AuthenticationError) {
    return {
      status: 401,
      kind: 'auth',
      message:
        'The Anthropic API rejected the key. Check ANTHROPIC_API_KEY in .env, then restart the dev server.',
    }
  }

  if (err instanceof Anthropic.PermissionDeniedError) {
    return {
      status: 403,
      kind: 'auth',
      message: 'This API key does not have access to the requested model.',
    }
  }

  if (err instanceof Anthropic.NotFoundError) {
    return {
      status: 404,
      kind: 'bad_request',
      message: `Model not found. Check ANTHROPIC_MODEL — the request used "${model}".`,
    }
  }

  if (err instanceof Anthropic.RateLimitError) {
    // The SDK already retried with backoff (max_retries) before surfacing this,
    // so a 429 here means the limit is sustained, not a momentary spike.
    const retryAfter = Number(err?.headers?.['retry-after'] ?? err?.headers?.get?.('retry-after'))
    return {
      status: 429,
      kind: 'rate_limit',
      retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
      message: Number.isFinite(retryAfter)
        ? `Rate limited by the Anthropic API. Retry in about ${retryAfter}s.`
        : 'Rate limited by the Anthropic API. Wait a moment and retry.',
    }
  }

  if (err instanceof Anthropic.BadRequestError) {
    return { status: 400, kind: 'bad_request', message: err.message }
  }

  if (err instanceof Anthropic.APIConnectionError) {
    return {
      status: 503,
      kind: 'network',
      message: 'Could not reach the Anthropic API. Check the network connection and retry.',
    }
  }

  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 502
    return {
      status,
      kind: status >= 500 ? 'upstream' : 'bad_request',
      message:
        status >= 500
          ? 'The Anthropic API returned a server error. This is usually transient — retry.'
          : err.message,
    }
  }

  return {
    status: 500,
    kind: 'unknown',
    message: err?.message || 'The request failed for an unexpected reason.',
  }
}

function missingKeyResponse(res) {
  return sendJson(res, 500, {
    error: {
      kind: 'config',
      message:
        'ANTHROPIC_API_KEY is not set. Copy .env.example to .env, add your key, and restart the dev server.',
    },
  })
}

/** Extracts the forced tool call, or an error describing why there isn't one. */
function extractToolInput(response, toolName) {
  if (response.stop_reason === 'refusal') {
    return {
      error: {
        status: 422,
        kind: 'refusal',
        message:
          'The model declined to process this input. Rephrase it, or use different synthetic material.',
      },
    }
  }

  const toolUse = response.content.find(
    (block) => block.type === 'tool_use' && block.name === toolName,
  )

  if (!toolUse) {
    const hint =
      response.stop_reason === 'max_tokens'
        ? ' The response hit the token limit — raise ANTHROPIC_MAX_TOKENS.'
        : ''
    return {
      error: {
        status: 502,
        kind: 'malformed_response',
        message: `The model returned no structured output (stop_reason: ${response.stop_reason}).${hint}`,
      },
    }
  }

  return { input: toolUse.input }
}

// ---------------------------------------------------------------------------
// POST /api/triage — Step 1 conversational intake
// ---------------------------------------------------------------------------

async function handleTriage(req, res, config) {
  if (!config.anthropic.apiKey) return missingKeyResponse(res)

  const key = clientKey(req)

  let body
  try {
    // Tighter body cap than synthesis: a triage turn is a chat message, and the
    // per-message limit is 2k characters.
    body = await readBody(req, LIMITS.MAX_MESSAGE_CHARS * 4 + LIMITS.MAX_TRANSCRIPT_CHARS * 2)
  } catch (err) {
    const described = describeError(err, config.anthropic.model)
    return sendJson(res, described.status, { error: described })
  }

  const message = typeof body.message === 'string' ? body.message : ''
  const turns = Array.isArray(body.turns) ? body.turns : []

  // Recomputed from the payload rather than trusting a client-supplied count.
  const turnCount = turns.filter((t) => t?.role === 'patient').length
  const transcriptChars = turns.reduce(
    (sum, t) => sum + (t?.text?.length ?? 0) + (t?.reply?.length ?? 0),
    0,
  )

  const blocked = checkTriageAllowed({ key, turnCount, message, transcriptChars })
  if (blocked) {
    return sendJson(res, blocked.status, { error: blocked })
  }

  const client = new Anthropic({ apiKey: config.anthropic.apiKey })
  recordTriageCall(key)

  try {
    const response = await client.messages.create({
      model: config.anthropic.model,
      // Deliberately much smaller than the synthesis cap: replies are meant to
      // be under 90 words, and a low ceiling is a cost control that also keeps
      // the agent from drifting into essays.
      max_tokens: LIMITS.MAX_OUTPUT_TOKENS,
      thinking: { type: 'disabled' },
      // Triage is conversational and shallow. `low` keeps turns fast and cheap;
      // the clinical reasoning happens in Step 2 at higher effort.
      output_config: { effort: 'low' },
      system: TRIAGE_SYSTEM_PROMPT,
      tools: [TRIAGE_TOOL],
      tool_choice: { type: 'tool', name: TRIAGE_TOOL.name },
      messages: [
        ...buildTriageMessages(turns),
        { role: 'user', content: message },
      ],
    })

    const { input, error } = extractToolInput(response, TRIAGE_TOOL.name)
    if (error) return sendJson(res, error.status, { error })

    const scope = ['on_topic', 'off_topic', 'emergency'].includes(input.scope)
      ? input.scope
      : 'on_topic'

    // Escalate repeated off-topic turns into a hard block, so a scripted abuser
    // can't sit in a loop burning calls on polite refusals.
    let strikes = null
    if (scope === 'off_topic') {
      const result = recordOffTopic(key)
      strikes = result
    }

    return sendJson(res, 200, {
      turn: {
        role: 'assistant',
        reply: typeof input.reply === 'string' ? input.reply : '',
        scope,
        information_gathered: Array.isArray(input.information_gathered)
          ? input.information_gathered
          : [],
        still_needed: Array.isArray(input.still_needed) ? input.still_needed : [],
        ready_for_physician: Boolean(input.ready_for_physician),
      },
      meta: {
        model: response.model,
        turnsUsed: turnCount + 1,
        turnsAllowed: LIMITS.MAX_TURNS,
        offTopicStrikes: strikes?.strikes ?? 0,
        blocked: Boolean(strikes?.blocked),
        budgetRemaining: budgetRemaining(),
        usage: {
          inputTokens: response.usage?.input_tokens ?? null,
          outputTokens: response.usage?.output_tokens ?? null,
        },
      },
    })
  } catch (err) {
    console.error('[triage] failed:', err?.message || err)
    const described = describeError(err, config.anthropic.model)
    return sendJson(res, described.status, { error: described })
  }
}

// ---------------------------------------------------------------------------
// POST /api/synthesize — Step 2 second-opinion synthesis
// ---------------------------------------------------------------------------

async function handleSynthesize(req, res, config) {
  if (!config.anthropic.apiKey) return missingKeyResponse(res)

  let body
  try {
    body = await readBody(req)
  } catch (err) {
    const described = describeError(err, config.anthropic.model)
    return sendJson(res, described.status, { error: described })
  }

  const patientMessage = typeof body.patientMessage === 'string' ? body.patientMessage : ''
  const chartText = typeof body.chartText === 'string' ? body.chartText : ''

  if (!patientMessage.trim() && !chartText.trim()) {
    return sendJson(res, 400, {
      error: {
        kind: 'bad_request',
        message: 'Nothing to synthesize. Provide a patient message, chart text, or both.',
      },
    })
  }

  if (patientMessage.length + chartText.length > MAX_CHARS) {
    return sendJson(res, 413, {
      error: {
        kind: 'bad_request',
        message: `Intake is too long (${patientMessage.length + chartText.length} characters, limit ${MAX_CHARS}). Trim the chart material and retry.`,
      },
    })
  }

  const client = new Anthropic({ apiKey: config.anthropic.apiKey })
  const startedAt = Date.now()

  try {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      // Sonnet 4.6 runs without thinking when `thinking` is omitted, but being
      // explicit documents the intent and keeps behavior stable if the model is
      // swapped via ANTHROPIC_MODEL for one where adaptive is the default.
      thinking: { type: 'disabled' },
      output_config: { effort: 'medium' },
      system: SYNTHESIS_SYSTEM_PROMPT,
      tools: [SYNTHESIS_TOOL],
      tool_choice: { type: 'tool', name: SYNTHESIS_TOOL.name },
      messages: [
        { role: 'user', content: buildSynthesisUserMessage({ patientMessage, chartText }) },
      ],
    })

    const { input: draft, error } = extractToolInput(response, SYNTHESIS_TOOL.name)
    if (error) return sendJson(res, error.status, { error })

    if (!draft || typeof draft !== 'object' || typeof draft.one_line_summary !== 'string') {
      return sendJson(res, 502, {
        error: {
          kind: 'malformed_response',
          message: 'The structured draft was missing required fields. Retry the synthesis.',
        },
      })
    }

    return sendJson(res, 200, {
      draft,
      meta: {
        model: response.model,
        stopReason: response.stop_reason,
        elapsedMs: Date.now() - startedAt,
        usage: {
          inputTokens: response.usage?.input_tokens ?? null,
          outputTokens: response.usage?.output_tokens ?? null,
        },
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[synthesize] failed:', err?.message || err)
    const described = describeError(err, config.anthropic.model)
    return sendJson(res, described.status, { error: described })
  }
}

// ---------------------------------------------------------------------------
// POST /api/livekit-token — video visit access token
// ---------------------------------------------------------------------------

async function handleLivekitToken(req, res, config) {
  const { url, apiKey, apiSecret } = config.livekit

  if (!url || !apiKey || !apiSecret) {
    const missing = [
      !url && 'LIVEKIT_URL',
      !apiKey && 'LIVEKIT_API_KEY',
      !apiSecret && 'LIVEKIT_API_SECRET',
    ].filter(Boolean)
    return sendJson(res, 500, {
      error: {
        kind: 'config',
        message: `Video visits are not configured — missing ${missing.join(', ')}. Add them to .env and restart the dev server.`,
      },
    })
  }

  let body
  try {
    body = await readBody(req, 8_000)
  } catch (err) {
    const described = describeError(err, config.anthropic.model)
    return sendJson(res, described.status, { error: described })
  }

  // Room name is derived from the case ID rather than accepted verbatim, so a
  // client can't request an arbitrary room and land in another case's visit.
  const validated = validateTokenRequest({
    caseId: body.caseId,
    role: body.role,
    displayName: body.displayName,
  })

  if (validated.error) {
    return sendJson(res, validated.error.status, { error: validated.error })
  }

  try {
    const token = await mintToken({
      apiKey,
      apiSecret,
      roomName: validated.roomName,
      identity: validated.identity,
      name: validated.name,
    })

    return sendJson(res, 200, {
      token,
      // Returned here so the client needs no VITE_LIVEKIT_URL: all three LiveKit
      // values stay server-side, and the browser learns only the one non-secret
      // value it needs, when it needs it.
      url,
      room: validated.roomName,
      identity: validated.identity,
      name: validated.name,
      expiresInSeconds: TOKEN_TTL_SECONDS,
    })
  } catch (err) {
    console.error('[livekit] token generation failed:', err?.message || err)
    return sendJson(res, 500, {
      error: {
        kind: 'token_failed',
        message:
          'Could not generate a video access token. Check LIVEKIT_API_KEY and LIVEKIT_API_SECRET.',
      },
    })
  }
}

// ---------------------------------------------------------------------------

function route(handler, config) {
  return (req, res, next) => {
    if (req.method === 'POST') {
      handler(req, res, config).catch((err) => {
        console.error('[api] unhandled:', err)
        sendJson(res, 500, { error: { kind: 'unknown', message: 'The request failed.' } })
      })
      return
    }
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.setHeader('Allow', 'POST')
      res.end()
      return
    }
    next()
  }
}

function attach(server, config) {
  server.middlewares.use(
    '/api/triage/reset',
    route(async (req, res) => {
      resetClient(clientKey(req))
      sendJson(res, 200, { ok: true, budgetRemaining: budgetRemaining() })
    }, config),
  )
  server.middlewares.use('/api/triage', route(handleTriage, config))
  server.middlewares.use('/api/synthesize', route(handleSynthesize, config))
  server.middlewares.use('/api/livekit-token', route(handleLivekitToken, config))
}

/** @param {{ apiKey?: string, model?: string, maxTokens?: number, keySource?: string | null }} env */
/**
 * @param {{
 *   anthropic?: { apiKey?: string, model?: string, maxTokens?: number, keySource?: string },
 *   livekit?: { url?: string, apiKey?: string, apiSecret?: string, keySource?: string },
 * }} env
 */
export function devApi(env = {}) {
  const config = {
    anthropic: {
      apiKey: env.anthropic?.apiKey || '',
      model: env.anthropic?.model || DEFAULT_MODEL,
      maxTokens: Number(env.anthropic?.maxTokens) || DEFAULT_MAX_TOKENS,
      keySource: env.anthropic?.keySource || 'not set',
    },
    livekit: {
      url: env.livekit?.url || '',
      apiKey: env.livekit?.apiKey || '',
      apiSecret: env.livekit?.apiSecret || '',
      keySource: env.livekit?.keySource || 'not set',
    },
  }

  return {
    name: 'auricle-dev-api',
    configureServer(server) {
      const log = server.config.logger

      if (!config.anthropic.apiKey) {
        log.warn(
          '[auricle] ANTHROPIC_API_KEY is not set — triage and synthesis will return a config error. Copy .env.example to .env and add your key.',
        )
      } else {
        log.info(
          `[auricle] anthropic ready: POST /api/triage, /api/synthesize (model: ${config.anthropic.model})`,
        )
        // Sources are named explicitly because Vite picks up a shell-exported
        // value even with no .env file — without this you can't tell which
        // credential is actually in use.
        log.info(`[auricle] anthropic key from: ${config.anthropic.keySource}`)
        log.info(
          `[auricle] triage guards: ${LIMITS.MAX_TURNS} turns/session, ${LIMITS.MAX_PER_WINDOW}/min, ${LIMITS.MAX_CALLS_PER_PROCESS} calls/process`,
        )
      }

      const livekitReady =
        config.livekit.url && config.livekit.apiKey && config.livekit.apiSecret
      if (!livekitReady) {
        log.warn(
          '[auricle] LiveKit is not configured — video visits will show a setup message. Add LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET to .env.',
        )
      } else {
        log.info(`[auricle] livekit ready: POST /api/livekit-token (${config.livekit.url})`)
        log.info(`[auricle] livekit secret from: ${config.livekit.keySource}`)
      }

      attach(server, config)
    },
    configurePreviewServer(server) {
      attach(server, config)
    },
  }
}
