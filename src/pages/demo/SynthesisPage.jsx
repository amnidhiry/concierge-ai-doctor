import { useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDemo } from '../../context/DemoProvider.jsx'
import { SynthesisProcessing } from '../../components/demo/SynthesisProcessing.jsx'
import { DraftDocument } from '../../components/demo/DraftDocument.jsx'
import { ErrorPanel } from '../../components/demo/ErrorPanel.jsx'
import { Button, Container, Eyebrow } from '../../components/ui/primitives.jsx'

/** Step 2 — real AI synthesis. */
export function SynthesisPage() {
  const navigate = useNavigate()
  const { liveCase, hasIntake, retrySynthesis, resetDemo } = useDemo()
  const startedAt = useRef(Date.now())

  // Reset the elapsed clock whenever a new call begins (including a retry).
  useEffect(() => {
    if (liveCase.status === 'synthesizing') startedAt.current = Date.now()
  }, [liveCase.status])

  // Deep-linked here without an intake — send them to Step 1 rather than
  // showing an empty processing state that will never resolve.
  if (!hasIntake) return <Navigate to="/demo" replace />

  function startOver() {
    resetDemo()
    navigate('/demo')
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="max-w-2xl">
        <Eyebrow tone="pulse">Step 2 · Synthesis</Eyebrow>
        <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
          {liveCase.status === 'synthesizing'
            ? 'Reading the case'
            : liveCase.status === 'failed'
              ? 'Synthesis did not complete'
              : 'Draft assembled'}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-umber">
          {liveCase.status === 'awaiting_review'
            ? 'This is the model\'s actual output for the case you submitted. Next it goes to the physician queue, where it can be corrected before anything reaches the patient.'
            : 'The synthesis call runs against the Anthropic API with your intake and chart text.'}
        </p>
      </div>

      <div className="mt-8 max-w-4xl">
        {liveCase.status === 'synthesizing' && (
          <SynthesisProcessing startedAt={startedAt.current} />
        )}

        {liveCase.status === 'failed' && (
          <ErrorPanel error={liveCase.error} onRetry={retrySynthesis} onStartOver={startOver} />
        )}

        {liveCase.draft && liveCase.status !== 'synthesizing' && (
          <>
            <DraftDocument draft={liveCase.draft} meta={liveCase.synthesisMeta} />

            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-dune bg-sandstone-raised p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[15px] font-medium text-ink">Nothing has been sent yet</p>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-umber">
                  The patient cannot see any of this. It sits in the physician's queue until a
                  clinician reviews, edits, and sends it.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button variant="outline" onClick={startOver}>
                  New case
                </Button>
                <Button as="link" to="/demo/physician" variant="primary">
                  Open physician view
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  )
}
