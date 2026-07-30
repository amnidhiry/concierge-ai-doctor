import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../../context/DemoProvider.jsx'
import { PanelList } from '../../components/physician/PanelList.jsx'
import { DraftEditor } from '../../components/physician/DraftEditor.jsx'
import { JoinVideoVisitButton } from '../../components/physician/JoinVideoVisitButton.jsx'
import { DraftDocument } from '../../components/demo/DraftDocument.jsx'
import { SynthesisProcessing } from '../../components/demo/SynthesisProcessing.jsx'
import { ErrorPanel } from '../../components/demo/ErrorPanel.jsx'
import { Button, Card, Container, Eyebrow } from '../../components/ui/primitives.jsx'

/** Step 3 — physician review dashboard. */
export function PhysicianPage() {
  const navigate = useNavigate()
  const {
    liveCase,
    physician,
    hasIntake,
    updatePhysicianResponse,
    sendPhysicianResponse,
    retrySynthesis,
    resetDemo,
  } = useDemo()

  const [selectedId, setSelectedId] = useState(liveCase.id)
  const sent = liveCase.status === 'physician_sent'

  function handleSend() {
    sendPhysicianResponse()
    navigate('/demo/response')
  }

  function startOver() {
    resetDemo()
    navigate('/demo')
  }

  return (
    <Container width="wide" className="py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Eyebrow tone="pulse">Step 3 · Physician</Eyebrow>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
            Review queue
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-umber">
            The physician's side. Correct the draft, rewrite the reply in your own voice, and send —
            nothing leaves this screen unreviewed.
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
          <PanelList liveCase={liveCase} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div className="space-y-6">
          {/* Case header */}
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="field-label">Case {liveCase.id}</p>
                <p className="mt-1.5 font-display text-xl text-ink">{liveCase.patient.name}</p>
                <p className="mt-1 text-sm text-umber">
                  {liveCase.patient.plan}
                  {liveCase.intake.submittedAt &&
                    ` · submitted ${new Date(liveCase.intake.submittedAt).toLocaleTimeString()}`}
                </p>
              </div>
              <JoinVideoVisitButton patientName={liveCase.patient.name} />
            </div>
          </Card>

          {!hasIntake && (
            <Card className="p-8 text-center">
              <p className="font-display text-xl text-ink">No case submitted yet</p>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-umber">
                Submit a case in Step 1 and the physician queue will populate with real model output.
              </p>
              <Button as="link" to="/demo" variant="primary" className="mt-6">
                Go to intake
              </Button>
            </Card>
          )}

          {hasIntake && liveCase.status === 'synthesizing' && (
            <SynthesisProcessing startedAt={Date.now()} />
          )}

          {hasIntake && liveCase.status === 'failed' && (
            <ErrorPanel error={liveCase.error} onRetry={retrySynthesis} onStartOver={startOver} />
          )}

          {liveCase.draft && liveCase.status !== 'synthesizing' && (
            <>
              {/* What the patient actually submitted, so the physician can check
                  the draft against the source rather than trusting it. */}
              <Card className="overflow-hidden">
                <div className="border-b border-dune bg-dune/25 px-5 py-3.5">
                  <p className="field-label">Patient's submission</p>
                </div>
                <div className="space-y-4 px-5 py-4">
                  {liveCase.intake.patientMessage && (
                    <div>
                      <p className="text-[13px] font-medium text-ink">In their words</p>
                      <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-muted">
                        {liveCase.intake.patientMessage}
                      </p>
                    </div>
                  )}
                  {liveCase.intake.chartText && (
                    <details className="group">
                      <summary className="cursor-pointer text-[13px] font-medium text-pulse">
                        Chart material
                        {liveCase.intake.chartFileName && ` · ${liveCase.intake.chartFileName}`} (
                        {liveCase.intake.chartText.length.toLocaleString()} chars)
                      </summary>
                      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-dune/30 p-4 font-mono text-[12px] leading-relaxed text-ink-muted">
                        {liveCase.intake.chartText}
                      </pre>
                    </details>
                  )}
                </div>
              </Card>

              <DraftDocument
                draft={liveCase.draft}
                meta={liveCase.synthesisMeta}
                reviewed={sent}
              />

              <DraftEditor
                aiDraft={liveCase.draft.draft_response_to_patient}
                value={liveCase.physicianResponse}
                onChange={updatePhysicianResponse}
                onSend={handleSend}
                sent={sent}
                sentAt={liveCase.sentAt}
                reviewedBy={liveCase.reviewedBy}
              />

              {sent && (
                <div className="flex flex-wrap gap-3">
                  <Button as="link" to="/demo/response" variant="primary">
                    See the patient's view
                  </Button>
                  <Button variant="outline" onClick={startOver}>
                    Start a new case
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  )
}
