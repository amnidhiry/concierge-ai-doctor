import { useCallback, useRef, useState } from 'react'
import { fetchVisitToken, preflightMedia } from '../lib/videoVisit.js'

/**
 * State machine for joining a video visit.
 *
 *   idle → requesting → connecting → connected → ended
 *                  ↘ error
 *
 * `requesting` covers the media pre-flight and token fetch; `connecting` is
 * handed to LiveKitRoom, which reports `connected` via its callback. Splitting
 * those two means a permission problem is distinguishable from a signalling
 * problem, which is the difference between "allow your camera" and "check your
 * network".
 */
export function useVideoVisit({ caseId, role, displayName }) {
  const [status, setStatus] = useState('idle')
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const starting = useRef(false)

  const join = useCallback(
    async ({ wantVideo = true } = {}) => {
      if (starting.current) return
      starting.current = true

      setStatus('requesting')
      setError(null)
      setNotice(null)

      // Media first: no point spending a token request if the camera is blocked.
      const media = await preflightMedia({ wantVideo })
      if (!media.ok) {
        setError(media.error)
        setStatus('error')
        starting.current = false
        return
      }
      if (media.notice) setNotice(media.notice)
      setVideoEnabled(media.video)

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
    },
    [caseId, role, displayName],
  )

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
        ? `Video connection failed: ${err.message}`
        : 'Video connection failed.',
    })
    setStatus('error')
    setSession(null)
  }, [])

  /** LiveKit device-level failure after connecting. */
  const onMediaFailure = useCallback((failure) => {
    setNotice(
      failure
        ? `A media device became unavailable (${failure}). Audio or video may be off.`
        : 'A media device became unavailable.',
    )
  }, [])

  const reset = useCallback(() => {
    starting.current = false
    setStatus('idle')
    setSession(null)
    setError(null)
    setNotice(null)
    setVideoEnabled(true)
  }, [])

  return {
    status,
    session,
    error,
    notice,
    videoEnabled,
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
