import { patientVisitPath } from '../../lib/videoVisit.js'
import { Button } from '../ui/primitives.jsx'

/**
 * Patient-side entry point.
 *
 * Opens the standalone `/visit/:caseId` route in a new tab rather than joining
 * inline. Two reasons, and the first is the important one:
 *
 *   1. A browser tab can only hold one seat in a call. During the demo the
 *      physician dashboard is already open in this tab, so joining inline would
 *      mean tearing down the physician's side to see the patient's. A second tab
 *      is what makes the two-party connection observable at all.
 *   2. `/visit/:caseId` takes everything it needs from the URL, so the new tab
 *      works despite having none of this tab's in-memory demo state.
 *
 * `target="_blank"` with `rel="noopener"` — without noopener the new tab gets a
 * handle on this one via window.opener.
 */
export function PatientJoinVisitButton({ caseId, variant = 'secondary', className = '' }) {
  return (
    <Button
      as="link"
      to={patientVisitPath(caseId)}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      className={className}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <rect x="1" y="4" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M11 7.2 15 5v6l-4-2.2z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      Join video visit
    </Button>
  )
}
