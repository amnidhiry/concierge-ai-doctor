/**
 * Voice-visit client-library tests.
 *
 * Only the framework-free, browser-free parts are covered here: the call timer
 * formatter, the media-error mapping, and the patient link. `preflightMicrophone`
 * and `fetchVisitToken` need `navigator`/`fetch` and belong in a browser test that
 * this prototype does not have a harness for — noted in the README rather than
 * faked with a mock deep enough to test the mock.
 *
 * The media-error mapping is worth testing precisely because it is the thing a
 * person reads when a live demo breaks. A wrong or generic message there costs the
 * demo; a specific one usually saves it.
 */

import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import { describeMediaError, formatElapsed, patientVisitPath } from '../src/lib/voiceVisit.js'

describe('formatElapsed', () => {
  it('formats under a minute with a zero-padded second', () => {
    assert.equal(formatElapsed(0), '0:00')
    assert.equal(formatElapsed(5), '0:05')
    assert.equal(formatElapsed(59), '0:59')
  })

  it('rolls over into minutes', () => {
    assert.equal(formatElapsed(60), '1:00')
    assert.equal(formatElapsed(61), '1:01')
    assert.equal(formatElapsed(1500), '25:00')
  })

  it('does not cap at an hour — an overrunning call keeps counting', () => {
    assert.equal(formatElapsed(3600), '60:00')
    assert.equal(formatElapsed(3661), '61:01')
  })

  it('floors fractional seconds rather than rounding up', () => {
    // Rounding up would show 0:01 the instant the call connects, which reads as a
    // timer that started before the call did.
    assert.equal(formatElapsed(0.9), '0:00')
    assert.equal(formatElapsed(59.99), '0:59')
  })

  it('never renders a negative or non-numeric duration', () => {
    for (const bad of [-1, -600, NaN, undefined, null, 'x']) {
      assert.equal(formatElapsed(bad), '0:00', `input ${bad} should floor to 0:00`)
    }
  })
})

describe('describeMediaError', () => {
  const cases = [
    ['NotAllowedError', 'permission_denied', /address bar/],
    ['PermissionDeniedError', 'permission_denied', /allow access/],
    ['NotFoundError', 'no_device', /No microphone was found/],
    ['DevicesNotFoundError', 'no_device', /Connect one/],
    ['NotReadableError', 'device_busy', /already in use/],
    ['TrackStartError', 'device_busy', /Close the other one/],
    ['SecurityError', 'insecure_context', /security grounds/],
  ]

  for (const [name, kind, messagePattern] of cases) {
    it(`maps ${name} to ${kind} with an actionable message`, () => {
      const described = describeMediaError({ name })
      assert.equal(described.kind, kind)
      assert.match(described.message, messagePattern)
    })
  }

  it('falls back to a generic kind but keeps the underlying message', () => {
    const described = describeMediaError({ name: 'SomethingNew', message: 'kernel said no' })
    assert.equal(described.kind, 'media_unknown')
    assert.match(described.message, /kernel said no/)
  })

  it('handles a thrown non-error without crashing', () => {
    for (const junk of [null, undefined, {}, 'a string']) {
      const described = describeMediaError(junk)
      assert.equal(described.kind, 'media_unknown')
      assert.ok(described.message.length > 0)
    }
  })

  it('never mentions a camera — the visit has none', () => {
    // A camera-permission message on an audio-only call sends the user to fix a
    // setting that has nothing to do with the failure.
    for (const [name] of cases) {
      const { message } = describeMediaError({ name })
      assert.doesNotMatch(message, /camera|video|webcam/i, `${name} message mentions video`)
    }
    assert.doesNotMatch(describeMediaError({}).message, /camera|video/i)
  })

  it('always returns both a kind and a message', () => {
    for (const [name] of cases) {
      const described = describeMediaError({ name })
      assert.equal(typeof described.kind, 'string')
      assert.equal(typeof described.message, 'string')
    }
  })
})

describe('patientVisitPath', () => {
  it('builds the standalone join route', () => {
    assert.equal(patientVisitPath('pt-2284'), '/visit/pt-2284')
  })

  it('encodes anything that would break the path', () => {
    assert.equal(patientVisitPath('a b'), '/visit/a%20b')
    assert.equal(patientVisitPath('a/b'), '/visit/a%2Fb')
    assert.equal(patientVisitPath('../x'), '/visit/..%2Fx')
  })

  it('stays under /visit so the route matches outside the demo tree', () => {
    // The patient tab has none of the first tab's state, so this route must not
    // live under /demo where the layout would expect a provider.
    assert.match(patientVisitPath('c1'), /^\/visit\//)
  })
})
