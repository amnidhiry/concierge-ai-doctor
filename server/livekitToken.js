/**
 * LiveKit access-token issuance for the scheduled voice visit.
 *
 * LiveKit rooms are joined with a short-lived JWT signed by the project's API
 * secret. That signing has to happen server-side — the secret is the credential
 * for the whole project, so shipping it to the browser would let anyone mint
 * tokens for any room. This module is the only place it is read.
 *
 * The endpoint also returns the project's WebSocket URL. That means the client
 * needs no `VITE_LIVEKIT_*` variable at all: all three LiveKit values stay
 * server-side, and the browser learns only the one non-secret value it needs, at
 * the moment it needs it.
 *
 * Scope of the grant is deliberately narrow. A token is issued for exactly one
 * room and one identity, can publish and subscribe but not administer, and
 * expires in 45 minutes. It is not a general-purpose credential.
 *
 * ── Why the TTL is 45 minutes ──────────────────────────────────────────────
 * The visit is scheduled for 20–30 minutes. 45 leaves room for a late start and
 * a couple of minutes of overrun without the token expiring mid-sentence, and is
 * still short enough that a leaked token decays on its own.
 */

import { AccessToken } from 'livekit-server-sdk'
// `canPublishSources` is serialized through the SDK's own enum-to-string mapper,
// which throws a TypeError on anything that is not a `TrackSource` member — so the
// obvious-looking `['microphone']` fails at `toJwt()` time, not at `addGrant()`.
// Importing the enum is the only way to build this grant.
import { TrackSource } from '@livekit/protocol'

/** Token lifetime. Covers a 30-minute visit plus a late start. */
const TOKEN_TTL_SECONDS = 45 * 60

/** Roles allowed to join. Anything else is rejected rather than passed through. */
const ROLES = {
  physician: { prefix: 'physician', label: 'Physician' },
  patient: { prefix: 'patient', label: 'Patient' },
}

/**
 * Room names are derived from the case ID rather than accepted verbatim, so a
 * client can't ask for an arbitrary room name and collide with (or eavesdrop on)
 * another case's visit. Anything outside the allowed charset is rejected.
 */
const CASE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

export function roomNameForCase(caseId) {
  return `visit-${caseId}`
}

/**
 * Validates a token request. Returns `{ error }` or `{ roomName, identity, name }`.
 */
export function validateTokenRequest({ caseId, role, displayName }) {
  if (typeof caseId !== 'string' || !CASE_ID_PATTERN.test(caseId)) {
    return {
      error: {
        status: 400,
        kind: 'bad_request',
        message:
          'caseId must be 1–64 characters of letters, numbers, hyphens, or underscores.',
      },
    }
  }

  const roleMeta = ROLES[role]
  if (!roleMeta) {
    return {
      error: {
        status: 400,
        kind: 'bad_request',
        message: `role must be one of: ${Object.keys(ROLES).join(', ')}.`,
      },
    }
  }

  // Identity must be unique per participant in a room — LiveKit disconnects an
  // existing participant when a second one joins with the same identity. Since
  // this demo runs both sides in one browser, a shared identity would show up as
  // each tab silently kicking the other, which looks exactly like a broken
  // connection. Keying identity to the role prevents that.
  const identity = `${roleMeta.prefix}-${caseId}`

  const name =
    typeof displayName === 'string' && displayName.trim()
      ? displayName.trim().slice(0, 60)
      : roleMeta.label

  return { roomName: roomNameForCase(caseId), identity, name }
}

/**
 * Mints a token. Kept free of HTTP concerns so it can be unit-tested directly.
 * @returns {Promise<string>} signed JWT
 */
export async function mintToken({ apiKey, apiSecret, roomName, identity, name }) {
  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: TOKEN_TTL_SECONDS,
  })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    // The visit is audio-only, so the grant is narrowed to the audio source
    // rather than left at "publish anything". A client that tried to publish
    // camera or screen-share video would be refused by the server, which means
    // "no video" is enforced by the token rather than only by the UI choosing
    // not to ask for a camera.
    canPublishSources: [TrackSource.MICROPHONE],
    // No data channel, no room admin, no ability to update other participants.
    canPublishData: false,
    roomAdmin: false,
    roomCreate: false,
  })

  return at.toJwt()
}

export { TOKEN_TTL_SECONDS, ROLES, CASE_ID_PATTERN }
