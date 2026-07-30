/**
 * Voice-visit token tests.
 *
 * This module is the security boundary of the call: it decides which room a
 * caller lands in and what they are allowed to publish once there. Two properties
 * matter enough to assert rather than trust.
 *
 * **Room names are derived, never accepted.** A client that could name its own
 * room could join another patient's visit. The derivation plus the charset check
 * is what prevents that, and both are one edit away from being loosened.
 *
 * **The grant is audio-only and non-administrative.** "No video" is a product
 * claim made on every marketing page, and a UI that simply declines to ask for a
 * camera is not an enforcement of it — the token is. So the minted JWT is decoded
 * here and its grant inspected, rather than trusting the call site.
 *
 * No credential is read from the environment: these use throwaway literals, so the
 * tests run identically with or without a configured .env.
 */

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import {
  CASE_ID_PATTERN,
  ROLES,
  TOKEN_TTL_SECONDS,
  mintToken,
  roomNameForCase,
  validateTokenRequest,
} from '../server/livekitToken.js'

/** Obviously-fake credentials. Long enough for the signer, meaningless everywhere else. */
const TEST_API_KEY = 'APItestkeytestkey'
const TEST_API_SECRET = 'test-secret-not-a-real-credential-0123456789abcdef'

/** Decodes a JWT payload without verifying it — we are inspecting claims, not trusting them. */
function decodePayload(jwt) {
  const [, payload] = jwt.split('.')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

describe('roomNameForCase', () => {
  it('derives a namespaced room from the case id', () => {
    assert.equal(roomNameForCase('pt-2284'), 'visit-pt-2284')
  })

  it('gives different cases different rooms', () => {
    assert.notEqual(roomNameForCase('pt-1'), roomNameForCase('pt-2'))
  })
})

describe('validateTokenRequest', () => {
  it('accepts a well-formed request and derives room and identity', () => {
    const result = validateTokenRequest({ caseId: 'pt-2284', role: 'physician' })
    assert.equal(result.error, undefined)
    assert.equal(result.roomName, 'visit-pt-2284')
    assert.equal(result.identity, 'physician-pt-2284')
    assert.equal(result.name, 'Physician')
  })

  it('keys identity to the role so two tabs cannot evict each other', () => {
    // LiveKit disconnects an existing participant when a second joins with the
    // same identity. In a one-browser demo a shared identity would look exactly
    // like a broken connection.
    const physician = validateTokenRequest({ caseId: 'c1', role: 'physician' })
    const patient = validateTokenRequest({ caseId: 'c1', role: 'patient' })
    assert.notEqual(physician.identity, patient.identity)
    assert.equal(physician.roomName, patient.roomName, 'both seats share one room')
  })

  it('rejects a role it does not know', () => {
    for (const role of ['admin', 'observer', 'PHYSICIAN', '', null, undefined, 42]) {
      const result = validateTokenRequest({ caseId: 'c1', role })
      assert.ok(result.error, `role "${role}" should be refused`)
      assert.equal(result.error.status, 400)
    }
  })

  it('only knows physician and patient', () => {
    assert.deepEqual(Object.keys(ROLES).sort(), ['patient', 'physician'])
  })

  it('rejects a case id that could escape its namespace', () => {
    const hostile = [
      '../other-case',
      'a/b',
      'case id',
      'case;id',
      'case:id',
      'a'.repeat(65),
      '',
      'visit-*',
      'c1\n',
      'c1%20',
      '<script>',
    ]
    for (const caseId of hostile) {
      const result = validateTokenRequest({ caseId, role: 'patient' })
      assert.ok(result.error, `caseId ${JSON.stringify(caseId)} should be refused`)
      assert.equal(result.error.status, 400)
    }
  })

  it('rejects a non-string case id', () => {
    for (const caseId of [null, undefined, 42, {}, ['c1']]) {
      assert.ok(validateTokenRequest({ caseId, role: 'patient' }).error)
    }
  })

  it('accepts the charset it documents, and only that', () => {
    for (const ok of ['a', 'pt-2284', 'PT_2284', 'a'.repeat(64), '0']) {
      assert.ok(CASE_ID_PATTERN.test(ok), `${ok} should be allowed`)
      assert.equal(validateTokenRequest({ caseId: ok, role: 'patient' }).error, undefined)
    }
  })

  it('uses the role label when no display name is given', () => {
    assert.equal(validateTokenRequest({ caseId: 'c1', role: 'patient' }).name, 'Patient')
    assert.equal(
      validateTokenRequest({ caseId: 'c1', role: 'patient', displayName: '   ' }).name,
      'Patient',
    )
  })

  it('trims and caps a supplied display name', () => {
    const result = validateTokenRequest({
      caseId: 'c1',
      role: 'physician',
      displayName: `  ${'N'.repeat(120)}  `,
    })
    assert.equal(result.name.length, 60)
    assert.equal(result.name, 'N'.repeat(60))
  })

  it('ignores a non-string display name rather than failing the request', () => {
    assert.equal(validateTokenRequest({ caseId: 'c1', role: 'patient', displayName: 7 }).name, 'Patient')
  })
})

describe('mintToken', () => {
  it('issues a JWT scoped to one room and one identity', async () => {
    const jwt = await mintToken({
      apiKey: TEST_API_KEY,
      apiSecret: TEST_API_SECRET,
      roomName: 'visit-pt-1',
      identity: 'patient-pt-1',
      name: 'Patient',
    })
    assert.equal(jwt.split('.').length, 3, 'should be a three-part JWT')

    const payload = decodePayload(jwt)
    assert.equal(payload.sub, 'patient-pt-1')
    assert.equal(payload.video.room, 'visit-pt-1')
    assert.equal(payload.video.roomJoin, true)
  })

  it('grants publishing of the microphone and nothing else', async () => {
    // This is the enforcement behind "audio only". A client asking to publish a
    // camera track is refused by the server, not merely not asked for by the UI.
    const jwt = await mintToken({
      apiKey: TEST_API_KEY,
      apiSecret: TEST_API_SECRET,
      roomName: 'visit-pt-1',
      identity: 'physician-pt-1',
      name: 'Physician',
    })
    const { video } = decodePayload(jwt)
    assert.deepEqual(video.canPublishSources, ['microphone'])
    assert.ok(!video.canPublishSources.includes('camera'))
    assert.ok(!video.canPublishSources.includes('screen_share'))
  })

  it('withholds every administrative capability', async () => {
    const jwt = await mintToken({
      apiKey: TEST_API_KEY,
      apiSecret: TEST_API_SECRET,
      roomName: 'visit-pt-1',
      identity: 'patient-pt-1',
      name: 'Patient',
    })
    const { video } = decodePayload(jwt)
    // The SDK omits false-valued grants, so absent and false are both acceptable
    // — what matters is that none of these is true.
    for (const capability of ['roomAdmin', 'roomCreate', 'roomList', 'roomRecord', 'canPublishData']) {
      assert.notEqual(video[capability], true, `${capability} must not be granted`)
    }
    assert.equal(video.canSubscribe, true, 'a participant still needs to hear the other side')
  })

  it('expires within the documented window', async () => {
    const jwt = await mintToken({
      apiKey: TEST_API_KEY,
      apiSecret: TEST_API_SECRET,
      roomName: 'visit-pt-1',
      identity: 'patient-pt-1',
      name: 'Patient',
    })
    const payload = decodePayload(jwt)
    const lifetime = payload.exp - payload.nbf
    assert.equal(lifetime, TOKEN_TTL_SECONDS)
  })

  it('covers a 30-minute visit with room for a late start, and no more than an hour', () => {
    assert.ok(TOKEN_TTL_SECONDS > 30 * 60, 'must outlast the longest booked visit')
    assert.ok(TOKEN_TTL_SECONDS <= 60 * 60, 'a leaked token should decay quickly')
  })
})
