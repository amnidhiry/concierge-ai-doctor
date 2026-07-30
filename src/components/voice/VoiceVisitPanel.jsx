import { LiveKitRoom } from '@livekit/components-react'
import { VoiceVisitStage } from './VoiceVisitStage.jsx'
import { Button } from '../ui/primitives.jsx'
import { VISIT_MINUTES } from '../../domain/models.js'

/**
 * Every non-connected state of a voice visit, plus the LiveKitRoom wrapper.
 *
 * Shared by the physician's visit view and the standalone patient page so the two
 * sides behave identically — a permission failure or a token error should read
 * the same whichever seat you're in.
 *
 * `@livekit/components-styles` is deliberately not imported. That stylesheet
 * themes `GridLayout`/`ParticipantTile`, which this audio-only call does not use;
 * importing it would ship a video theme for components that never render.
 */

const ERROR_GUIDANCE = {
  permission_denied: {
    title: 'Microphone blocked',
    steps: [
      'Click the microphone or lock icon in the browser address bar.',
      'Set Microphone to Allow for this site.',
      'Reload the page, then rejoin.',
    ],
    retryable: true,
  },
  device_busy: {
    title: 'Microphone already in use',
    steps: [
      'Close any other app holding the microphone (Zoom, Teams, a voice recorder).',
      'In a two-tab demo the other tab may already hold it — mute or close that tab first.',
    ],
    retryable: true,
  },
  no_device: {
    title: 'No microphone found',
    steps: [
      'Connect a microphone or headset.',
      'Check that it is not disabled in system privacy settings.',
    ],
    retryable: true,
  },
  insecure_context: {
    title: 'Insecure context',
    steps: [
      'Browsers only allow microphone access over HTTPS or on localhost.',
      'Open the app at http://localhost:5173 rather than a LAN IP address.',
    ],
    retryable: false,
  },
  unsupported: {
    title: 'Browser cannot access audio devices',
    steps: ['Use a recent version of Chrome, Edge, Safari, or Firefox.'],
    retryable: false,
  },
  config: {
    title: 'Voice visits not configured',
    steps: [
      'Add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET to .env.',
      'Restart the dev server — env vars are read at startup.',
    ],
    retryable: false,
  },
  token_failed: {
    title: 'Could not issue an access token',
    steps: [
      'Check that LIVEKIT_API_KEY and LIVEKIT_API_SECRET are from the same key pair.',
      'The secret is shown only once at creation — mint a new pair if it was lost.',
    ],
    retryable: true,
  },
  room_error: {
    title: 'Voice connection failed',
    steps: [
      'Check that LIVEKIT_URL points at your project and starts with wss://.',
      'A corporate VPN or firewall blocking WebRTC will also cause this.',
    ],
    retryable: true,
  },
  network: {
    title: 'Could not reach the local API',
    steps: ['Check that the dev server is still running, then retry.'],
    retryable: true,
  },
}

const FALLBACK = {
  title: 'Could not start the voice visit',
  steps: ['Retry, and check the dev-server console for the underlying error.'],
  retryable: true,
}

function ErrorState({ error, onRetry, onClose }) {
  const guide = ERROR_GUIDANCE[error?.kind] ?? FALLBACK

  return (
    <div role="alert" className="px-6 py-8 sm:px-8">
      <p className="field-label text-crimson">Voice visit</p>
      <h3 className="mt-3 text-title text-ink">{guide.title}</h3>

      {error?.message && (
        <p className="mt-4 rounded-md bg-crimson-wash px-4 py-3 text-[13px] leading-relaxed text-crimson">
          {error.message}
        </p>
      )}

      <ol className="mt-5 space-y-2">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-muted">
            <span className="font-mono text-[13px] text-umber">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-7 flex flex-wrap gap-3">
        {guide.retryable && (
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

function PreJoinState({ role, durationMinutes, onJoin, onClose, echoWarning }) {
  const booked = durationMinutes || VISIT_MINUTES.max

  return (
    <div className="px-6 py-8 sm:px-8">
      <p className="field-label">Voice visit</p>
      <h3 className="mt-3 text-title text-ink">
        {role === 'physician' ? 'Start the call' : 'Join your call'}
      </h3>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-umber">
        This is an audio call — voice only, no camera, booked for {booked} minutes. Your browser
        will ask for microphone access. Nothing is recorded or transcribed.
      </p>

      {echoWarning && (
        <p className="mt-4 rounded-md border border-dune-deep bg-dune/40 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
          Running both sides in one browser will echo, because each tab plays the other's audio
          through your speakers into your microphone. Use headphones, or mute one side.
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <Button variant="primary" onClick={onJoin}>
          Allow microphone and join
        </Button>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

function RequestingState() {
  return (
    <div className="px-6 py-12 text-center sm:px-8">
      <span className="mx-auto flex h-3 w-3 animate-breathe rounded-full bg-pulse" />
      <p className="mt-5 text-title text-ink">Requesting the microphone</p>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-umber">
        If your browser is showing a permission prompt, choose Allow.
      </p>
    </div>
  )
}

function EndedState({ role, onRejoin, onClose }) {
  return (
    <div className="px-6 py-10 sm:px-8">
      <p className="field-label text-verified">Call ended</p>
      <h3 className="mt-3 text-title text-ink">You've left the call</h3>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-umber">
        {role === 'physician'
          ? 'The room stays open — rejoin if the call is not finished, or move on to the documentation stage.'
          : 'You can rejoin if the call is still in progress. Your written summary follows once the physician has approved it.'}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button variant="outline" onClick={onRejoin}>
          Rejoin
        </Button>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * @param {object} props
 * @param {ReturnType<import('../../hooks/useVoiceVisit.js').useVoiceVisit>} props.visit
 */
export function VoiceVisitPanel({
  visit,
  role,
  onClose,
  onEndVisit,
  durationMinutes,
  echoWarning = true,
}) {
  if (visit.status === 'error') {
    return <ErrorState error={visit.error} onRetry={visit.join} onClose={onClose} />
  }

  if (visit.status === 'idle') {
    return (
      <PreJoinState
        role={role}
        durationMinutes={durationMinutes}
        onJoin={visit.join}
        onClose={onClose}
        echoWarning={echoWarning}
      />
    )
  }

  if (visit.status === 'requesting') return <RequestingState />

  if (visit.status === 'ended') {
    return <EndedState role={role} onRejoin={visit.join} onClose={onClose} />
  }

  // connecting | connected — LiveKitRoom owns the transport from here.
  return (
    <div className="flex h-[26rem] min-h-[380px] flex-col bg-ink text-sandstone">
      <LiveKitRoom
        token={visit.session.token}
        serverUrl={visit.session.url}
        connect
        audio
        // Explicit rather than omitted. The token grant already refuses a camera
        // publish, but stating it here means nobody reading this file has to go
        // and check the server to know the call has no video.
        video={false}
        onConnected={visit.onConnected}
        onDisconnected={visit.onDisconnected}
        onError={visit.onRoomError}
        onMediaDeviceFailure={visit.onMediaFailure}
        className="flex min-h-0 flex-1 flex-col"
      >
        <VoiceVisitStage
          role={role}
          notice={visit.notice}
          onDismissNotice={visit.dismissNotice}
          durationMinutes={durationMinutes}
          onEndVisit={onEndVisit}
        />
      </LiveKitRoom>
    </div>
  )
}
