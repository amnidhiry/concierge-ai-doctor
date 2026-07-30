import { patientVisitPath } from '../../lib/voiceVisit.js'
import { Button } from '../ui/primitives.jsx'

/**
 * Patient-side entry point to the scheduled call.
 *
 * Opens the standalone `/visit/:caseId` route in a new tab rather than joining
 * inline. Two reasons, and the first is the important one:
 *
 *   1. A browser tab can only hold one seat in a call. During the demo the
 *      physician's view is already open in this tab, so joining inline would mean
 *      tearing down the physician's side to see the patient's. A second tab is
 *      what makes the two-party connection observable at all.
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
      {/* Handset, not a camera. The mark has to match the medium. */}
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path
          d="M3.2 2h2.3l1.1 2.8-1.5 1.1a7.4 7.4 0 0 0 3.9 3.9l1.1-1.5L13 9.4v2.3a1.3 1.3 0 0 1-1.4 1.3A10.6 10.6 0 0 1 2 3.4 1.3 1.3 0 0 1 3.2 2Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Join the call
    </Button>
  )
}
