/**
 * Client wrapper for the synthesis endpoint.
 *
 * The only network call the app makes. Every failure path resolves to the same
 * `{ ok: false, error: { kind, message, retryAfterSeconds? } }` shape so the UI
 * has exactly one error contract to render — a thrown exception here would be a
 * bug, not a state the caller has to handle separately.
 */

/** @param {{ patientMessage: string, chartText: string }} intake */
export async function requestSynthesis({ patientMessage, chartText }, { signal } = {}) {
  let response
  try {
    response = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientMessage, chartText }),
      signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      return { ok: false, aborted: true, error: { kind: 'aborted', message: 'Cancelled.' } }
    }
    return {
      ok: false,
      error: {
        kind: 'network',
        message:
          'Could not reach the local synthesis endpoint. Is the dev server still running?',
      },
    }
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    return {
      ok: false,
      error: {
        kind: 'malformed_response',
        message: `The synthesis endpoint returned a non-JSON response (HTTP ${response.status}).`,
      },
    }
  }

  if (!response.ok || payload?.error) {
    const error = payload?.error ?? {}
    return {
      ok: false,
      error: {
        kind: error.kind || 'unknown',
        message: error.message || `Synthesis failed (HTTP ${response.status}).`,
        retryAfterSeconds: error.retryAfterSeconds ?? null,
      },
    }
  }

  return { ok: true, draft: payload.draft, meta: payload.meta }
}
