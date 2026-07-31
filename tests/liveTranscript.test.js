import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  describeRecognitionError,
  makeSegment,
  mergeSegments,
  readResults,
  segmentsToTranscript,
  speakerLabelFor,
  speechRecognitionSupported,
} from '../src/lib/liveTranscript.js'

describe('speakerLabelFor', () => {
  it('labels by the local role, since there is no voice diarisation', () => {
    assert.equal(speakerLabelFor('physician'), 'Physician')
    assert.equal(speakerLabelFor('patient'), 'Patient')
  })

  it('treats anything unrecognised as the patient rather than throwing', () => {
    assert.equal(speakerLabelFor(undefined), 'Patient')
    assert.equal(speakerLabelFor('admin'), 'Patient')
  })
})

describe('speechRecognitionSupported', () => {
  it('is false with no window (server render, test runner)', () => {
    assert.equal(speechRecognitionSupported(undefined), false)
  })

  it('detects the unprefixed and webkit-prefixed constructors', () => {
    assert.equal(speechRecognitionSupported({ SpeechRecognition: function () {} }), true)
    assert.equal(speechRecognitionSupported({ webkitSpeechRecognition: function () {} }), true)
    assert.equal(speechRecognitionSupported({}), false)
  })
})

describe('makeSegment', () => {
  it('trims text and floors the offset', () => {
    const s = makeSegment({ speaker: 'Physician', text: '  hello  ', at: 1234.9 })
    assert.equal(s.text, 'hello')
    assert.equal(s.at, 1234)
  })

  it('never produces a negative offset', () => {
    assert.equal(makeSegment({ speaker: 'Patient', text: 'x', at: -50 }).at, 0)
  })
})

describe('segmentsToTranscript', () => {
  it('returns empty for no usable content, so nothing is sent to be written up', () => {
    assert.equal(segmentsToTranscript([]), '')
    assert.equal(segmentsToTranscript([{ speaker: 'Patient', text: '   ', at: 0 }]), '')
  })

  it('stamps each line and attributes a speaker', () => {
    const text = segmentsToTranscript(
      [
        { speaker: 'Physician', text: 'What brought you in?', at: 0 },
        { speaker: 'Patient', text: 'My calcium score.', at: 65_000 },
      ],
      { header: false },
    )
    assert.equal(text, '[00:00] Physician: What brought you in?\n[01:05] Patient: My calcium score.')
  })

  it('carries provenance in the header — this is the anti-misrepresentation guard', () => {
    const text = segmentsToTranscript([{ speaker: 'Patient', text: 'hi', at: 0 }])
    assert.match(text, /LIVE-CAPTURED/)
    assert.match(text, /this device's microphone only/)
    assert.match(text, /Not a recording/)
    assert.match(text, /No audio was stored/)
  })
})

describe('describeRecognitionError', () => {
  it('treats routine pauses and restarts as non-events', () => {
    // Chrome fires these constantly; surfacing them would train users to ignore
    // the error banner entirely.
    assert.equal(describeRecognitionError('no-speech'), null)
    assert.equal(describeRecognitionError('aborted'), null)
  })

  it('marks permission and device failures fatal', () => {
    for (const code of ['not-allowed', 'service-not-allowed', 'audio-capture']) {
      const d = describeRecognitionError(code)
      assert.equal(d.fatal, true, code)
      assert.ok(d.message.length > 20, code)
    }
  })

  it('marks a network drop recoverable and explains why one is needed', () => {
    const d = describeRecognitionError('network')
    assert.equal(d.fatal, false)
    assert.match(d.message, /server-side/)
  })

  it('always yields a kind and a message for an unknown code', () => {
    const d = describeRecognitionError('something-new')
    assert.ok(d.kind && d.message)
  })
})

describe('readResults', () => {
  const evt = (results, resultIndex = 0) => ({ resultIndex, results })

  it('separates finalised text from interim guesses', () => {
    const { final, interim } = readResults(
      evt([
        { isFinal: true, 0: { transcript: 'the calcium score ' } },
        { isFinal: false, 0: { transcript: 'was two forty' } },
      ]),
    )
    assert.equal(final, 'the calcium score')
    assert.equal(interim, 'was two forty')
  })

  it('honours resultIndex so re-delivered results are not duplicated', () => {
    // The API re-sends from resultIndex onward; reading from 0 doubles the text.
    const { final } = readResults(
      evt(
        [
          { isFinal: true, 0: { transcript: 'already counted' } },
          { isFinal: true, 0: { transcript: 'new text' } },
        ],
        1,
      ),
    )
    assert.equal(final, 'new text')
  })
})

describe('mergeSegments', () => {
  it('interleaves both sides by call time', () => {
    const merged = mergeSegments(
      [{ speaker: 'Physician', text: 'a', at: 0 }, { speaker: 'Physician', text: 'c', at: 2000 }],
      [{ speaker: 'Patient', text: 'b', at: 1000 }],
    )
    assert.deepEqual(merged.map((s) => s.text), ['a', 'b', 'c'])
  })

  it('marks provenance so the UI can distinguish the two sides', () => {
    const merged = mergeSegments(
      [{ speaker: 'Physician', text: 'a', at: 0 }],
      [{ speaker: 'Patient', text: 'b', at: 1 }],
    )
    assert.equal(merged[0].remote, false)
    assert.equal(merged[1].remote, true)
  })

  it('breaks ties deterministically, local first', () => {
    const merged = mergeSegments(
      [{ speaker: 'Physician', text: 'local', at: 500 }],
      [{ speaker: 'Patient', text: 'remote', at: 500 }],
    )
    assert.deepEqual(merged.map((s) => s.text), ['local', 'remote'])
  })

  it('drops whitespace-only segments, which are truthy and slipped a naive filter', () => {
    assert.equal(mergeSegments([{ speaker: 'Patient', text: '   ', at: 0 }]).length, 0)
    assert.equal(segmentsToTranscript([{ speaker: 'Patient', text: '\n\t ', at: 0 }]), '')
  })

  it('drops empty segments and tolerates missing inputs', () => {
    assert.deepEqual(mergeSegments(), [])
    assert.equal(mergeSegments([{ speaker: 'Patient', text: '', at: 0 }]).length, 0)
  })
})
