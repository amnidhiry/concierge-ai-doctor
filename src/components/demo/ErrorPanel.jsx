import { Button } from '../ui/primitives.jsx'

/**
 * Failure state for the synthesis call.
 *
 * A failed call must never render as an empty draft — the reviewer has to be
 * able to tell "the model said nothing useful" from "the call did not happen".
 * Each error kind gets a specific remedy, because "something went wrong" leaves
 * the operator with nowhere to go.
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
    hint: 'Safety classifiers stopped the response. Rephrase the intake, or use different synthetic material.',
    retryable: false,
  },
  malformed_response: {
    title: 'Unusable response',
    hint: 'The call returned no valid structured draft. If it hit the token limit, raise ANTHROPIC_MAX_TOKENS in .env; otherwise retry.',
    retryable: true,
  },
  bad_request: {
    title: 'Request rejected',
    hint: 'The API rejected the request as malformed. Check the model name in .env if it was changed.',
    retryable: false,
  },
  unknown: {
    title: 'Synthesis failed',
    hint: 'An unexpected error. The dev-server console has the underlying message.',
    retryable: true,
  },
}

export function ErrorPanel({ error, onRetry, onStartOver }) {
  const guide = GUIDANCE[error?.kind] ?? GUIDANCE.unknown

  return (
    <div role="alert" className="overflow-hidden rounded-lg border border-alert/30 bg-paper-raised shadow-card">
      <div className="h-0.5 bg-alert" />
      <div className="p-6 sm:p-8">
        <p className="field-label text-alert">Step 2 failed</p>
        <h2 className="mt-3 font-display text-2xl leading-tight text-ink">{guide.title}</h2>

        {error?.message && (
          <p className="mt-4 rounded-md bg-alert-wash px-4 py-3 font-mono text-[13px] leading-relaxed text-alert">
            {error.message}
          </p>
        )}

        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-slate">{guide.hint}</p>

        {error?.retryAfterSeconds ? (
          <p className="mt-2 font-mono text-[13px] text-slate">
            Suggested wait: {error.retryAfterSeconds}s
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-3">
          {guide.retryable && (
            <Button variant="primary" onClick={onRetry}>
              Retry synthesis
            </Button>
          )}
          <Button variant="outline" onClick={onStartOver}>
            Start over with a new case
          </Button>
        </div>
      </div>
    </div>
  )
}
