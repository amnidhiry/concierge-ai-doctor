import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDataChannel } from '@livekit/components-react'
import { useLiveTranscript } from './useLiveTranscript.js'
import { mergeSegments, segmentsToTranscript } from '../lib/liveTranscript.js'

/**
 * Both halves of the conversation, on two machines.
 *
 * Browser speech recognition hears one microphone: the local one. Echo
 * cancellation removes the remote party before the recogniser gets the signal, so
 * a physician on their own laptop can transcribe only themselves. Two tabs on one
 * machine hide this — they share a microphone that hears everyone in the room —
 * which makes the single-device demo flatter the feature.
 *
 * So each side transcribes itself and publishes its finalised segments over the
 * LiveKit data channel. This hook merges what it recognised locally with what
 * arrived from the other participant, ordered by call time.
 *
 * Must be called inside `<LiveKitRoom>`; `useDataChannel` needs room context.
 *
 * Still no audio anywhere: what crosses the wire is recognised text.
 */

const TOPIC = 'transcript'

export function useSharedTranscript({ role, lang } = {}) {
  const local = useLiveTranscript({ role, lang })
  const [remoteSegments, setRemoteSegments] = useState([])
  const publishedCount = useRef(0)

  const { message, send } = useDataChannel(TOPIC)

  // Publish only segments not yet sent. Re-sending the whole array on every
  // change would duplicate every line on the far side.
  useEffect(() => {
    if (!send) return
    const pending = local.segments.slice(publishedCount.current)
    if (pending.length === 0) return
    publishedCount.current = local.segments.length
    try {
      send(new TextEncoder().encode(JSON.stringify(pending)), { reliable: true })
    } catch {
      // A failed publish costs the far side those lines. The local transcript is
      // unaffected, and the physician's own copy is the one that feeds
      // documentation, so this is degraded rather than broken — not worth
      // interrupting a live call over.
    }
  }, [local.segments, send])

  useEffect(() => {
    if (!message?.payload) return
    try {
      const decoded = JSON.parse(new TextDecoder().decode(message.payload))
      if (!Array.isArray(decoded)) return
      setRemoteSegments((prev) => [
        ...prev,
        // Trust the shape, not the content: a malformed or hostile payload must
        // not be able to inject a fake speaker label into a clinical transcript.
        ...decoded
          .filter((s) => s && typeof s.text === 'string' && typeof s.speaker === 'string')
          .map((s) => ({
            speaker: s.speaker === 'Physician' ? 'Physician' : 'Patient',
            text: String(s.text).slice(0, 2000),
            at: Number.isFinite(s.at) ? Math.max(0, Math.floor(s.at)) : 0,
            remote: true,
          })),
      ])
    } catch {
      // Ignore anything that is not our payload shape.
    }
  }, [message])

  const segments = useMemo(
    () => mergeSegments(local.segments, remoteSegments),
    [local.segments, remoteSegments],
  )

  const transcript = useMemo(() => segmentsToTranscript(segments), [segments])

  const reset = useCallback(() => {
    local.reset()
    setRemoteSegments([])
    publishedCount.current = 0
  }, [local])

  return {
    ...local,
    segments,
    transcript,
    hasContent: segments.length > 0,
    remoteCount: remoteSegments.length,
    reset,
  }
}
