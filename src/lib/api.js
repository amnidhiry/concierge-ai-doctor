/**
 * Client wrappers for the API endpoints.
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

/** One turn of the AI-assisted intake conversation. */
export function requestIntakeTurn({ message, turns }, options) {
  return post('/api/intake', { message, turns }, options)
}

/** Clears this client's server-side intake counters. Wired to Reset. */
export function resetIntake() {
  return post('/api/intake/reset', {})
}

/** Assembles the care packet the physician reads before the call. */
export function requestCarePacket({ patientMessage, chartText }, options) {
  return post('/api/care-packet', { patientMessage, chartText }, options)
}

/**
 * Drafts the post-call documentation.
 *
 * `transcript` is always operator-pasted synthetic text — there is no
 * speech-to-text in this build, and the server rejects an empty transcript
 * rather than drafting from the care packet alone.
 */
export function requestVisitDocumentation({ transcript, packet }, options) {
  return post('/api/visit-documentation', { transcript, packet }, options)
}
