/**
 * Vite plugin exposing `POST /api/synthesize` during `npm run dev` and
 * `npm run preview`.
 *
 * Why a server-side proxy at all: the Anthropic API cannot be called safely
 * from browser JS. Doing so requires the
 * `anthropic-dangerous-direct-browser-access` header and ships the API key in
 * the client bundle, where anyone who opens devtools can read it. This
 * middleware runs in Node, so the key stays in `.env` and never crosses to the
 * browser.
 *
 * Structured output is forced with a single tool plus
 * `tool_choice: {type: 'tool', name: ...}`. The model must emit a `tool_use`
 * block, and `block.input` arrives already parsed — so there is no
 * "extract JSON from prose" step that can fail on a stray code fence. This
 * also works on every current model; `output_config.format` does not (it is
 * unavailable on Sonnet 4.6).
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  SYNTHESIS_SYSTEM_PROMPT,
  SYNTHESIS_TOOL,
  buildSynthesisUserMessage,
} from '../src/prompts/synthesisPrompt.js'

const DEFAULT_MODEL = 'claude-sonnet-4-6'
const DEFAULT_MAX_TOKENS = 8000

// Guards against a paste large enough to blow the context window. The Vite dev
// server has no body-size limit of its own, so we impose one.
const MAX_CHARS = 200_000

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    let aborted = false
    req.on('data', (chunk) => {
      if (aborted) return
      raw += chunk
      if (raw.length > MAX_CHARS * 2) {
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
        reject(
          Object.assign(new Error('Request body was not valid JSON.'), { httpStatus: 400 }),
        )
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
function describeError(err) {
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
      message: `Model not found. Check ANTHROPIC_MODEL — the request used "${err?.requestModel ?? 'the configured model'}".`,
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
    message: err?.message || 'Synthesis failed for an unexpected reason.',
  }
}

async function handleSynthesize(req, res, config) {
  if (!config.apiKey) {
    return sendJson(res, 500, {
      error: {
        kind: 'config',
        message:
          'ANTHROPIC_API_KEY is not set. Copy .env.example to .env, add your key, and restart the dev server.',
      },
    })
  }

  let body
  try {
    body = await readBody(req)
  } catch (err) {
    const described = describeError(err)
    return sendJson(res, described.status, { error: described })
  }

  const patientMessage = typeof body.patientMessage === 'string' ? body.patientMessage : ''
  const chartText = typeof body.chartText === 'string' ? body.chartText : ''

  if (!patientMessage.trim() && !chartText.trim()) {
    return sendJson(res, 400, {
      error: {
        kind: 'bad_request',
        message:
          'Nothing to synthesize. Provide a patient message, chart text, or both.',
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

  const client = new Anthropic({ apiKey: config.apiKey })
  const startedAt = Date.now()

  try {
    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      // Sonnet 4.6 runs without thinking when `thinking` is omitted, but being
      // explicit documents the intent and keeps behavior stable if the model is
      // swapped via ANTHROPIC_MODEL for one where adaptive is the default.
      thinking: { type: 'disabled' },
      output_config: { effort: 'medium' },
      system: SYNTHESIS_SYSTEM_PROMPT,
      tools: [SYNTHESIS_TOOL],
      tool_choice: { type: 'tool', name: SYNTHESIS_TOOL.name },
      messages: [
        {
          role: 'user',
          content: buildSynthesisUserMessage({ patientMessage, chartText }),
        },
      ],
    })

    // Check stop_reason before reading content — a refusal returns HTTP 200
    // with empty or partial content, so indexing into content[0] first would
    // throw on a success response.
    if (response.stop_reason === 'refusal') {
      return sendJson(res, 422, {
        error: {
          kind: 'refusal',
          message:
            'The model declined to process this case. Rephrase the intake or use different synthetic material.',
        },
      })
    }

    const toolUse = response.content.find((block) => block.type === 'tool_use')

    if (!toolUse) {
      // Most likely cause: max_tokens was hit before the tool call completed.
      const hint =
        response.stop_reason === 'max_tokens'
          ? ' The response hit the token limit — raise ANTHROPIC_MAX_TOKENS.'
          : ''
      return sendJson(res, 502, {
        error: {
          kind: 'malformed_response',
          message: `The model returned no structured draft (stop_reason: ${response.stop_reason}).${hint}`,
        },
      })
    }

    const draft = toolUse.input

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
    if (err instanceof Anthropic.NotFoundError) err.requestModel = config.model
    const described = describeError(err)
    // Log server-side so the operator sees the real cause; the client gets the
    // sanitized message only.
    console.error('[synthesize] failed:', err?.message || err)
    return sendJson(res, described.status, { error: described })
  }
}

function attach(server, config) {
  server.middlewares.use('/api/synthesize', (req, res, next) => {
    if (req.method === 'POST') {
      handleSynthesize(req, res, config).catch((err) => {
        console.error('[synthesize] unhandled:', err)
        sendJson(res, 500, {
          error: { kind: 'unknown', message: 'Synthesis failed unexpectedly.' },
        })
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
  })
}

/** @param {{ apiKey?: string, model?: string, maxTokens?: number, keySource?: string | null }} env */
export function anthropicProxy(env = {}) {
  const config = {
    apiKey: env.apiKey || '',
    model: env.model || DEFAULT_MODEL,
    maxTokens: Number(env.maxTokens) || DEFAULT_MAX_TOKENS,
    keySource: env.keySource || null,
  }

  return {
    name: 'concierge-anthropic-proxy',
    configureServer(server) {
      if (!config.apiKey) {
        server.config.logger.warn(
          '[concierge] ANTHROPIC_API_KEY is not set — Step 2 synthesis will return a config error. Copy .env.example to .env and add your key.',
        )
      } else {
        server.config.logger.info(
          `[concierge] synthesis proxy ready at POST /api/synthesize (model: ${config.model})`,
        )
        // Named explicitly because Vite picks up a shell-exported key even with
        // no .env file — without this line you can't tell which key is billing.
        server.config.logger.info(
          `[concierge] API key loaded from: ${config.keySource ?? 'unknown source'}`,
        )
      }
      attach(server, config)
    },
    configurePreviewServer(server) {
      attach(server, config)
    },
  }
}
