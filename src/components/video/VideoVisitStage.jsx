import {
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/components-react'
import { ConnectionState, Track } from 'livekit-client'
import { Badge, Button } from '../ui/primitives.jsx'

/**
 * The in-room UI. Rendered inside <LiveKitRoom>, so all hooks here have room
 * context.
 *
 * Uses LiveKit's prebuilt `GridLayout` + `ParticipantTile` rather than
 * hand-rolling video elements — they handle track subscription, speaking
 * indicators, and connection-quality display correctly, which is a lot of detail
 * to reimplement badly. The control bar *is* custom: LiveKit's `ControlBar` is
 * the piece with the most visible default styling, and it carries screen-share
 * and chat affordances that are out of scope here.
 */

function ControlButton({ active, onClick, label, danger, children }) {
  const base =
    'inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors'
  const tone = danger
    ? 'bg-crimson text-white hover:bg-crimson/90'
    : active
      ? 'bg-ink-soft text-sandstone hover:bg-ink-muted'
      : 'bg-dune-deep/40 text-ink hover:bg-dune-deep/60'
  return (
    <button type="button" onClick={onClick} className={`${base} ${tone}`} aria-pressed={active}>
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function MicIcon({ on }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="6" y="1.5" width="4" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {!on && <path d="M2 14 14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  )
}

function CamIcon({ on }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="1" y="4" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 7.2 15 5v6l-4-2.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      {!on && <path d="M2 14 14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  )
}

const STATE_LABEL = {
  [ConnectionState.Connecting]: 'Connecting',
  [ConnectionState.Connected]: 'Live',
  [ConnectionState.Reconnecting]: 'Reconnecting',
  [ConnectionState.Disconnected]: 'Disconnected',
}

export function VideoVisitStage({ role, notice, onDismissNotice }) {
  const room = useRoomContext()
  const connectionState = useConnectionState()
  const participants = useParticipants()
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant()

  // Camera tracks only — screen share is out of scope for this pass.
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  })

  const remoteCount = participants.length - 1
  const live = connectionState === ConnectionState.Connected

  return (
    <div className="flex h-full flex-col">
      {/* Renders remote audio. Without this the call is silent — the video tiles
          do not play audio themselves. */}
      <RoomAudioRenderer />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              live ? 'animate-breathe bg-crimson' : 'bg-umber-light'
            }`}
          />
          <p className="font-mono text-[11px] uppercase tracking-label text-sandstone">
            {STATE_LABEL[connectionState] ?? connectionState}
          </p>
          <span className="text-dune-deep/50" aria-hidden="true">
            ·
          </span>
          <p className="font-mono text-[11px] uppercase tracking-label text-dune-deep">
            {room?.name}
          </p>
        </div>
        <Badge tone={remoteCount > 0 ? 'verified' : 'neutral'}>
          {remoteCount > 0
            ? `${remoteCount} other participant${remoteCount === 1 ? '' : 's'}`
            : 'Waiting for the other participant'}
        </Badge>
      </div>

      {notice && (
        <div className="flex items-start justify-between gap-3 border-b border-ink-muted/40 bg-ink-soft px-4 py-2.5">
          <p className="text-[13px] leading-relaxed text-dune">{notice}</p>
          <button
            type="button"
            onClick={onDismissNotice}
            className="shrink-0 font-mono text-[10px] uppercase tracking-label text-dune-deep hover:text-sandstone"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="lk-stage min-h-0 flex-1 p-3">
        <GridLayout tracks={tracks} className="h-full">
          <ParticipantTile />
        </GridLayout>
      </div>

      {remoteCount === 0 && live && (
        <p className="px-4 pb-1 text-center text-[13px] leading-relaxed text-dune-deep">
          {role === 'physician'
            ? 'Open the patient link in a second tab to connect the other side.'
            : 'Waiting for the physician to join this room.'}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5 border-t border-ink-muted/40 px-4 py-3">
        <ControlButton
          active={isMicrophoneEnabled}
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          label={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
        >
          <MicIcon on={isMicrophoneEnabled} />
        </ControlButton>

        <ControlButton
          active={isCameraEnabled}
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          label={isCameraEnabled ? 'Camera off' : 'Camera on'}
        >
          <CamIcon on={isCameraEnabled} />
        </ControlButton>

        {/* Actually tear down the transport. Flipping local state alone would
            leave the peer connection open and the camera light on, and the other
            participant would still see us as present. LiveKitRoom's
            onDisconnected fires from this and drives the UI back to `ended`. */}
        <Button
          variant="primary"
          onClick={() => room?.disconnect()}
          className="h-11 bg-crimson hover:bg-crimson/90"
        >
          Leave call
        </Button>
      </div>
    </div>
  )
}
