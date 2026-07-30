import { useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDemo } from '../../context/DemoProvider.jsx'
import {
  ModelCallProgress,
  PACKET_PROGRESS,
} from '../../components/demo/ModelCallProgress.jsx'
import { CarePacketDocument } from '../../components/demo/CarePacketDocument.jsx'
import { ErrorPanel } from '../../components/demo/ErrorPanel.jsx'
import { Button, Container, Eyebrow } from '../../components/ui/primitives.jsx'

/** Stage 2 — the real model call that assembles the care packet. */
export function CarePacketPage() {
  const navigate = useNavigate()
  const { liveCase, hasIntake, retryPacket, resetDemo } = useDemo()
  const startedAt = useRef(Date.now())

  // Reset the elapsed clock whenever a new call begins (including a retry).
  useEffect(() => {
    if (liveCase.status === 'assembling_packet') startedAt.current = Date.now()
  }, [liveCase.status])

  // Deep-linked here without an intake — send them to stage 1 rather than showing
  // an empty processing state that will never resolve.
  if (!hasIntake) return <Navigate to="/demo" replace />

  const assembling = liveCase.status === 'assembling_packet'
  const failed = liveCase.status === 'packet_failed'

  function startOver() {
    resetDemo()
    navigate('/demo')
  }

  const scheduledFor = liveCase.visit?.scheduledFor
    ? new Date(liveCase.visit.scheduledFor).toLocaleString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <Container className="py-8 sm:py-10">
      <div className="max-w-2xl">
        <Eyebrow tone="pulse">Stage 2 · Before the call</Eyebrow>
        <h1 className="mt-3 text-display-sm text-ink sm:text-display">
          {assembling
            ? 'Assembling the care packet'
            : failed
              ? 'The care packet did not assemble'
              : 'Care packet ready'}
        </h1>
        <p className="mt-4 text-body-lg leading-relaxed text-umber">
          {liveCase.packet
            ? 'This is the model\'s actual output on what you submitted. It goes to the physician, who reads it in the few minutes before the call — the patient never sees it.'
            : 'The call runs against the Anthropic API with your intake and chart text.'}
        </p>
        {scheduledFor && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-umber-light">
            Call booked · {scheduledFor} · {liveCase.visit.durationMinutes} min · audio only
          </p>
        )}
      </div>

      <div className="mt-8 max-w-4xl">
        {assembling && <ModelCallProgress startedAt={startedAt.current} {...PACKET_PROGRESS} />}

        {failed && (
          <ErrorPanel
            error={liveCase.packetError}
            onRetry={retryPacket}
            onStartOver={startOver}
            stage="Care packet"
          />
        )}

        {liveCase.packet && !assembling && (
          <>
            <CarePacketDocument packet={liveCase.packet} meta={liveCase.packetMeta} />

            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-dune bg-sandstone-raised p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[15px] font-medium text-ink">
                  Nothing has reached the patient
                </p>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-umber">
                  The packet is preparation, not an answer. The physician forms their opinion on the
                  call — no assessment is written or sent before it happens.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button variant="outline" onClick={startOver}>
                  New booking
                </Button>
                <Button as="link" to="/demo/visit" variant="primary">
                  Go to the call
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  )
}
