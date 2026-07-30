import { useEffect, useRef, useState } from 'react'
import {
  RoomAudioRenderer,
  useConnectionState,
  useIsSpeaking,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { Button } from '../ui/primitives.jsx'
import { formatElapsed } from '../../lib/voiceVisit.js'
import { VISIT_MINUTES } from '../../domain/models.js'

/**
 * The in-call UI. Rendered inside <LiveKitRoom>, so all hooks here have room
 * context.
 *
 * ── Why none of LiveKit's prebuilt layout components appear ────────────────
 * `GridLayout` and `ParticipantTile` exist to render video. This is a voice call,
 * so a grid of black rectangles with names on them would be a video UI with the
 * video missing — which reads as broken rather than as deliberate. Instead the
 * call is presented as what it is: two participants, each with a live speaking
 * indicator and a mute state, a timer against the booked duration, and one way
 * out. `RoomAudioRenderer` is the one LiveKit component still needed, because
 * without it the call is silent.
 *
 * That also means `@livekit/components-styles` is not imported anywhere: its
 * whole job is theming the video primitives this file no longer uses.
 */

function MicIcon({ on }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="6" y="1.5" width="4" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {!on && <path d="M2 14 14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  )
}

const STATE_LABEL = {
  [ConnectionState.Connecting]: 'Connecting',
  [ConnectionState.Connected]: 'Connected',
  [ConnectionState.Reconnecting]: 'Reconnecting',
  [ConnectionState.Disconnected]: 'Disconnected',
}

/**
 * Elapsed call timer.
 *
 * Starts when the room reports connected, not when the component mounts —
 * otherwise the timer counts the signalling handshake and a slow connection
 * appears to have eaten 8 seconds of the appointment.
 *
 * The visit is booked for a bounded 20–30 minutes, so the timer states the
 * booked length alongside the elapsed figure. A bare stopwatch would leave the
 * physician doing the arithmetic on the thing the product is bounded by.
 */
function CallTimer({ live, durationMinutes }) {
  const [seconds, setSeconds] = useState(0)
  const startedAt = useRef(null)

  useEffect(() => {
    if (!live) return undefined
    if (startedAt.current === null) startedAt.current = Date.now()

    const tick = () => setSeconds((Date.now() - startedAt.current) / 1000)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [live])

  const booked = durationMinutes || VISIT_MINUTES.max
  const overrun = seconds > booked * 60

  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-label ${
        overrun ? 'text-crimson' : 'text-dune'
      }`}
      aria-live="off"
    >
      <span className="sr-only">Elapsed call time: </span>
      {formatElapsed(seconds)}
      <span className="text-dune-deep"> / {booked} min booked</span>
    </p>
  )
}

/**
 * One participant row.
 *
 * `useIsSpeaking` is a per-participant subscription, which is why this is its own
 * component rather than a mapped fragment — a hook cannot be called inside a
 * loop, and hoisting the subscription to the parent would mean re-rendering both
 * rows every time either person made a sound.
 */
function ParticipantRow({ participant, isLocal }) {
  const speaking = useIsSpeaking(participant)
  const muted = !participant.isMicrophoneEnabled

  const roleLabel = participant.identity?.startsWith('physician') ? 'Physician' : 'Patient'

  return (
    <li className="flex items-center gap-3.5 border-b border-ink-muted/30 px-4 py-3.5 last:border-b-0">
      {/* Speaking indicator. Ringed rather than filled when speaking, so it is
          distinguishable from the connection dot in the header at a glance. */}
      <span
        aria-hidden="true"
        className={`flex h-2.5 w-2.5 shrink-0 rounded-full ${
          muted ? 'bg-ink-muted' : speaking ? 'bg-verified ring-2 ring-verified/40' : 'bg-dune-deep'
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-sandstone">
          {participant.name || participant.identity}
          {isLocal && <span className="ml-2 font-normal text-dune-deep">(you)</span>}
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-label text-dune-deep">
          {roleLabel}
        </p>
      </div>
      <p
        className={`shrink-0 font-mono text-[10px] uppercase tracking-label ${
          muted ? 'text-crimson' : speaking ? 'text-verified' : 'text-dune-deep'
        }`}
      >
        {muted ? 'Muted' : speaking ? 'Speaking' : 'Listening'}
      </p>
    </li>
  )
}

export function VoiceVisitStage({ role, notice, onDismissNotice, durationMinutes, onEndVisit }) {
  const room = useRoomContext()
  const connectionState = useConnectionState()
  const participants = useParticipants()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()

  const live = connectionState === ConnectionState.Connected
  const remoteCount = participants.length - 1

  /**
   * Leaves the room and, for the physician, declares the visit finished.
   *
   * `room.disconnect()` actually tears down the transport. Flipping local state
   * alone would leave the peer connection open and the microphone live, and the
   * other participant would still see us as present. LiveKitRoom's
   * `onDisconnected` fires from this and drives the UI back to `ended`.
   *
   * Ending the visit and leaving the room are separate concerns: a patient
   * hanging up does not conclude the visit, and a physician whose connection
   * drops has not finished it either. Only the physician's explicit "end visit"
   * advances the case.
   */
  function leave({ concludeVisit = false } = {}) {
    if (concludeVisit) onEndVisit?.()
    room?.disconnect()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Renders remote audio. Without this the call is silent. */}
      <RoomAudioRenderer />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-ink-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              live ? 'animate-breathe bg-verified' : 'bg-umber-light'
            }`}
          />
          <p className="font-mono text-[11px] uppercase tracking-label text-sandstone">
            {STATE_LABEL[connectionState] ?? connectionState}
          </p>
          <span className="text-dune-deep/50" aria-hidden="true">
            ·
          </span>
          <p className="font-mono text-[11px] uppercase tracking-label text-dune-deep">
            Audio only
          </p>
        </div>
        <CallTimer live={live} durationMinutes={durationMinutes} />
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

      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="border-b border-ink-muted/30 px-4 py-2 font-mono text-[10px] uppercase tracking-label text-dune-deep">
          On the call
        </p>
        <ul>
          {participants.map((p) => (
            <ParticipantRow
              key={p.sid || p.identity}
              participant={p}
              isLocal={p === localParticipant}
            />
          ))}
        </ul>

        {remoteCount === 0 && live && (
          <p className="px-4 py-5 text-[13px] leading-relaxed text-dune-deep">
            {role === 'physician'
              ? 'Waiting for the patient. Copy the patient link and open it in a second tab to connect the other side.'
              : 'Waiting for the physician to join.'}
          </p>
        )}

        <div className="border-t border-ink-muted/30 px-4 py-4">
          <p className="max-w-prose text-[13px] leading-relaxed text-dune-deep">
            Nothing on this call is recorded or transcribed. This build has no recording,
            no speech-to-text, and no screen sharing — the documentation stage requires a
            transcript to be entered by hand for exactly that reason.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-ink-muted/40 px-4 py-3">
        <button
          type="button"
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          aria-pressed={!isMicrophoneEnabled}
          className={`inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors ${
            isMicrophoneEnabled
              ? 'bg-dune-deep/30 text-sandstone hover:bg-dune-deep/45'
              : 'bg-crimson text-white hover:bg-crimson/90'
          }`}
        >
          <MicIcon on={isMicrophoneEnabled} />
          {isMicrophoneEnabled ? 'Mute' : 'Unmute'}
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {role === 'physician' ? (
            <>
              <Button
                variant="ghost"
                onClick={() => leave()}
                className="h-11 text-dune hover:bg-ink-soft hover:text-sandstone"
              >
                Leave without ending
              </Button>
              <Button
                variant="primary"
                onClick={() => leave({ concludeVisit: true })}
                className="h-11"
              >
                End visit and write it up
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => leave()}
              className="h-11 bg-crimson hover:bg-crimson/90"
            >
              Leave call
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
