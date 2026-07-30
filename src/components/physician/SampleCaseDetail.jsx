import { Badge, Button, Card } from '../ui/primitives.jsx'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'
import { DraftDocument } from '../demo/DraftDocument.jsx'
import { SynthesisProcessing } from '../demo/SynthesisProcessing.jsx'
import { ErrorPanel } from '../demo/ErrorPanel.jsx'
import { JoinVideoVisitButton } from './JoinVideoVisitButton.jsx'

/**
 * Read-only detail view for a sample panel case.
 *
 * Sample cases carry synthetic intake material but no pre-computed draft — so
 * where the AI draft would be, this shows an explicit "no synthesis has been run"
 * state plus a button to run one for real. Nothing here fabricates model output:
 * either a live call produced the draft on screen, or the space says plainly that
 * it is empty.
 *
 * Deliberately has no edit-and-send flow. That loop belongs to the live case,
 * which is the one that demonstrates a physician taking responsibility for a
 * response end to end. Adding it here would imply these six were real patients
 * awaiting a reply.
 */
export function SampleCaseDetail({ sample, synthesis, onRunSynthesis, onClear, physician }) {
  const status = synthesis?.status ?? 'idle'

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="field-label">Case {sample.id}</p>
              <Badge tone="neutral">Sample case</Badge>
            </div>
            <p className="mt-1.5 font-display text-xl text-ink">
              {sample.name} · {sample.age}
              {sample.sex}
            </p>
            <p className="mt-1 text-sm text-umber">
              {sample.condition} · {sample.plan} · {sample.waitingLabel}
            </p>
          </div>
          <JoinVideoVisitButton
            caseId={sample.id}
            patientName={sample.name}
            displayName={`${physician.name}, ${physician.credential}`}
          />
        </div>
      </Card>

      <Card className="border-dune-deep bg-dune/25 p-5">
        <p className="text-[15px] font-medium text-ink">This is static sample data</p>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-umber">
          {sample.name} is not a real patient and this record is invented. The intake below is
          fixed, but you can run a real synthesis call on it — the draft that comes back is genuine
          model output on this material, generated when you click.
        </p>
      </Card>

      {/* The source material, so the draft can be checked against it. */}
      <Card className="overflow-hidden">
        <div className="border-b border-dune bg-dune/25 px-5 py-3.5">
          <p className="field-label">Patient's submission</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div>
            <p className="text-[13px] font-medium text-ink">In their words</p>
            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-muted">
              {sample.intake.patientMessage}
            </p>
          </div>
          <details>
            <summary className="cursor-pointer text-[13px] font-medium text-pulse">
              Chart material ({sample.intake.chartText.length.toLocaleString()} chars)
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-dune/30 p-4 font-mono text-[12px] leading-relaxed text-ink-muted">
              {sample.intake.chartText}
            </pre>
          </details>
        </div>
      </Card>

      {status === 'idle' && (
        <Card className="border-dashed p-8 text-center">
          <AiDraftBadge size="block" className="mx-auto max-w-lg text-left" />
          <p className="mt-6 font-display text-xl text-ink">No synthesis has been run yet</p>
          <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-umber">
            Nothing is cached for sample cases — no draft exists until you generate one. Running it
            makes a real Anthropic API call on the chart above and takes 10–20 seconds.
          </p>
          <Button variant="primary" onClick={onRunSynthesis} className="mt-7">
            Run synthesis on this case
          </Button>
        </Card>
      )}

      {status === 'synthesizing' && <SynthesisProcessing startedAt={synthesis.startedAt} />}

      {status === 'failed' && (
        <ErrorPanel error={synthesis.error} onRetry={onRunSynthesis} onStartOver={onClear} />
      )}

      {status === 'done' && (
        <>
          <DraftDocument draft={synthesis.draft} meta={synthesis.meta} />
          <Card className="p-5">
            <p className="text-[15px] font-medium text-ink">
              Sample cases stop here on purpose
            </p>
            <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-umber">
              The edit-and-send flow belongs to the live case, which is the one that shows a
              physician taking responsibility for a response the patient actually receives. Offering
              it here would imply {sample.name} is waiting on a reply.
            </p>
            <Button variant="outline" onClick={onClear} className="mt-5">
              Clear this draft
            </Button>
          </Card>
        </>
      )}
    </div>
  )
}
