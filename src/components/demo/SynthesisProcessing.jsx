import { useEffect, useState } from 'react'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'

/**
 * Step 2 processing state — the one place in the build where motion is doing
 * real work rather than decorating.
 *
 * Deliberately *not* a scripted stage sequence ("parsing chart… extracting
 * findings… drafting…"). Those timings would be invented, and a progress
 * indicator that fakes its stages is lying to the reviewer about the very thing
 * this demo exists to show. Instead: a real elapsed-seconds counter driven off
 * the actual in-flight request, plus an indeterminate sweep that communicates
 * "working, duration unknown" — which is the honest state of a non-streaming
 * call.
 *
 * The counter is text, so under prefers-reduced-motion (where index.css kills
 * the sweep and pulse) the component still reads as active.
 */
export function SynthesisProcessing({ startedAt }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const t0 = startedAt ?? Date.now()
    setElapsed((Date.now() - t0) / 1000)
    const id = setInterval(() => setElapsed((Date.now() - t0) / 1000), 100)
    return () => clearInterval(id)
  }, [startedAt])

  const slow = elapsed > 20

  return (
    <div className="overflow-hidden rounded-lg border border-draft/30 bg-paper-raised shadow-card">
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
            <h2 className="font-display text-2xl leading-tight text-ink">
              Synthesizing the case
            </h2>
            <p
              className="mt-2 font-mono text-sm text-draft-deep"
              aria-live="polite"
              aria-atomic="true"
            >
              {elapsed.toFixed(1)}s elapsed
            </p>
            <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-slate">
              A live request is in flight to the Anthropic API with your intake and chart text. The
              counter above is real elapsed time on that call — there's no scripted animation
              waiting on pre-written content.
            </p>
          </div>
        </div>

        <div className="hairline mt-7 pt-6">
          <p className="field-label">This pass produces</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              'Clinical snapshot from the submitted record',
              'Differential considerations, with what supports and opposes each',
              'Open questions for the physician to confirm',
              'Data gaps — what the record does not contain',
              'Suggested next steps to consider',
              'A plain-language draft reply for the physician to edit',
            ].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-draft" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {slow && (
          <p className="mt-6 rounded-md bg-mist/50 px-4 py-3 text-sm leading-relaxed text-ink-muted">
            Still working. Long or complex chart material takes longer — the request has not failed.
          </p>
        )}

        <div className="mt-6">
          <AiDraftBadge size="block" />
        </div>
      </div>
    </div>
  )
}
