import { useCallback, useRef, useState } from 'react'
import { fetchVisitToken, preflightMicrophone } from '../lib/voiceVisit.js'

/**
 * State machine for joining a scheduled voice visit.
 *
 *   idle → requesting → connecting → connected → ended
 *                  ↘ error
 *
 * `requesting` covers the microphone pre-flight and token fetch; `connecting` is
 * handed to LiveKitRoom, which reports `connected` via its callback. Splitting
 * those two means a permission problem is distinguishable from a signalling
 * problem, which is the difference between "allow your microphone" and "check
 * your network".
 *
 * There is no video state here. The visit is audio-only and the token grant is
 * narrowed to the microphone source server-side, so there is nothing for a
 * camera flag to be true about.
 */
export function useVoiceVisit({ caseId, role, displayName }) {
  const [status, setStatus] = useState('idle')
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const starting = useRef(false)

  const join = useCallback(async () => {
    if (starting.current) return
    starting.current = true

    setStatus('requesting')
    setError(null)
    setNotice(null)

    // Microphone first: no point spending a token request if it is blocked.
    const media = await preflightMicrophone()
    if (!media.ok) {
      setError(media.error)
      setStatus('error')
      starting.current = false
      return
    }

    const token = await fetchVisitToken({ caseId, role, displayName })
    if (!token.ok) {
      setError(token.error)
      setStatus('error')
      starting.current = false
      return
    }

    setSession({
      token: token.token,
      url: token.url,
      room: token.room,
      identity: token.identity,
      name: token.name,
    })
    setStatus('connecting')
    starting.current = false
  }, [caseId, role, displayName])

  const onConnected = useCallback(() => setStatus('connected'), [])

  const onDisconnected = useCallback(() => {
    setStatus((prev) => (prev === 'error' ? prev : 'ended'))
    setSession(null)
  }, [])

  /** LiveKit room-level failure (signalling, token rejected, transport). */
  const onRoomError = useCallback((err) => {
    setError({
      kind: 'room_error',
      message: err?.message
        ? `Voice connection failed: ${err.message}`
        : 'Voice connection failed.',
    })
    setStatus('error')
    setSession(null)
  }, [])

  /** LiveKit device-level failure after connecting. */
  const onMediaFailure = useCallback((failure) => {
    setNotice(
      failure
        ? `The microphone became unavailable (${failure}). The other participant cannot hear you.`
        : 'The microphone became unavailable. The other participant cannot hear you.',
    )
  }, [])

  const reset = useCallback(() => {
    starting.current = false
    setStatus('idle')
    setSession(null)
    setError(null)
    setNotice(null)
  }, [])

  return {
    status,
    session,
    error,
    notice,
    isActive: status === 'connecting' || status === 'connected',
    join,
    reset,
    onConnected,
    onDisconnected,
    onRoomError,
    onMediaFailure,
    dismissNotice: () => setNotice(null),
  }
}
