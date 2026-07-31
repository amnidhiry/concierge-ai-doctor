import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDemo } from '../../context/DemoProvider.jsx'
import { ScheduleList } from '../../components/physician/ScheduleList.jsx'
import { SampleVisitDetail } from '../../components/physician/SampleVisitDetail.jsx'
import { StartVoiceVisitButton } from '../../components/physician/StartVoiceVisitButton.jsx'
import { PatientJoinVisitButton } from '../../components/voice/PatientJoinVisitButton.jsx'
import { CarePacketDocument } from '../../components/demo/CarePacketDocument.jsx'
import { findScheduledVisit } from '../../domain/mockSchedule.js'
import { Button, Card, Container, Eyebrow } from '../../components/ui/primitives.jsx'
import { VISIT_MINUTES } from '../../domain/models.js'

/**
 * Stage 3 — the scheduled voice visit, from the physician's seat.
 *
 * The physician's view is the right one for this stage: they are the party
 * holding the care packet, and the packet is the reason the call is short enough
 * to be worth booking. The patient side is one click away in a second tab, which
 * is also the only way to see the two-party connection work.
 *
 * The call itself lives in a dialog rather than on this page. A live audio call
 * is modal by nature — you are on it or you are not — and embedding it inline
 * would leave the physician scrolling past a connected call to read the packet
 * underneath it.
 */
export function VoiceVisitPage() {
  const navigate = useNavigate()
  const {
    liveCase,
    physician,
    hasIntake,
    endVisit,
    setTranscript,
    samplePackets,
    runSamplePacket,
    clearSamplePacket,
  } = useDemo()

  const [selectedId, setSelectedId] = useState(liveCase.id)

  // A selected sample resolves to null for the live case, which is what switches
  // the detail pane.
  const selectedSample = selectedId === liveCase.id ? null : findScheduledVisit(selectedId)

  if (!hasIntake) return <Navigate to="/demo" replace />

  const visitDone = Boolean(liveCase.visit?.endedAt)

  /**
   * Stores whatever has been recognised so far.
   *
   * Called on every change rather than only when the call ends, so a dropped
   * connection or a mid-call navigation cannot lose the transcript. Marked
   * `captured` so the documentation stage can tell live-recognised speech from a
   * pasted example — the two warrant different amounts of trust.
   */
  function handleTranscriptChange(text) {
    if (text?.trim()) setTranscript(text, 'captured')
  }


  function handleEndVisit() {
    endVisit()
    navigate('/demo/documentation')
  }

  const scheduledFor = liveCase.visit?.scheduledFor
    ? new Date(liveCase.visit.scheduledFor).toLocaleString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not scheduled'

  return (
    <Container width="wide" className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Eyebrow tone="pulse">Stage 3 · Physician</Eyebrow>
          <h1 className="mt-3 text-display-sm text-ink sm:text-display">The call</h1>
          <p className="mt-3 text-body-lg leading-relaxed text-umber">
            The physician's seat. Read the packet, take the {VISIT_MINUTES.min}–{VISIT_MINUTES.max}{' '}
            minute call, then write it up. This is real WebRTC audio between two browser contexts —
            no camera and no recording, with best-effort live transcription.
          </p>
        </div>
        <div className="rounded-md border border-dune bg-sandstone-raised px-4 py-3">
          <p className="field-label">Signed in as</p>
          <p className="mt-1.5 text-[15px] font-medium text-ink">{physician.name}</p>
          <p className="font-mono text-[11px] text-umber">
            {physician.credential} · {physician.npiLabel}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
        <div>
          <ScheduleList
            liveCase={liveCase}
            samplePackets={samplePackets}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <div className="space-y-6">
          {selectedSample ? (
            <SampleVisitDetail
              visit={selectedSample}
              packet={samplePackets[selectedSample.id]}
              onRunPacket={() => runSamplePacket(selectedSample.id)}
              onClear={() => clearSamplePacket(selectedSample.id)}
              physician={physician}
            />
          ) : (
            <>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="field-label">Case {liveCase.id}</p>
                    <p className="mt-1.5 text-title text-ink">{liveCase.patient.name}</p>
                    <p className="mt-1 text-sm text-umber">
                      {scheduledFor} · {liveCase.visit?.durationMinutes} min · voice only
                    </p>
                    {visitDone && (
                      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-label text-verified">
                        Call finished {new Date(liveCase.visit.endedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                    <PatientJoinVisitButton caseId={liveCase.id} variant="outline" />
                    <StartVoiceVisitButton
                      caseId={liveCase.id}
                      patientName={liveCase.patient.name}
                      displayName={`${physician.name}, ${physician.credential}`}
                      durationMinutes={liveCase.visit?.durationMinutes}
                      onEndVisit={handleEndVisit}
                      onTranscriptChange={handleTranscriptChange}
                      label={visitDone ? 'Rejoin the call' : 'Start the call'}
                    />
                  </div>
                </div>

                <p className="mt-4 max-w-prose border-t border-dune pt-4 text-[13px] leading-relaxed text-umber">
                  For the demo: start the call here, then open the patient link in a second tab to
                  connect the other side. Use headphones — two tabs on one machine will echo, because
                  each plays the other's audio into your microphone.
                </p>
              </Card>

              {/* The packet, so the physician can read it while the call runs in
                  the dialog above. */}
              {liveCase.packet && (
                <CarePacketDocument packet={liveCase.packet} meta={liveCase.packetMeta} />
              )}

              <Card className="p-5">
                <p className="text-[15px] font-medium text-ink">
                  {visitDone ? 'Next: the write-up' : 'When the call is finished'}
                </p>
                <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-umber">
                  Ending the call opens the documentation stage. Live transcription is
                  best-effort — read it and correct it, or paste over it entirely. No note is
                  drafted without a transcript.
                </p>
                {/* When the call hasn't happened, this still routes through
                    `endVisit` rather than linking straight to the next page.
                    Arriving at the documentation stage with the case still in
                    `packet_ready` would leave the step rail claiming the visit is
                    the current stage while the write-up is on screen. */}
                <Button
                  variant={visitDone ? 'primary' : 'outline'}
                  onClick={visitDone ? () => navigate('/demo/documentation') : handleEndVisit}
                  className="mt-5"
                >
                  {visitDone ? 'Write up the visit' : 'Mark the call finished and write it up'}
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>
    </Container>
  )
}
