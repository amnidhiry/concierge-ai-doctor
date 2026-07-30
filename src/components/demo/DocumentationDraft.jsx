import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'
import { noteToText } from '../../domain/models.js'

/**
 * Renders the model's documentation draft as three separate artifacts.
 *
 * Kept visually separate on purpose. The note, the patient summary, and the
 * billing suggestion have three different readers and three different failure
 * modes, and a physician reviewing them is doing three different jobs. Merging
 * them into one document would invite skimming the whole thing as a single
 * approval decision, which is exactly what should not happen.
 *
 * `documentation_gaps` is rendered first, before any of the three, because it is
 * the list of things the physician has to fix and the only section that gets less
 * useful the further down the page it sits.
 */

function Panel({ label, note, children, tone = 'default' }) {
  const border = tone === 'billing' ? 'border-oxblood/30' : 'border-dune'
  return (
    <section className={`overflow-hidden rounded-lg border ${border} bg-sandstone-raised`}>
      <header className="border-b border-dune bg-dune/25 px-5 py-3.5">
        <p className="field-label">{label}</p>
        {note && <p className="mt-1 text-[13px] leading-relaxed text-umber">{note}</p>}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

export function DocumentationDraft({ documentation, meta }) {
  if (!documentation) return null

  const { clinical_note: note, patient_summary: summary, billing_code_suggestion: billing } =
    documentation
  const gaps = documentation.documentation_gaps ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="field-label">Drafted from the transcript</p>
          {meta && (
            <p className="mt-1 font-mono text-[11px] text-umber">
              {meta.model}
              {typeof meta.elapsedMs === 'number' && ` · ${(meta.elapsedMs / 1000).toFixed(1)}s`}
              {meta.usage?.outputTokens != null && ` · ${meta.usage.outputTokens} output tokens`}
            </p>
          )}
        </div>
        <AiDraftBadge />
      </div>

      {/* Gaps first: this is the physician's worklist. */}
      <section className="overflow-hidden rounded-lg border border-draft/40 bg-draft-wash">
        <header className="border-b border-draft/25 px-5 py-3.5">
          <p className="field-label text-draft-deep">
            What the transcript does not establish · {gaps.length}
          </p>
        </header>
        <div className="px-5 py-4">
          {gaps.length ? (
            <ul className="space-y-2">
              {gaps.map((gap, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-draft-deep"
                  />
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] leading-relaxed text-ink-muted">
              The model reported no gaps. Worth a sceptical read — a transcript with nothing missing
              is unusual, and this is the section where an over-confident draft shows up.
            </p>
          )}
        </div>
      </section>

      <Panel
        label="Clinical note"
        note="For the chart and for the patient's own clinician. Editable below."
      >
        <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-ink-muted">
          {noteToText(note)}
        </pre>
      </Panel>

      <Panel label="Patient summary" note="Plain language, addressed to the patient.">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-muted">{summary}</p>
      </Panel>

      <Panel
        label="Billing code suggestion"
        note="A suggestion only. Nothing is submitted anywhere in this build."
        tone="billing"
      >
        {billing?.code ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-mono text-[17px] text-oxblood">
              {billing.code_system} {billing.code}
            </p>
            <p className="text-[15px] text-ink">{billing.descriptor}</p>
          </div>
        ) : (
          <p className="text-[15px] font-medium text-ink">No code suggested.</p>
        )}

        {billing?.rationale && (
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-muted">
            {billing.rationale}
          </p>
        )}

        {billing?.requirements_to_confirm?.length > 0 && (
          <div className="mt-4 border-t border-dune pt-3.5">
            <p className="field-label">The physician must confirm</p>
            <ul className="mt-2 space-y-1.5">
              {billing.requirements_to_confirm.map((req, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-umber">
                  <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-oxblood/60" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </div>
  )
}
