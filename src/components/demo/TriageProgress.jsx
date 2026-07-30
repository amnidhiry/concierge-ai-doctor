import { Badge } from '../ui/primitives.jsx'

/**
 * Live view of what the triage agent has captured.
 *
 * This exists because a chat transcript alone doesn't show whether the intake is
 * actually going anywhere. Rendering the agent's own `information_gathered` and
 * `still_needed` makes the structured extraction visible as it happens — and it
 * makes a bad turn obvious, since a misread answer shows up here as a wrong
 * fact rather than being buried three messages up.
 */
export function TriageProgress({ agentState, readyForPhysician }) {
  const gathered = agentState?.information_gathered ?? []
  const needed = agentState?.still_needed ?? []

  if (!agentState) {
    return (
      <div className="rounded-lg border border-dashed border-dune-deep bg-dune/20 px-4 py-5">
        <p className="field-label">Captured so far</p>
        <p className="mt-2 text-[13px] leading-relaxed text-umber">
          Nothing yet. Answer the assistant and the structured intake will build here as it reads
          your replies.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dune bg-sandstone-raised">
      <div className="flex items-center justify-between gap-3 border-b border-dune px-4 py-3">
        <p className="field-label">Captured so far</p>
        {readyForPhysician ? (
          <Badge tone="verified">Ready to submit</Badge>
        ) : (
          <Badge tone="neutral">{gathered.length} items</Badge>
        )}
      </div>

      <div className="space-y-4 px-4 py-4">
        {gathered.length > 0 && (
          <ul className="space-y-2">
            {gathered.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                <svg
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                  className="mt-1 h-3 w-3 shrink-0 text-verified"
                  fill="none"
                >
                  <path
                    d="M2 6.4 4.6 9 10 3.2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {needed.length > 0 && (
          <div className={gathered.length ? 'border-t border-dune pt-4' : ''}>
            <p className="field-label">Still to cover</p>
            <ul className="mt-2 space-y-1.5">
              {needed.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-umber">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-dune-deep" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
