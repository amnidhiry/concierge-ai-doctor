import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  describeRecognitionError,
  getSpeechRecognition,
  makeSegment,
  readResults,
  segmentsToTranscript,
  speakerLabelFor,
  speechRecognitionSupported,
} from '../lib/liveTranscript.js'

/**
 * Drives browser speech recognition for the duration of a call.
 *
 * The awkward part of this API is that it stops on its own — Chrome ends a
 * session after a stretch of silence and caps session length — so "continuous"
 * transcription means restarting it every time it ends, while distinguishing a
 * restart from a genuine stop. That is what `wantCapture` is for: the ref holds
 * the operator's intent, and `onend` consults it rather than assuming.
 *
 * No audio is retained. Segments hold recognised text only.
 */
export function useLiveTranscript({ role, lang = 'en-US' } = {}) {
  const supported = useMemo(() => speechRecognitionSupported(), [])
  const [capturing, setCapturing] = useState(false)
  const [segments, setSegments] = useState([])
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  const wantCapture = useRef(false)
  const startedAt = useRef(0)
  // Restart storms: if recognition dies immediately and repeatedly (no mic, no
  // network), unconditional restarts become a hot loop. Back off instead.
  const consecutiveFailures = useRef(0)

  const speaker = speakerLabelFor(role)

  const stop = useCallback(() => {
    wantCapture.current = false
    consecutiveFailures.current = 0
    setCapturing(false)
    setInterim('')
    const recognition = recognitionRef.current
    if (recognition) {
      try {
        recognition.stop()
      } catch {
        // stop() throws if it was never started; harmless.
      }
    }
  }, [])

  const start = useCallback(() => {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setError({
        kind: 'unsupported',
        fatal: true,
        message:
          'This browser has no speech recognition API. Chrome or Edge support it; Safari and Firefox largely do not. You can still paste a transcript after the call.',
      })
      return
    }

    setError(null)
    wantCapture.current = true
    if (!startedAt.current) startedAt.current = Date.now()

    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      consecutiveFailures.current = 0
      const { final, interim: pending } = readResults(event)
      setInterim(pending)
      if (final) {
        setSegments((prev) => [
          ...prev,
          makeSegment({ speaker, text: final, at: Date.now() - startedAt.current }),
        ])
      }
    }

    recognition.onerror = (event) => {
      const described = describeRecognitionError(event?.error)
      if (described) {
        setError(described)
        if (described.fatal) {
          wantCapture.current = false
          setCapturing(false)
        }
      }
    }

    recognition.onend = () => {
      // Chrome ends a session on silence and on a length cap. Restart only if the
      // operator still wants capture, and back off if it is failing immediately.
      if (!wantCapture.current) {
        setCapturing(false)
        return
      }
      consecutiveFailures.current += 1
      if (consecutiveFailures.current > 8) {
        wantCapture.current = false
        setCapturing(false)
        setError({
          kind: 'restart_loop',
          fatal: true,
          message:
            'Speech recognition kept stopping immediately. Transcription is off — paste a transcript after the call instead.',
        })
        return
      }
      const delay = Math.min(250 * consecutiveFailures.current, 2000)
      setTimeout(() => {
        if (!wantCapture.current) return
        try {
          recognition.start()
        } catch {
          // start() throws if it is already running; the next onend retries.
        }
      }, delay)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setCapturing(true)
    } catch (err) {
      setError({
        kind: 'start_failed',
        fatal: false,
        message: `Could not start transcription: ${err?.message ?? 'unknown error'}`,
      })
    }
  }, [lang, speaker])

  const reset = useCallback(() => {
    stop()
    setSegments([])
    setInterim('')
    setError(null)
    startedAt.current = 0
  }, [stop])

  // Always release the microphone when the component goes away, or recognition
  // keeps running after the call screen is gone.
  useEffect(() => stop, [stop])

  const transcript = useMemo(() => segmentsToTranscript(segments), [segments])

  return {
    supported,
    capturing,
    segments,
    interim,
    error,
    transcript,
    hasContent: segments.length > 0,
    start,
    stop,
    reset,
    dismissError: () => setError(null),
  }
}
