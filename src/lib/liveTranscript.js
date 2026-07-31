/**
 * Live transcription: the pure parts.
 *
 * Kept out of React so the segment handling, speaker attribution, and error
 * mapping can be tested without a browser — none of which the Web Speech API
 * lets you exercise in a test runner.
 *
 * ── What this actually is, and is not ─────────────────────────────────────────
 *
 * The browser's `SpeechRecognition` API. It is genuinely live and genuinely
 * transcribes speech, and three limitations matter enough to surface in the UI
 * rather than bury here:
 *
 *  1. **It hears one microphone — this device's.** In a real two-location call
 *     each side transcribes only its own speaker, because echo cancellation
 *     removes the remote party before the mic signal reaches the recogniser. Two
 *     tabs on one machine share one mic and so appear to capture both sides,
 *     which flatters the feature. Speaker labels are therefore derived from *whose
 *     device this is*, not from voice diarisation — there is none.
 *  2. **In Chrome, audio is sent to Google for recognition.** It is not local. For
 *     anything touching a real consultation that is a disclosure, not a footnote.
 *  3. **Accuracy is consumer-grade.** It drops audio under load, mangles drug
 *     names, and punctuates loosely. Nothing here is clinical-grade capture.
 *
 * No audio is recorded or stored anywhere. Only recognised text is kept, in
 * memory, for the life of the page.
 */

/** Is the API present at all? Safari and Firefox largely lack it. */
export function speechRecognitionSupported(win = typeof window === 'undefined' ? undefined : window) {
  if (!win) return false
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition)
}

export function getSpeechRecognition(win = typeof window === 'undefined' ? undefined : window) {
  if (!win) return null
  return win.SpeechRecognition || win.webkitSpeechRecognition || null
}

/** The label a segment is attributed to, derived from the local participant's role. */
export function speakerLabelFor(role) {
  return role === 'physician' ? 'Physician' : 'Patient'
}

/**
 * Builds a transcript segment.
 *
 * `at` is milliseconds since capture started rather than a wall clock, so the
 * transcript reads as a call timeline and carries no date that could imply a
 * stored recording.
 */
export function makeSegment({ speaker, text, at = 0 }) {
  return { speaker, text: text.trim(), at: Math.max(0, Math.floor(at)) }
}

function stamp(ms) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Renders segments as the transcript text handed to the documentation endpoint.
 *
 * The header is not decoration. This text becomes a clinical note, and a later
 * reader has to be able to tell captured speech from a pasted example — and to
 * know it came from one microphone via a consumer speech API. Losing that
 * provenance is how a rough transcript gets mistaken for a recording.
 */
export function segmentsToTranscript(segments, { header = true } = {}) {
  const body = segments
    // `.trim()`, not just truthiness: a whitespace-only segment is truthy, so a
    // naive filter let it through and produced a transcript that was nothing but
    // a provenance header and an empty speaker line. The documentation endpoint
    // refuses an empty transcript but would have accepted that one, and drafted a
    // clinical note from no speech at all.
    .filter((s) => s?.text?.trim())
    .map((s) => `[${stamp(s.at)}] ${s.speaker}: ${s.text.trim()}`)
    .join('\n')

  if (!body) return ''
  if (!header) return body

  return [
    'LIVE-CAPTURED TRANSCRIPT — browser speech recognition, this device\'s microphone only.',
    'Not a recording. No audio was stored. Consumer-grade accuracy; unverified.',
    '',
    body,
  ].join('\n')
}

/**
 * Maps a SpeechRecognition error code to something actionable.
 *
 * `no-speech` and `aborted` are deliberately not surfaced as errors: Chrome emits
 * them routinely during ordinary pauses and on every restart, and showing an
 * error banner each time someone stops talking would train the user to ignore
 * the banner.
 */
export function describeRecognitionError(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        kind: 'permission_denied',
        fatal: true,
        message:
          'Microphone access for speech recognition was blocked. Allow it in the address bar, then reload and restart transcription.',
      }
    case 'audio-capture':
      return {
        kind: 'no_device',
        fatal: true,
        message: 'No microphone was available for transcription.',
      }
    case 'network':
      return {
        kind: 'network',
        fatal: false,
        message:
          'Speech recognition lost its network connection. Chrome performs recognition server-side, so it needs one.',
      }
    case 'language-not-supported':
      return {
        kind: 'language',
        fatal: true,
        message: 'This browser does not support the requested recognition language.',
      }
    case 'no-speech':
    case 'aborted':
      return null // routine, not worth a banner
    default:
      return {
        kind: 'unknown',
        fatal: false,
        message: code
          ? `Speech recognition reported "${code}".`
          : 'Speech recognition stopped unexpectedly.',
      }
  }
}

/**
 * Pulls finalised and interim text out of a SpeechRecognition result event.
 *
 * The API re-delivers results from `resultIndex` onward, so a naive read that
 * appends everything duplicates text on every event.
 */
export function readResults(event) {
  let final = ''
  let interim = ''
  for (let i = event.resultIndex; i < event.results.length; i += 1) {
    const result = event.results[i]
    const chunk = result[0]?.transcript ?? ''
    if (result.isFinal) final += chunk
    else interim += chunk
  }
  return { final: final.trim(), interim: interim.trim() }
}

/**
 * Merges locally-recognised segments with those received from the other side.
 *
 * Ordered by `at` — milliseconds since each side started capturing. That is an
 * approximation, not a synchronised clock: the two participants start
 * transcription at different moments, so interleaving can be slightly off. It is
 * good enough to read as a conversation and is honest about being reconstructed,
 * which a wall-clock timestamp would not be — that would imply a single recorded
 * timeline that does not exist.
 *
 * Ties keep local speech first, so the transcript reads deterministically rather
 * than reordering as remote messages arrive.
 */
export function mergeSegments(localSegments = [], remoteSegments = []) {
  return [
    ...localSegments.map((s) => ({ ...s, remote: false })),
    ...remoteSegments.map((s) => ({ ...s, remote: true })),
  ]
    .filter((s) => s?.text?.trim())
    .sort((a, b) => (a.at - b.at) || (a.remote === b.remote ? 0 : a.remote ? 1 : -1))
}
