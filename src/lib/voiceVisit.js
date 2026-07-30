/**
 * Voice-visit token fetch and microphone pre-flight.
 *
 * Framework-free so the logic stays testable and portable (a Flutter client
 * would need the same two steps in the same order).
 *
 * ── Audio only, on purpose ─────────────────────────────────────────────────
 * The visit is a voice call. There is no camera request anywhere in this module,
 * no video constraint, and no fallback that turns a camera on. That is a product
 * decision rather than a simplification: a preventive-cardiology expert-opinion
 * call is a conversation about a record, video adds a consent and retention
 * surface it doesn't need, and a phone call is the format patients already know
 * how to have. The server-issued token narrows the publish grant to the
 * microphone source as well, so "no video" holds even if a client asked for it.
 */

/** Fetches a scoped LiveKit access token for one case and role. */
export async function fetchVisitToken({ caseId, role, displayName }) {
  let response
  try {
    response = await fetch('/api/livekit-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, role, displayName }),
    })
  } catch {
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
        message: `Token endpoint returned a non-JSON response (HTTP ${response.status}).`,
      },
    }
  }

  if (!response.ok || body?.error) {
    return {
      ok: false,
      error: {
        kind: body?.error?.kind || 'unknown',
        message: body?.error?.message || `Token request failed (HTTP ${response.status}).`,
      },
    }
  }

  return { ok: true, ...body }
}

/**
 * Requests the microphone up front.
 *
 * Done deliberately *before* connecting rather than letting LiveKit surface the
 * failure, because getUserMedia's error names carry far more actionable detail
 * than a generic connection failure does — and permission problems are the single
 * most likely thing to go wrong in a live demo.
 *
 * The track is stopped immediately. Permission persists for the origin, so
 * LiveKit re-acquires without a second prompt.
 */
export async function preflightMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      error: {
        kind: 'unsupported',
        message:
          'This browser does not expose microphone access. Chrome, Edge, Safari, or Firefox on a recent version will work.',
      },
    }
  }

  // getUserMedia requires a secure context. localhost counts as secure, so this
  // only bites when the demo is served over plain http from another host.
  if (!window.isSecureContext) {
    return {
      ok: false,
      error: {
        kind: 'insecure_context',
        message:
          'Microphone access needs a secure context. Use http://localhost (not a LAN IP) or serve the app over HTTPS.',
      },
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    stream.getTracks().forEach((t) => t.stop())
    return { ok: true }
  } catch (err) {
    return { ok: false, error: describeMediaError(err) }
  }
}

/** Maps a getUserMedia DOMException onto something a user can act on. */
export function describeMediaError(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return {
        kind: 'permission_denied',
        message:
          'Microphone access was blocked. Click the microphone or lock icon in your browser address bar, allow access, then try again.',
      }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        kind: 'no_device',
        message:
          'No microphone was found. Connect one, or check that it is not disabled at the system level.',
      }
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        kind: 'device_busy',
        message:
          'The microphone is already in use by another app or tab. Close the other one and try again.',
      }
    case 'SecurityError':
      return {
        kind: 'insecure_context',
        message: 'The browser blocked microphone access for this page on security grounds.',
      }
    default:
      return {
        kind: 'media_unknown',
        message: err?.message
          ? `Could not access the microphone: ${err.message}`
          : 'Could not access the microphone.',
      }
  }
}

/** The URL a patient opens to join their visit in a second tab. */
export function patientVisitPath(caseId) {
  return `/visit/${encodeURIComponent(caseId)}`
}

export function patientVisitUrl(caseId) {
  return `${window.location.origin}${patientVisitPath(caseId)}`
}

/**
 * Formats elapsed seconds as m:ss for the call timer.
 *
 * Guards against a non-finite input rather than trusting the caller. `Math.max(0,
 * Math.floor(x))` propagates NaN, so a bad value would render "NaN:NaN" in the
 * call header — visible, alarming, and during a live call the worst possible place
 * for it. Deliberately not clamped at an hour: a call that overruns its booked
 * slot should keep counting, because that is exactly when the physician wants to
 * see the number.
 */
export function formatElapsed(totalSeconds) {
  const parsed = Number(totalSeconds)
  const safe = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
