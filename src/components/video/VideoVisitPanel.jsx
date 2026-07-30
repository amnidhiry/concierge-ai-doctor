import { LiveKitRoom } from '@livekit/components-react'
// Base styles for GridLayout/ParticipantTile internals (aspect ratios, track
// fitting, focus handling). Imported here rather than in main.jsx so it ships in
// the lazy video chunk instead of the eager entry bundle. Our `.lk-shell`
// overrides in index.css win on specificity regardless of load order — they are
// two-class selectors and custom properties on a nested scope.
import '@livekit/components-styles'
import { VideoVisitStage } from './VideoVisitStage.jsx'
import { Button } from '../ui/primitives.jsx'

/**
 * Every non-connected state of a video visit, plus the LiveKitRoom wrapper.
 *
 * Shared by the physician modal and the standalone patient page so the two sides
 * behave identically — a permission failure or a token error should read the same
 * whichever seat you're in.
 */

const ERROR_GUIDANCE = {
  permission_denied: {
    title: 'Camera and microphone blocked',
    steps: [
      'Click the camera or lock icon in the browser address bar.',
      'Set Camera and Microphone to Allow for this site.',
      'Reload the page, then rejoin.',
    ],
    retryable: true,
  },
  device_busy: {
    title: 'Camera already in use',
    steps: [
      'Close any other app using the camera (Zoom, Photo Booth, Teams).',
      'In a two-tab demo, the other tab may already hold it — try joining audio-only.',
    ],
    retryable: true,
  },
  no_device: {
    title: 'No camera or microphone found',
    steps: [
      'Connect a camera or headset.',
      'Check that it is not disabled in system privacy settings.',
    ],
    retryable: true,
  },
  insecure_context: {
    title: 'Insecure context',
    steps: [
      'Browsers only allow camera access over HTTPS or on localhost.',
      'Open the app at http://localhost:5173 rather than a LAN IP address.',
    ],
    retryable: false,
  },
  config: {
    title: 'Video visits not configured',
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
    title: 'Video connection failed',
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
  title: 'Could not start the video visit',
  steps: ['Retry, and check the dev-server console for the underlying error.'],
  retryable: true,
}

function ErrorState({ error, onRetry, onAudioOnly, onClose }) {
  const guide = ERROR_GUIDANCE[error?.kind] ?? FALLBACK
  const canAudioOnly = error?.kind === 'device_busy' || error?.kind === 'overconstrained'

  return (
    <div role="alert" className="px-6 py-8 sm:px-8">
      <p className="field-label text-crimson">Video visit</p>
      <h3 className="mt-3 font-display text-2xl leading-tight text-ink">{guide.title}</h3>

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
        {canAudioOnly && (
          <Button variant="outline" onClick={onAudioOnly}>
            Join with audio only
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

function PreJoinState({ role, onJoin, onClose, echoWarning }) {
  return (
    <div className="px-6 py-8 sm:px-8">
      <p className="field-label">Video visit</p>
      <h3 className="mt-3 font-display text-2xl leading-tight text-ink">
        {role === 'physician' ? 'Start the visit' : 'Join your visit'}
      </h3>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-umber">
        Your browser will ask for camera and microphone access. Nothing is recorded — this build has
        no recording, transcription, or screen sharing.
      </p>

      {echoWarning && (
        <p className="mt-4 rounded-md border border-dune-deep bg-dune/40 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
          Running both sides in one browser will echo, because each tab plays the other's audio
          through your speakers into your mic. Use headphones, or mute one side.
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => onJoin({ wantVideo: true })}>
          Allow camera and join
        </Button>
        <Button variant="outline" onClick={() => onJoin({ wantVideo: false })}>
          Join with audio only
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
      <p className="mt-5 font-display text-xl text-ink">Requesting camera and microphone</p>
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
      <h3 className="mt-3 font-display text-2xl leading-tight text-ink">You've left the visit</h3>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-umber">
        {role === 'physician'
          ? 'The room stays open — rejoin any time, or close this to return to the dashboard.'
          : 'You can rejoin if the visit is still in progress.'}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button variant="primary" onClick={onRejoin}>
          Rejoin
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * @param {object} props
 * @param {ReturnType<import('../../hooks/useVideoVisit.js').useVideoVisit>} props.visit
 */
export function VideoVisitPanel({ visit, role, onClose, echoWarning = true }) {
  if (visit.status === 'error') {
    return (
      <ErrorState
        error={visit.error}
        onRetry={() => visit.join({ wantVideo: true })}
        onAudioOnly={() => visit.join({ wantVideo: false })}
        onClose={onClose}
      />
    )
  }

  if (visit.status === 'idle') {
    return (
      <PreJoinState role={role} onJoin={visit.join} onClose={onClose} echoWarning={echoWarning} />
    )
  }

  if (visit.status === 'requesting') return <RequestingState />

  if (visit.status === 'ended') {
    return <EndedState role={role} onRejoin={() => visit.join({ wantVideo: true })} onClose={onClose} />
  }

  // connecting | connected — LiveKitRoom owns the transport from here.
  return (
    <div className="lk-shell flex h-[70vh] min-h-[420px] flex-col bg-ink text-sandstone">
      <LiveKitRoom
        token={visit.session.token}
        serverUrl={visit.session.url}
        connect
        audio
        video={visit.videoEnabled}
        onConnected={visit.onConnected}
        onDisconnected={visit.onDisconnected}
        onError={visit.onRoomError}
        onMediaDeviceFailure={visit.onMediaFailure}
        className="flex min-h-0 flex-1 flex-col"
      >
        <VideoVisitStage
          role={role}
          notice={visit.notice}
          onDismissNotice={visit.dismissNotice}
        />
      </LiveKitRoom>
    </div>
  )
}
