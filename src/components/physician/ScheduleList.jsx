import { Badge } from '../ui/primitives.jsx'
import { SCHEDULED_VISITS } from '../../domain/mockSchedule.js'

/**
 * The physician's booked visits.
 *
 * ── Why this is a schedule and not a queue ─────────────────────────────────
 * An earlier version listed a review queue: cases waiting for the physician to
 * get to them, sorted by how long they had been waiting. That framing belongs to
 * an asynchronous product. Here every entry is a call with a time on it, so the
 * organising fact is the slot, and "waiting 3h" is meaningless — nothing is
 * waiting, it is scheduled.
 *
 * Every row is selectable. Earlier versions made the sample rows inert on the
 * grounds that only the live case carries real model output — but a schedule where
 * nothing opens reads as broken, which is worse to show an audience than a
 * clearly-labelled sample. The honesty is preserved by labelling the rows and by
 * the detail view stating plainly that no packet exists until one is generated,
 * rather than by disabling the click.
 */

const STATUS_META = {
  // Sample-row statuses.
  intake_open: { tone: 'neutral', label: 'Intake open' },
  packet_ready: { tone: 'draft', label: 'Packet ready' },
  documentation_pending: { tone: 'draft', label: 'Write-up due' },
  approved: { tone: 'verified', label: 'Approved' },

  // Live-case statuses.
  booking: { tone: 'neutral', label: 'Booking' },
  assembling_packet: { tone: 'draft', label: 'Assembling' },
  awaiting_documentation: { tone: 'draft', label: 'Write-up due' },
  drafting_documentation: { tone: 'draft', label: 'Drafting' },
  documentation_ready: { tone: 'draft', label: 'Needs approval' },
  packet_failed: { tone: 'alert', label: 'Packet failed' },
  documentation_failed: { tone: 'alert', label: 'Draft failed' },
}

function Row({ name, slot, reason, summary, status, duration, sample, selected, onSelect, badge }) {
  const statusMeta = STATUS_META[status] ?? STATUS_META.booking

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={`w-full border-b border-dune px-4 py-3.5 text-left transition-colors ${
        selected ? 'bg-pulse-wash' : 'hover:bg-dune/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-ink">{name}</p>
          <p className="mt-0.5 truncate text-[13px] text-umber">{reason}</p>
        </div>
        <Badge tone={statusMeta.tone} className="shrink-0">
          {statusMeta.label}
        </Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-umber">{summary}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-label text-umber-light">
          {slot}
          {duration ? ` · ${duration} min` : ''}
        </p>
        {badge && (
          <span className="font-mono text-[10px] uppercase tracking-label text-draft">
            · {badge}
          </span>
        )}
        {sample && (
          <span className="font-mono text-[10px] uppercase tracking-label text-umber-light">
            · sample
          </span>
        )}
      </div>
    </button>
  )
}

export function ScheduleList({ liveCase, samplePackets = {}, selectedId, onSelect }) {
  const liveSummary =
    liveCase.packet?.one_line_summary ||
    ({
      booking: 'No intake submitted yet.',
      assembling_packet: 'Assembling the care packet…',
      packet_failed: 'Care packet failed — see detail.',
      awaiting_documentation: 'Call finished. Transcript needed for the write-up.',
      drafting_documentation: 'Drafting documentation…',
      documentation_failed: 'Documentation draft failed — see detail.',
    }[liveCase.status] ?? 'Awaiting the call.')

  const liveSlot = liveCase.visit?.scheduledFor
    ? new Date(liveCase.visit.scheduledFor).toLocaleString(undefined, {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not scheduled'

  const needsAttention =
    SCHEDULED_VISITS.filter((v) => v.status === 'documentation_pending').length +
    (liveCase.status === 'documentation_ready' || liveCase.status === 'awaiting_documentation'
      ? 1
      : 0)

  return (
    <div className="overflow-hidden rounded-lg border border-dune bg-sandstone-raised">
      <div className="flex items-center justify-between gap-3 border-b border-dune bg-dune/30 px-4 py-3">
        <p className="field-label">Booked visits · {SCHEDULED_VISITS.length + 1}</p>
        {needsAttention > 0 && <Badge tone="draft">{needsAttention} to write up</Badge>}
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        <Row
          name={liveCase.patient.name}
          reason="Expert-opinion call · booked this session"
          summary={liveSummary}
          status={liveCase.status}
          slot={liveSlot}
          duration={liveCase.visit?.durationMinutes}
          selected={selectedId === liveCase.id}
          onSelect={() => onSelect(liveCase.id)}
        />

        {SCHEDULED_VISITS.map((v) => {
          const packet = samplePackets[v.id]
          return (
            <Row
              key={v.id}
              name={`${v.name} · ${v.age}${v.sex}`}
              reason={v.reason}
              summary={v.summary}
              status={v.status}
              slot={v.slotLabel}
              duration={v.durationMinutes}
              sample
              badge={
                packet?.status === 'done'
                  ? 'packet generated'
                  : packet?.status === 'assembling'
                    ? 'assembling'
                    : null
              }
              selected={selectedId === v.id}
              onSelect={() => onSelect(v.id)}
            />
          )
        })}
      </div>

      <p className="border-t border-dune bg-dune/20 px-4 py-3 text-xs leading-relaxed text-umber">
        Only the visit booked this session runs the full loop through to approval. The sample rows are
        invented records you can open and generate a real care packet for.
      </p>
    </div>
  )
}
