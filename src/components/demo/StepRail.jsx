import { Link } from 'react-router-dom'
import { VISIT_STAGES, stageStateFor } from '../../domain/models.js'

/**
 * Progress rail across the four stages of one bounded visit.
 *
 * Reads entirely from `liveCase.status` rather than the current route, so the rail
 * stays truthful if someone deep-links to a later stage before a case exists.
 *
 * The stage list and the status mapping live in `src/domain/models.js`, not here —
 * they are case-shape logic, and keeping them out of the component makes them
 * testable without a DOM.
 */
export function StepRail({ status }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {VISIT_STAGES.map((stage, i) => {
        const state = stageStateFor(stage.key, status)
        const reachable = state !== 'pending'

        const tone =
          state === 'active'
            ? 'bg-pulse-wash text-pulse'
            : state === 'done'
              ? 'text-ink-muted hover:bg-dune/50'
              : 'text-umber-light'

        const marker =
          state === 'active'
            ? 'border-pulse bg-pulse text-white'
            : state === 'done'
              ? 'border-verified bg-verified-wash text-verified'
              : 'border-dune-deep text-umber-light'

        const inner = (
          <span
            className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors ${tone}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${marker}`}
            >
              {state === 'done' ? (
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
                  <path
                    d="M2 6.4 4.6 9 10 3.2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-label">
              <span className="hidden sm:inline">{stage.label}</span>
              <span className="sm:hidden">{stage.short}</span>
            </span>
          </span>
        )

        return (
          <li key={stage.key} className="flex items-center">
            {reachable ? (
              <Link to={stage.path} aria-current={state === 'active' ? 'step' : undefined}>
                {inner}
              </Link>
            ) : (
              <span aria-disabled="true">{inner}</span>
            )}
            {i < VISIT_STAGES.length - 1 && (
              <span aria-hidden="true" className="mx-1 hidden h-px w-5 bg-dune-deep sm:block" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
