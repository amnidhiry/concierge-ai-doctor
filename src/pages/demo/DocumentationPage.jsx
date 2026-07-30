import { useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDemo } from '../../context/DemoProvider.jsx'
import { TranscriptInput } from '../../components/demo/TranscriptInput.jsx'
import { DocumentationDraft } from '../../components/demo/DocumentationDraft.jsx'
import { ApprovalPanel } from '../../components/physician/ApprovalPanel.jsx'
import {
  DOCUMENTATION_PROGRESS,
  ModelCallProgress,
} from '../../components/demo/ModelCallProgress.jsx'
import { ErrorPanel } from '../../components/demo/ErrorPanel.jsx'
import { Button, Card, Container, Eyebrow } from '../../components/ui/primitives.jsx'

/**
 * Stage 4 — documentation and approval.
 *
 * The transcript panel sits above the draft rather than beside it, because the
 * order is the argument: a transcript has to exist before anything is drafted, and
 * a side-by-side layout would let a reader assume the two appeared together.
 *
 * Approval is the terminal state of the case. Nothing is transmitted — there is no
 * patient inbox, no fax, no claim. What approval does is put a named clinician's
 * name on text they read and edited, which is the only claim the product makes.
 */
export function DocumentationPage() {
  const navigate = useNavigate()
  const {
    liveCase,
    physician,
    hasIntake,
    setTranscript,
    draftDocumentation,
    retryDocumentation,
    updateReviewedNote,
    updateReviewedPatientSummary,
    updateAcceptedBillingCode,
    approveDocumentation,
    resetDemo,
  } = useDemo()

  const startedAt = useRef(Date.now())

  useEffect(() => {
    if (liveCase.status === 'drafting_documentation') startedAt.current = Date.now()
  }, [liveCase.status])

  if (!hasIntake) return <Navigate to="/demo" replace />

  const drafting = liveCase.status === 'drafting_documentation'
  const failed = liveCase.status === 'documentation_failed'
  const approved = liveCase.status === 'approved'
  const hasTranscript = Boolean(liveCase.transcript.trim())

  function startOver() {
    resetDemo()
    navigate('/demo')
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="max-w-2xl">
        <Eyebrow tone="pulse">Stage 4 · Physician</Eyebrow>
        <h1 className="mt-3 text-display-sm text-ink sm:text-display">
          {approved ? 'Case closed' : 'Write up the visit'}
        </h1>
        <p className="mt-4 text-body-lg leading-relaxed text-umber">
          {approved
            ? 'The note, the patient summary, and the billing code are approved under a named physician. This visit is complete — there is no follow-up appointment and no message thread, which is what "bounded" means here.'
            : 'A clinical note, a plain-language summary for the patient, and a billing-code suggestion — drafted from the transcript, then corrected and approved by the physician.'}
        </p>
      </div>

      <div className="mt-8 max-w-4xl space-y-6">
        {!approved && (
          <TranscriptInput
            value={liveCase.transcript}
            source={liveCase.transcriptSource}
            onChange={setTranscript}
            disabled={drafting}
          />
        )}

        {!approved && !liveCase.documentation && !drafting && (
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[15px] font-medium text-ink">
                  {hasTranscript
                    ? 'Ready to draft the documentation'
                    : 'A transcript is required first'}
                </p>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-umber">
                  {hasTranscript
                    ? 'This makes a real Anthropic API call on the transcript above, read against the care packet. Expect 10–20 seconds.'
                    : 'Nothing here transcribes the call. Paste or write the synthetic transcript above, or insert the example, and the draft button becomes available.'}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={draftDocumentation}
                disabled={!hasTranscript}
                className="shrink-0"
              >
                Draft the documentation
              </Button>
            </div>
          </Card>
        )}

        {drafting && <ModelCallProgress startedAt={startedAt.current} {...DOCUMENTATION_PROGRESS} />}

        {failed && (
          <ErrorPanel
            error={liveCase.documentationError}
            onRetry={hasTranscript ? retryDocumentation : undefined}
            onStartOver={startOver}
            stage="Documentation"
          />
        )}

        {liveCase.documentation && !drafting && (
          <>
            {!approved && (
              <DocumentationDraft
                documentation={liveCase.documentation}
                meta={liveCase.documentationMeta}
              />
            )}

            <ApprovalPanel
              documentation={liveCase.documentation}
              note={liveCase.reviewedNote}
              patientSummary={liveCase.reviewedPatientSummary}
              billingCode={liveCase.acceptedBillingCode}
              onNoteChange={updateReviewedNote}
              onPatientSummaryChange={updateReviewedPatientSummary}
              onBillingCodeChange={updateAcceptedBillingCode}
              onApprove={approveDocumentation}
              approved={approved}
              approvedAt={liveCase.approvedAt}
              approvedBy={liveCase.approvedBy}
            />

            {approved && (
              <>
                <Card className="p-5">
                  <p className="field-label">What happened behind this record</p>
                  <ol className="mt-4 space-y-3">
                    {[
                      'The patient booked one bounded call and completed an AI-assisted intake.',
                      'A care packet was assembled from their material, with a source on every claim and no risk score calculated.',
                      'The physician took a 20–30 minute voice call. Nothing was recorded or transcribed.',
                      'A transcript was entered by hand, and the model drafted a note, a patient summary, and a billing suggestion from it.',
                      `${physician.name} corrected the draft and approved it under their name. The case is now closed.`,
                    ].map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-3.5 text-[15px] leading-relaxed text-ink-muted"
                      >
                        <span className="font-mono text-[13px] text-pulse">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  <p className="mt-5 max-w-prose border-t border-dune pt-4 text-[13px] leading-relaxed text-umber">
                    Nothing was delivered anywhere. Approval updates local state — there is no patient
                    inbox, no email, no fax to the patient's clinician, and no billing submission in
                    this build. A refresh clears all of it.
                  </p>
                </Card>

                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={startOver}>
                    Run another visit
                  </Button>
                  <Button as="link" to="/demo/visit" variant="outline">
                    Back to the call
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Container>
  )
}
