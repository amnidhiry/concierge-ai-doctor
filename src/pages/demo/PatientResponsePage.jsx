import { Navigate, useNavigate } from 'react-router-dom'
import { useDemo } from '../../context/DemoProvider.jsx'
import { AiDraftBadge } from '../../components/ui/AiDraftBadge.jsx'
import { JoinVideoVisitButton } from '../../components/physician/JoinVideoVisitButton.jsx'
import { Button, Card, Container, Eyebrow } from '../../components/ui/primitives.jsx'

/**
 * Step 4 — the patient sees the physician's finalized reply.
 *
 * Renders `sentResponse`, not the model's draft. If the physician edited the
 * text in Step 3, this is where that edit becomes visible, which is the whole
 * point of closing the loop.
 */
export function PatientResponsePage() {
  const navigate = useNavigate()
  const { liveCase, physician, resetDemo } = useDemo()

  if (liveCase.status !== 'physician_sent') {
    return <Navigate to={liveCase.draft ? '/demo/physician' : '/demo'} replace />
  }

  const aiDraft = liveCase.draft?.draft_response_to_patient ?? ''
  const wasEdited = liveCase.sentResponse?.trim() !== aiDraft.trim()

  function startOver() {
    resetDemo()
    navigate('/demo')
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="max-w-2xl">
        <Eyebrow tone="pulse">Step 4 · Patient</Eyebrow>
        <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
          Your physician has responded
        </h1>
      </div>

      <div className="mt-8 max-w-3xl space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b border-dune bg-verified-wash/60 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-medium text-ink">{physician.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-umber">
                  {physician.credential}
                  {liveCase.sentAt && ` · ${new Date(liveCase.sentAt).toLocaleString()}`}
                </p>
              </div>
              <AiDraftBadge state="reviewed" />
            </div>
          </div>

          <div className="px-5 py-6 sm:px-6">
            <p className="whitespace-pre-wrap text-[17px] leading-relaxed text-ink">
              {liveCase.sentResponse}
            </p>
          </div>

          <div className="border-t border-dune bg-dune/20 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-md text-[13px] leading-relaxed text-umber">
                Have a follow-up question? It's included in your plan. For anything urgent, seek
                in-person care.
              </p>
              <JoinVideoVisitButton
                patientName={physician.name}
                variant="secondary"
                className="shrink-0"
              />
            </div>
          </div>
        </Card>

        {/* Makes the physician's contribution legible — the loop only means
            something if you can see what changed between draft and send. */}
        <Card className="p-5 sm:p-6">
          <p className="field-label">What happened behind this message</p>
          <ol className="mt-4 space-y-3">
            {[
              'You submitted your description and records.',
              'AI read the material and drafted a structured assessment, flagging what it could not determine.',
              wasEdited
                ? `${physician.name} reviewed the draft, edited it, and sent this version.`
                : `${physician.name} reviewed the draft, approved it as written, and sent it under their name.`,
            ].map((step, i) => (
              <li key={i} className="flex gap-3.5 text-[15px] leading-relaxed text-ink-muted">
                <span className="font-mono text-[13px] text-pulse">{String(i + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {wasEdited && (
            <details className="mt-5 border-t border-dune pt-4">
              <summary className="cursor-pointer text-[13px] font-medium text-pulse">
                Compare with the original AI draft
              </summary>
              <div className="mt-3 rounded-md border border-draft/25 bg-draft-wash/50 p-4">
                <AiDraftBadge />
                <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-muted">
                  {aiDraft}
                </p>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-umber">
                Shown here for demo transparency. A patient would not normally see the unreviewed
                draft.
              </p>
            </details>
          )}
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={startOver}>
            Run another case
          </Button>
          <Button as="link" to="/demo/physician" variant="outline">
            Back to physician view
          </Button>
        </div>
      </div>
    </Container>
  )
}
