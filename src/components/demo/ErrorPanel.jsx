import { Button } from '../ui/primitives.jsx'

/**
 * Failure state for a model call.
 *
 * A failed call must never render as an empty document — the reviewer has to be
 * able to tell "the model said nothing useful" from "the call did not happen".
 * Each error kind gets a specific remedy, because "something went wrong" leaves
 * the operator with nowhere to go.
 *
 * Shared by the care-packet and documentation stages; `stage` only changes the
 * label, since every remedy below is about the call rather than about which stage
 * made it.
 */

const GUIDANCE = {
  config: {
    title: 'API key not configured',
    hint: 'Copy .env.example to .env, add ANTHROPIC_API_KEY, and restart the dev server. The key is read server-side and never reaches the browser.',
    retryable: false,
  },
  auth: {
    title: 'API key rejected',
    hint: 'The key in .env was refused. Check for a stray newline or a key from a different organization, then restart the dev server.',
    retryable: false,
  },
  rate_limit: {
    title: 'Rate limited',
    hint: 'The Anthropic API is throttling this key. The SDK already retried with backoff, so this limit is sustained rather than momentary.',
    retryable: true,
  },
  network: {
    title: 'Could not reach the API',
    hint: 'Check the network connection and that the dev server is still running, then retry.',
    retryable: true,
  },
  upstream: {
    title: 'Anthropic API error',
    hint: 'A server-side error, usually transient. Retrying is the right move.',
    retryable: true,
  },
  refusal: {
    title: 'The model declined this request',
    hint: 'Safety classifiers stopped the response. Rephrase the input, or use different synthetic material.',
    retryable: false,
  },
  malformed_response: {
    title: 'Unusable response',
    hint: 'The call returned no valid structured output. If it hit the token limit, raise ANTHROPIC_MAX_TOKENS in .env; otherwise retry.',
    retryable: true,
  },
  no_transcript: {
    title: 'No transcript to work from',
    hint: 'Documentation is never drafted without a transcript. Transcribe the call live, or paste the synthetic visit transcript first, then retry.',
    retryable: false,
  },
  bad_request: {
    title: 'Request rejected',
    hint: 'The API rejected the request as malformed. Check the model name in .env if it was changed.',
    retryable: false,
  },
  unknown: {
    title: 'The call failed',
    hint: 'An unexpected error. The dev-server console has the underlying message.',
    retryable: true,
  },
}

export function ErrorPanel({ error, onRetry, onStartOver, stage = 'Model call', startOverLabel }) {
  const guide = GUIDANCE[error?.kind] ?? GUIDANCE.unknown

  return (
    <div
      role="alert"
      className="overflow-hidden rounded-lg border border-crimson/30 bg-sandstone-raised shadow-card"
    >
      <div className="h-0.5 bg-crimson" />
      <div className="p-6 sm:p-8">
        <p className="field-label text-crimson">{stage} failed</p>
        <h2 className="mt-3 text-title text-ink">{guide.title}</h2>

        {error?.message && (
          <p className="mt-4 rounded-md bg-crimson-wash px-4 py-3 font-mono text-[13px] leading-relaxed text-crimson">
            {error.message}
          </p>
        )}

        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-umber">{guide.hint}</p>

        {error?.retryAfterSeconds ? (
          <p className="mt-2 font-mono text-[13px] text-umber">
            Suggested wait: {error.retryAfterSeconds}s
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-3">
          {guide.retryable && onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Retry
            </Button>
          )}
          {onStartOver && (
            <Button variant="outline" onClick={onStartOver}>
              {startOverLabel ?? 'Start over with a new booking'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
