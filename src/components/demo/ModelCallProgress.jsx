import { useEffect, useState } from 'react'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'

/**
 * In-flight state for a model call — the one place in the build where motion is
 * doing real work rather than decorating.
 *
 * Deliberately *not* a scripted stage sequence ("parsing chart… extracting
 * findings… drafting…"). Those timings would be invented, and a progress
 * indicator that fakes its stages is lying to the reviewer about the very thing
 * this demo exists to show. Instead: a real elapsed-seconds counter driven off the
 * actual in-flight request, plus an indeterminate sweep that communicates
 * "working, duration unknown" — which is the honest state of a non-streaming call.
 *
 * The counter is text, so under prefers-reduced-motion (where index.css kills the
 * sweep and pulse) the component still reads as active.
 *
 * Shared by both model calls rather than duplicated, with the produced-artifact
 * list passed in — the honesty argument is identical for each, and two copies
 * would drift.
 */
export function ModelCallProgress({ startedAt, title, description, produces = [] }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const t0 = startedAt ?? Date.now()
    setElapsed((Date.now() - t0) / 1000)
    const id = setInterval(() => setElapsed((Date.now() - t0) / 1000), 100)
    return () => clearInterval(id)
  }, [startedAt])

  const slow = elapsed > 20

  return (
    <div className="overflow-hidden rounded-lg border border-draft/30 bg-sandstone-raised shadow-card">
      {/* Indeterminate sweep. A determinate bar would require knowing the
          duration, which we don't. */}
      <div className="relative h-0.5 overflow-hidden bg-draft-wash">
        <div className="absolute inset-y-0 left-0 w-1/3 animate-sweep bg-draft" />
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="relative mt-1 flex h-3 w-3 shrink-0">
            <span className="absolute inset-0 animate-breathe rounded-full bg-draft" />
          </span>
          <div className="flex-1">
            <h2 className="text-title text-ink">{title}</h2>
            <p
              className="mt-2 font-mono text-sm text-draft-deep"
              aria-live="polite"
              aria-atomic="true"
            >
              {elapsed.toFixed(1)}s elapsed
            </p>
            <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-umber">{description}</p>
          </div>
        </div>

        {produces.length > 0 && (
          <div className="hairline mt-7 pt-6">
            <p className="field-label">This call produces</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {produces.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-draft"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {slow && (
          <p className="mt-6 rounded-md bg-dune/50 px-4 py-3 text-sm leading-relaxed text-ink-muted">
            Still working. Long or complex material takes longer — the request has not failed.
          </p>
        )}

        <div className="mt-6">
          <AiDraftBadge size="block" />
        </div>
      </div>
    </div>
  )
}

/** The two call sites, so the copy stays with the thing it describes. */
export const PACKET_PROGRESS = {
  title: 'Assembling the care packet',
  description:
    'A live request is in flight to the Anthropic API with your intake and chart text. The counter above is real elapsed time on that call — there is no scripted animation waiting on pre-written content.',
  produces: [
    'What the record states, with a source on every claim',
    'Risk scores as supplied — never calculated here',
    'Openings worth discussing on the call',
    'Questions to ask while the patient is on the phone',
    'Data gaps — what the record does not contain',
    'A suggested running order for the 20–30 minutes',
  ],
}

export const DOCUMENTATION_PROGRESS = {
  title: 'Drafting the documentation',
  description:
    'A live request is in flight with the transcript you entered and the care packet. Real elapsed time on that call — nothing here is pre-written.',
  produces: [
    'A structured clinical note',
    'A plain-language summary for the patient',
    'A billing-code suggestion with its unmet conditions',
    'What the transcript does not establish',
  ],
}
