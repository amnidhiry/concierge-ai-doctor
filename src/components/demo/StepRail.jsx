import { Link } from 'react-router-dom'

/**
 * Progress rail across the four demo steps.
 *
 * Reads entirely from `liveCase.status` rather than the current route, so the
 * rail stays truthful if someone deep-links to /demo/physician before a case
 * exists.
 */

const STEPS = [
  { key: 'intake', to: '/demo', label: 'Patient intake', short: 'Intake' },
  { key: 'synthesis', to: '/demo/synthesis', label: 'AI synthesis', short: 'Synthesis' },
  { key: 'review', to: '/demo/physician', label: 'Physician review', short: 'Review' },
  { key: 'response', to: '/demo/response', label: 'Patient response', short: 'Response' },
]

/** Maps case status onto which steps are done / active / not yet reachable. */
function stateFor(stepKey, status) {
  const reached = {
    draft_intake: ['intake'],
    synthesizing: ['intake', 'synthesis'],
    failed: ['intake', 'synthesis'],
    awaiting_review: ['intake', 'synthesis', 'review'],
    physician_sent: ['intake', 'synthesis', 'review', 'response'],
  }[status] ?? ['intake']

  const activeKey = reached[reached.length - 1]
  if (stepKey === activeKey) return 'active'
  if (reached.includes(stepKey)) return 'done'
  return 'pending'
}

export function StepRail({ status }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {STEPS.map((step, i) => {
        const state = stateFor(step.key, status)
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
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.short}</span>
            </span>
          </span>
        )

        return (
          <li key={step.key} className="flex items-center">
            {reachable ? (
              <Link to={step.to} aria-current={state === 'active' ? 'step' : undefined}>
                {inner}
              </Link>
            ) : (
              <span aria-disabled="true">{inner}</span>
            )}
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="mx-1 hidden h-px w-5 bg-dune-deep sm:block" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
