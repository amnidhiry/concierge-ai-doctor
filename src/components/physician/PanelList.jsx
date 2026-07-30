import { Badge } from '../ui/primitives.jsx'
import { MOCK_PANEL } from '../../domain/mockPanel.js'

/**
 * The physician's panel.
 *
 * The live case sits at the top; everything below it is static scenery from
 * mockPanel.js, there to give the queue realistic density. Mock rows are visibly
 * marked and are not selectable — a demo where clicking a fake patient opens an
 * empty detail pane teaches the reviewer the wrong thing about what's real.
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

function Row({ name, meta, condition, summary, status, live, selected, onSelect }) {
  const statusMeta = STATUS_META[status] ?? STATUS_META.intake
  const interactive = Boolean(live)

  const base = 'w-full border-b border-mist px-4 py-3.5 text-left transition-colors'
  const state = selected
    ? 'bg-pulse-wash'
    : interactive
      ? 'hover:bg-mist/40'
      : 'opacity-60'

  const Tag = interactive ? 'button' : 'div'

  return (
    <Tag
      {...(interactive ? { type: 'button', onClick: onSelect, 'aria-current': selected } : {})}
      className={`${base} ${state} ${interactive ? '' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-ink">{name}</p>
          <p className="mt-0.5 truncate text-[13px] text-slate">{condition}</p>
        </div>
        <Badge tone={statusMeta.tone} className="shrink-0">
          {statusMeta.label}
        </Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-slate">{summary}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-label text-slate-light">{meta}</p>
        {!interactive && (
          <span className="font-mono text-[10px] uppercase tracking-label text-slate-light">
            · sample row
          </span>
        )}
      </div>
    </Tag>
  )
}

export function PanelList({ liveCase, selectedId, onSelect }) {
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
    <div className="overflow-hidden rounded-lg border border-mist bg-paper-raised">
      <div className="flex items-center justify-between gap-3 border-b border-mist bg-mist/30 px-4 py-3">
        <p className="field-label">Panel · {MOCK_PANEL.length + 1} patients</p>
        {needsReview > 0 && <Badge tone="draft">{needsReview} need review</Badge>}
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        <Row
          name={`${liveCase.patient.name}`}
          condition="Second opinion · submitted this session"
          summary={liveSummary}
          status={liveCase.status}
          meta="Live case"
          live
          selected={selectedId === liveCase.id}
          onSelect={() => onSelect(liveCase.id)}
        />

        {MOCK_PANEL.map((p) => (
          <Row
            key={p.id}
            name={`${p.name} · ${p.age}${p.sex}`}
            condition={p.condition}
            summary={p.summary}
            status={p.status}
            meta={p.waitingLabel}
          />
        ))}
      </div>

      <p className="border-t border-mist bg-mist/20 px-4 py-3 text-xs leading-relaxed text-slate">
        Only the live case carries real model output. The rows below it are static sample data and
        are not selectable.
      </p>
    </div>
  )
}
