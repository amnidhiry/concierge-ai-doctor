import { Badge, Button, Card } from '../ui/primitives.jsx'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'
import { CarePacketDocument } from '../demo/CarePacketDocument.jsx'
import { ModelCallProgress, PACKET_PROGRESS } from '../demo/ModelCallProgress.jsx'
import { ErrorPanel } from '../demo/ErrorPanel.jsx'
import { StartVoiceVisitButton } from './StartVoiceVisitButton.jsx'

/**
 * Read-only detail view for a sample scheduled visit.
 *
 * Sample visits carry synthetic intake material but no pre-computed packet — so
 * where the care packet would be, this shows an explicit "nothing generated yet"
 * state plus a button to run one for real. Nothing here fabricates model output:
 * either a live call produced the packet on screen, or the space says plainly that
 * it is empty.
 *
 * Deliberately has no documentation-and-approval flow. That belongs to the visit
 * booked this session, which is the one that demonstrates a physician taking
 * responsibility for a record end to end. Adding it here would imply these six
 * were real patients whose notes are outstanding.
 */
export function SampleVisitDetail({ visit, packet, onRunPacket, onClear, physician }) {
  const status = packet?.status ?? 'idle'

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="field-label">Case {visit.id}</p>
              <Badge tone="neutral">Sample visit</Badge>
            </div>
            <p className="mt-1.5 text-title text-ink">
              {visit.name} · {visit.age}
              {visit.sex}
            </p>
            <p className="mt-1 text-sm text-umber">
              {visit.reason} · {visit.slotLabel} · {visit.durationMinutes} min
            </p>
          </div>
          <StartVoiceVisitButton
            caseId={visit.id}
            patientName={visit.name}
            displayName={`${physician.name}, ${physician.credential}`}
            durationMinutes={visit.durationMinutes}
            variant="outline"
          />
        </div>
      </Card>

      <Card className="border-dune-deep bg-dune/25 p-5">
        <p className="text-[15px] font-medium text-ink">This is invented sample data</p>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-umber">
          {visit.name} is not a real patient and this record is written for the prototype. The intake
          below is fixed, but you can run a real care-packet call on it — what comes back is genuine
          model output on this material, generated when you click.
        </p>
      </Card>

      {/* The source material, so the packet can be checked against it. */}
      <Card className="overflow-hidden">
        <div className="border-b border-dune bg-dune/25 px-5 py-3.5">
          <p className="field-label">What the patient submitted</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div>
            <p className="text-[13px] font-medium text-ink">In their words</p>
            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-muted">
              {visit.intake.patientMessage}
            </p>
          </div>
          <details>
            <summary className="cursor-pointer text-[13px] font-medium text-pulse">
              Chart material ({visit.intake.chartText.length.toLocaleString()} chars)
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-dune/30 p-4 font-mono text-[12px] leading-relaxed text-ink-muted">
              {visit.intake.chartText}
            </pre>
          </details>
        </div>
      </Card>

      {status === 'idle' && (
        <Card className="border-dashed p-8 text-center">
          <AiDraftBadge size="block" className="mx-auto max-w-lg text-left" />
          <p className="mt-6 text-title text-ink">No care packet has been generated</p>
          <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-umber">
            Nothing is cached for sample visits — no packet exists until you generate one. Running it
            makes a real Anthropic API call on the chart above and takes 10–20 seconds.
          </p>
          <Button variant="primary" onClick={onRunPacket} className="mt-7">
            Generate the care packet
          </Button>
        </Card>
      )}

      {status === 'assembling' && (
        <ModelCallProgress startedAt={packet.startedAt} {...PACKET_PROGRESS} />
      )}

      {status === 'failed' && (
        <ErrorPanel
          error={packet.error}
          onRetry={onRunPacket}
          onStartOver={onClear}
          stage="Care packet"
          startOverLabel="Clear"
        />
      )}

      {status === 'done' && (
        <>
          <CarePacketDocument packet={packet.packet} meta={packet.meta} />
          <Card className="p-5">
            <p className="text-[15px] font-medium text-ink">Sample visits stop here on purpose</p>
            <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-umber">
              The call, the write-up, and the approval belong to the visit booked this session — the
              one that shows a physician taking responsibility for a record the patient actually
              receives. Offering them here would imply {visit.name} is waiting on a note.
            </p>
            <Button variant="outline" onClick={onClear} className="mt-5">
              Clear this packet
            </Button>
          </Card>
        </>
      )}
    </div>
  )
}
