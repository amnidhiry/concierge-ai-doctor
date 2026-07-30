import { Badge } from '../ui/primitives.jsx'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'
import { URGENCY_ORDER } from '../../domain/models.js'

/**
 * Renders the structured care packet as a clinical document.
 *
 * Every section renders from the real model response — nothing here is
 * placeholder copy. Sections with no content are omitted rather than shown empty,
 * except `data_gaps`, `open_questions_for_physician`, and
 * `risk_assessment_status`, which are the most useful parts of a thin packet and
 * get an explicit "none" state so their absence can't be mistaken for an
 * oversight.
 *
 * ── Sources are rendered, not hidden ───────────────────────────────────────
 * Each factual claim carries where it came from and whether the model is quoting
 * the record or reading it. That is displayed inline rather than tucked behind a
 * disclosure, because the physician is checking this against the chart in the
 * three minutes before a call and a source they have to click for is a source
 * they won't look at. `inferred` is marked visually distinct from `stated` for
 * the same reason.
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

/** A claim with its provenance. The `inferred` marker is the point of this. */
function SourcedItem({ item }) {
  const inferred = item.basis === 'inferred'
  return (
    <li className="grid grid-cols-[0.5rem_1fr] gap-x-2.5">
      <span
        aria-hidden="true"
        className={`mt-2 h-1 w-1 shrink-0 rounded-full ${inferred ? 'bg-draft' : 'bg-dune-deep'}`}
      />
      <div className="min-w-0">
        <p className="text-[15px] leading-relaxed text-ink-muted">{item.statement}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-label text-umber-light">
          {inferred && <span className="text-draft-deep">Inferred · </span>}
          {item.source || 'source not stated'}
        </p>
      </div>
    </li>
  )
}

function SourcedList({ items }) {
  if (!items?.length) return <p className="text-sm italic text-umber-light">None in the record.</p>
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <SourcedItem key={i} item={item} />
      ))}
    </ul>
  )
}

function PlainList({ items, tone = 'default' }) {
  if (!items?.length) return null
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-muted">
          <span
            aria-hidden="true"
            className={`mt-2 h-1 w-1 shrink-0 rounded-full ${
              tone === 'draft' ? 'bg-draft' : 'bg-dune-deep'
            }`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

const CONFIDENCE_TONE = { high: 'pulse', moderate: 'neutral', low: 'neutral' }
const URGENCY_TONE = { urgent: 'alert', prompt: 'alert', routine: 'neutral' }

export function CarePacketDocument({ packet, meta, reviewed = false }) {
  if (!packet) return null

  const safetyFlags = [...(packet.safety_flags ?? [])].sort(
    (a, b) => (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9),
  )

  const snapshot = packet.clinical_snapshot ?? {}

  return (
    <article className="overflow-hidden rounded-lg border border-dune bg-sandstone-raised shadow-card">
      <header className="border-b border-dune bg-dune/25 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="field-label">Care packet</p>
            <p className="mt-1 text-[13px] text-umber">
              For the physician, before the call. Not sent to the patient.
            </p>
          </div>
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
        {/* Safety first — before anything a reader might stop scrolling on. A
            time-sensitive finding means this patient should not be on a
            scheduled preventive call at all. */}
        {safetyFlags.length > 0 && (
          <div className="rounded-md border border-crimson/30 bg-crimson-wash px-4 py-3.5">
            <p className="field-label text-crimson">Read before dialling</p>
            <ul className="mt-2.5 space-y-2">
              {safetyFlags.map((flag, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-start gap-2 text-[15px] leading-relaxed text-ink"
                >
                  <Badge tone={URGENCY_TONE[flag.urgency] ?? 'neutral'}>{flag.urgency}</Badge>
                  <span className="flex-1">{flag.flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {packet.one_line_summary && (
          <div>
            <h3 className="field-label">Summary</h3>
            <p className="mt-2.5 text-[17px] leading-relaxed text-ink">{packet.one_line_summary}</p>
          </div>
        )}

        {/* Risk assessment. Always rendered, even when nothing was supplied,
            because "no score was calculated" is a clinically meaningful
            statement and an absent section reads as an omission. */}
        <Section label="Risk assessment">
          {packet.supplied_risk_scores?.length ? (
            <>
              <p className="mb-3 text-[13px] leading-relaxed text-umber">
                Reported as supplied by the record. Not calculated here.
              </p>
              <dl className="divide-y divide-dune/70 border-y border-dune">
                {packet.supplied_risk_scores.map((score, i) => (
                  <div key={i} className="grid gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[14rem_1fr]">
                    <dt className="text-[15px] font-medium text-ink">{score.name}</dt>
                    <dd className="text-[15px] leading-relaxed text-ink-muted">
                      {score.value_as_supplied}
                      {score.source && (
                        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-label text-umber-light">
                          {score.source}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}

          <p
            className={`text-[15px] leading-relaxed text-ink-muted ${
              packet.supplied_risk_scores?.length ? 'mt-3.5' : ''
            }`}
          >
            {packet.risk_assessment_status ||
              'No risk score was supplied in the submitted material, and none was calculated.'}
          </p>
        </Section>

        {(snapshot.presenting_problem ||
          snapshot.key_history?.length ||
          snapshot.current_treatment?.length) && (
          <Section label="Clinical snapshot">
            {snapshot.presenting_problem && (
              <p className="text-[15px] leading-relaxed text-ink-muted">
                {snapshot.presenting_problem}
              </p>
            )}
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-medium text-ink">Key history</p>
                <div className="mt-2">
                  <SourcedList items={snapshot.key_history} />
                </div>
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">Current treatment</p>
                <div className="mt-2">
                  <SourcedList items={snapshot.current_treatment} />
                </div>
              </div>
            </div>
          </Section>
        )}

        {packet.discussion_points?.length > 0 && (
          <Section label="Worth discussing on the call" count={packet.discussion_points.length}>
            <p className="mb-4 text-[13px] leading-relaxed text-umber">
              Openings for the physician to explore — not conclusions, and not a plan.
            </p>
            <div className="space-y-4">
              {packet.discussion_points.map((item, i) => (
                <div key={i} className="rounded-md border border-dune bg-sandstone px-4 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[15px] font-medium leading-snug text-ink">{item.point}</p>
                    {item.confidence && (
                      <Badge tone={CONFIDENCE_TONE[item.confidence] ?? 'neutral'}>
                        {item.confidence}
                      </Badge>
                    )}
                  </div>
                  {item.why_it_matters && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-umber">
                      {item.why_it_matters}
                    </p>
                  )}
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-label text-verified">
                        In the record
                      </p>
                      <div className="mt-1.5">
                        <SourcedList items={item.supporting} />
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-label text-umber">
                        Against / missing
                      </p>
                      <div className="mt-1.5">
                        {item.against_or_gaps?.length ? (
                          <PlainList items={item.against_or_gaps} />
                        ) : (
                          <p className="text-sm italic text-umber-light">None noted.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section
          label="Ask on the call"
          count={packet.open_questions_for_physician?.length ?? 0}
        >
          {packet.open_questions_for_physician?.length ? (
            <ol className="space-y-3.5">
              {packet.open_questions_for_physician.map((item, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="font-mono text-[13px] text-draft">
                    {String(i + 1).padStart(2, '0')}
                  </span>
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
              The model raised no questions for the call.
            </p>
          )}
        </Section>

        <Section label="Data gaps" count={packet.data_gaps?.length ?? 0}>
          {packet.data_gaps?.length ? (
            <PlainList items={packet.data_gaps} tone="draft" />
          ) : (
            <p className="text-sm italic text-umber-light">
              The model identified no material gaps in the submitted record.
            </p>
          )}
        </Section>

        {packet.call_agenda?.length > 0 && (
          <Section label="Suggested running order" count={packet.call_agenda.length}>
            <ol className="space-y-2">
              {packet.call_agenda.map((item, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-muted">
                  <span className="font-mono text-[11px] leading-6 text-oxblood">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>
    </article>
  )
}
