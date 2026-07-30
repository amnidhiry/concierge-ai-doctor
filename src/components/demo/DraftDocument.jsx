import { Badge } from '../ui/primitives.jsx'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'
import { URGENCY_ORDER } from '../../domain/models.js'

/**
 * Renders the structured model output as a clinical document.
 *
 * Every section renders from the real response — nothing here is placeholder
 * copy. Sections with no content are omitted rather than shown empty, except
 * `data_gaps` and `open_questions_for_physician`, which are the most useful
 * parts of a thin draft and get an explicit "none" state so their absence can't
 * be mistaken for an oversight.
 */

function Section({ label, children, count }) {
  return (
    <section className="border-t border-dune pt-5">
      <div className="flex items-baseline gap-2.5">
        <h3 className="field-label">{label}</h3>
        {typeof count === 'number' && (
          <span className="font-mono text-[10px] text-umber-light">{count}</span>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Bullets({ items, tone = 'ink' }) {
  if (!items?.length) return <p className="text-sm italic text-umber-light">None noted.</p>
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-muted">
          <span
            className={`mt-2 h-1 w-1 shrink-0 rounded-full ${
              tone === 'draft' ? 'bg-draft' : 'bg-dune-deep'
            }`}
          />
          <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
        </li>
      ))}
    </ul>
  )
}

const CONFIDENCE_TONE = { high: 'pulse', moderate: 'neutral', low: 'neutral' }
const URGENCY_TONE = { urgent: 'alert', prompt: 'alert', routine: 'neutral' }

export function DraftDocument({ draft, meta, reviewed = false }) {
  if (!draft) return null

  const safetyFlags = [...(draft.safety_flags ?? [])].sort(
    (a, b) => (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9),
  )

  return (
    <article className="overflow-hidden rounded-lg border border-dune bg-sandstone-raised shadow-card">
      <header className="border-b border-dune bg-dune/25 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="field-label">Second-opinion draft</p>
          <AiDraftBadge state={reviewed ? 'reviewed' : 'pending'} />
        </div>
        {meta && (
          <p className="mt-2.5 font-mono text-[11px] text-umber">
            {meta.model}
            {typeof meta.elapsedMs === 'number' && ` · ${(meta.elapsedMs / 1000).toFixed(1)}s`}
            {meta.usage?.outputTokens != null && ` · ${meta.usage.outputTokens} output tokens`}
          </p>
        )}
      </header>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {/* Safety first — before anything a reader might stop scrolling on. */}
        {safetyFlags.length > 0 && (
          <div className="rounded-md border border-crimson/30 bg-crimson-wash px-4 py-3.5">
            <p className="field-label text-crimson">Flagged for physician attention</p>
            <ul className="mt-2.5 space-y-2">
              {safetyFlags.map((flag, i) => (
                <li key={i} className="flex flex-wrap items-start gap-2 text-[15px] leading-relaxed text-ink">
                  <Badge tone={URGENCY_TONE[flag.urgency] ?? 'neutral'}>{flag.urgency}</Badge>
                  <span className="flex-1">{flag.flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {draft.one_line_summary && (
          <div>
            <h3 className="field-label">Summary</h3>
            <p className="mt-2.5 text-[17px] leading-relaxed text-ink">{draft.one_line_summary}</p>
          </div>
        )}

        {(draft.clinical_snapshot?.presenting_problem ||
          draft.clinical_snapshot?.key_history?.length ||
          draft.clinical_snapshot?.current_treatment?.length) && (
          <Section label="Clinical snapshot">
            {draft.clinical_snapshot.presenting_problem && (
              <p className="text-[15px] leading-relaxed text-ink-muted">
                {draft.clinical_snapshot.presenting_problem}
              </p>
            )}
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-medium text-ink">Key history</p>
                <div className="mt-2">
                  <Bullets items={draft.clinical_snapshot.key_history} />
                </div>
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">Current treatment</p>
                <div className="mt-2">
                  <Bullets items={draft.clinical_snapshot.current_treatment} />
                </div>
              </div>
            </div>
          </Section>
        )}

        {draft.differential_considerations?.length > 0 && (
          <Section
            label="Differential considerations"
            count={draft.differential_considerations.length}
          >
            <p className="mb-4 text-[13px] leading-relaxed text-umber">
              Possibilities for the physician to confirm or exclude — not conclusions.
            </p>
            <div className="space-y-4">
              {draft.differential_considerations.map((item, i) => (
                <div key={i} className="rounded-md border border-dune bg-sandstone px-4 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[15px] font-medium leading-snug text-ink">
                      {item.consideration}
                    </p>
                    {item.confidence && (
                      <Badge tone={CONFIDENCE_TONE[item.confidence] ?? 'neutral'}>
                        {item.confidence}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[12px] font-medium uppercase tracking-wide text-verified">
                        Supports
                      </p>
                      <div className="mt-1.5">
                        <Bullets items={item.supporting_findings} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium uppercase tracking-wide text-umber">
                        Against / missing
                      </p>
                      <div className="mt-1.5">
                        <Bullets items={item.against_or_gaps} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section
          label="Open questions for the physician"
          count={draft.open_questions_for_physician?.length ?? 0}
        >
          {draft.open_questions_for_physician?.length ? (
            <ol className="space-y-3.5">
              {draft.open_questions_for_physician.map((item, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="font-mono text-[13px] text-draft">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="text-[15px] leading-relaxed text-ink">{item.question}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-umber">
                      {item.why_it_matters}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm italic text-umber-light">
              The model raised no open questions for this case.
            </p>
          )}
        </Section>

        {draft.suggested_next_steps?.length > 0 && (
          <Section label="Next steps to consider" count={draft.suggested_next_steps.length}>
            <ul className="space-y-3.5">
              {draft.suggested_next_steps.map((item, i) => (
                <li key={i}>
                  <p className="text-[15px] leading-relaxed text-ink">{item.step}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-umber">{item.rationale}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section label="Data gaps" count={draft.data_gaps?.length ?? 0}>
          {draft.data_gaps?.length ? (
            <Bullets items={draft.data_gaps} tone="draft" />
          ) : (
            <p className="text-sm italic text-umber-light">
              The model identified no material gaps in the submitted record.
            </p>
          )}
        </Section>
      </div>
    </article>
  )
}
