import { Badge } from '../ui/primitives.jsx'
import { MOCK_PANEL } from '../../domain/mockPanel.js'

/**
 * The physician's panel.
 *
 * Every row is selectable. Earlier versions made the sample rows inert on the
 * grounds that only the live case carries real model output — but a panel where
 * nothing opens reads as broken, which is a worse thing to show a demo audience
 * than a clearly-labelled sample case. The honesty is preserved by labelling the
 * rows and by the detail view stating plainly that no draft exists until one is
 * generated, rather than by disabling the click.
 */

const STATUS_META = {
  intake: { tone: 'neutral', label: 'Intake' },
  awaiting_review: { tone: 'draft', label: 'Needs review' },
  synthesizing: { tone: 'draft', label: 'Synthesizing' },
  physician_sent: { tone: 'verified', label: 'Sent' },
  sent: { tone: 'verified', label: 'Sent' },
  failed: { tone: 'alert', label: 'Failed' },
  draft_intake: { tone: 'neutral', label: 'Intake' },
}

function Row({ name, meta, condition, summary, status, sample, selected, onSelect, badge }) {
  const statusMeta = STATUS_META[status] ?? STATUS_META.intake

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
          <p className="mt-0.5 truncate text-[13px] text-umber">{condition}</p>
        </div>
        <Badge tone={statusMeta.tone} className="shrink-0">
          {statusMeta.label}
        </Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-umber">{summary}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-label text-umber-light">{meta}</p>
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

export function PanelList({ liveCase, sampleSynthesis = {}, selectedId, onSelect }) {
  const needsReview =
    MOCK_PANEL.filter((p) => p.status === 'awaiting_review').length +
    (liveCase.status === 'awaiting_review' ? 1 : 0)

  const liveSummary =
    liveCase.draft?.one_line_summary ||
    (liveCase.status === 'synthesizing'
      ? 'Synthesis in progress…'
      : liveCase.status === 'failed'
        ? 'Synthesis failed — see detail.'
        : 'Awaiting intake submission.')

  return (
    <div className="overflow-hidden rounded-lg border border-dune bg-sandstone-raised">
      <div className="flex items-center justify-between gap-3 border-b border-dune bg-dune/30 px-4 py-3">
        <p className="field-label">Panel · {MOCK_PANEL.length + 1} patients</p>
        {needsReview > 0 && <Badge tone="draft">{needsReview} need review</Badge>}
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        <Row
          name={liveCase.patient.name}
          condition="Second opinion · submitted this session"
          summary={liveSummary}
          status={liveCase.status}
          meta="Live case"
          selected={selectedId === liveCase.id}
          onSelect={() => onSelect(liveCase.id)}
        />

        {MOCK_PANEL.map((p) => {
          const synth = sampleSynthesis[p.id]
          return (
            <Row
              key={p.id}
              name={`${p.name} · ${p.age}${p.sex}`}
              condition={p.condition}
              summary={p.summary}
              status={p.status}
              meta={p.waitingLabel}
              sample
              badge={
                synth?.status === 'done'
                  ? 'draft generated'
                  : synth?.status === 'synthesizing'
                    ? 'synthesizing'
                    : null
              }
              selected={selectedId === p.id}
              onSelect={() => onSelect(p.id)}
            />
          )
        })}
      </div>

      <p className="border-t border-dune bg-dune/20 px-4 py-3 text-xs leading-relaxed text-umber">
        Only the live case runs the full intake → review → send loop. The sample rows are static
        records you can open and run a real synthesis on.
      </p>
    </div>
  )
}
