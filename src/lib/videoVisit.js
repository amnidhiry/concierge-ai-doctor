/**
 * Video-visit token fetch and media pre-flight.
 *
 * Framework-free so the logic stays testable and portable (the Flutter client
 * would need the same two steps in the same order).
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
 * Requests camera and microphone up front.
 *
 * Done deliberately *before* connecting rather than letting LiveKit surface the
 * failure, because getUserMedia's error names carry far more actionable detail
 * than a generic connection failure does — and permission problems are the single
 * most likely thing to go wrong in a live demo.
 *
 * The tracks are stopped immediately. Permission persists for the origin, so
 * LiveKit re-acquires without a second prompt.
 *
 * Returns `{ ok: true, video: boolean }` — `video: false` means audio was
 * obtained but the camera was not, which is a usable call rather than a failure.
 */
export async function preflightMedia({ wantVideo = true } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      error: {
        kind: 'unsupported',
        message:
          'This browser does not expose camera and microphone access. Chrome, Edge, Safari, or Firefox on a recent version will work.',
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
          'Camera access needs a secure context. Use http://localhost (not a LAN IP) or serve the app over HTTPS.',
      },
    }
  }

  const attempt = async (constraints) => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    stream.getTracks().forEach((t) => t.stop())
  }

  try {
    await attempt({ audio: true, video: wantVideo })
    return { ok: true, video: wantVideo }
  } catch (err) {
    // A camera already held by another tab or app is the most common failure in
    // a two-tab demo. Audio-only is a genuinely useful call, so degrade to it
    // rather than refusing to connect.
    if (wantVideo && (err?.name === 'NotReadableError' || err?.name === 'AbortError')) {
      try {
        await attempt({ audio: true, video: false })
        return {
          ok: true,
          video: false,
          notice:
            'The camera is in use elsewhere — most likely the other tab, or another app. Joining with audio only.',
        }
      } catch (audioErr) {
        return { ok: false, error: describeMediaError(audioErr) }
      }
    }
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
          'Camera and microphone access was blocked. Click the camera icon in your browser address bar, allow access, then try again.',
      }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        kind: 'no_device',
        message:
          'No camera or microphone was found. Connect one, or check that it is not disabled at the system level.',
      }
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        kind: 'device_busy',
        message:
          'The camera or microphone is already in use by another app or tab. Close the other one and try again.',
      }
    case 'OverconstrainedError':
      return {
        kind: 'overconstrained',
        message: 'No device matched the requested video settings.',
      }
    case 'SecurityError':
      return {
        kind: 'insecure_context',
        message: 'The browser blocked media access for this page on security grounds.',
      }
    default:
      return {
        kind: 'media_unknown',
        message: err?.message
          ? `Could not access camera or microphone: ${err.message}`
          : 'Could not access the camera or microphone.',
      }
  }
}

/** The URL a patient opens to join a visit in a second tab. */
export function patientVisitPath(caseId) {
  return `/visit/${encodeURIComponent(caseId)}`
}

export function patientVisitUrl(caseId) {
  return `${window.location.origin}${patientVisitPath(caseId)}`
}
