/**
 * Client wrappers for the two API endpoints.
 *
 * Every failure path resolves to the same
 * `{ ok: false, error: { kind, message, retryAfterSeconds? } }` shape so the UI
 * has exactly one error contract to render — a thrown exception from here would
 * be a bug, not a state the caller has to handle separately.
 */

async function post(path, payload, { signal } = {}) {
  let response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
        message: 'Could not reach the local API. Is the dev server still running?',
      },
    }
  }

  let body
  try {
    body = await response.json()
  } catch {
    return {
      ok: false,
      error: {
        kind: 'malformed_response',
        message: `The endpoint returned a non-JSON response (HTTP ${response.status}).`,
      },
    }
  }

  if (!response.ok || body?.error) {
    const error = body?.error ?? {}
    return {
      ok: false,
      error: {
        kind: error.kind || 'unknown',
        message: error.message || `Request failed (HTTP ${response.status}).`,
        retryAfterSeconds: error.retryAfterSeconds ?? null,
      },
    }
  }

  return { ok: true, ...body }
}

/** Step 1 — one turn of the triage conversation. */
export function requestTriage({ message, turns }, options) {
  return post('/api/triage', { message, turns }, options)
}

/** Clears this client's server-side triage counters. Wired to Reset. */
export function resetTriage() {
  return post('/api/triage/reset', {})
}

/** Step 2 — the second-opinion synthesis. */
export function requestSynthesis({ patientMessage, chartText }, options) {
  return post('/api/synthesize', { patientMessage, chartText }, options)
}
