import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/primitives.jsx'

/**
 * Placeholder for the planned LiveKit video visit.
 *
 * Structurally isolated on purpose: this component owns the trigger, the modal,
 * and all of its own state, and the dashboard passes it nothing but the patient
 * name. Swapping in real LiveKit (room token fetch, `<LiveKitRoom>`, track
 * subscriptions, device permissions) means replacing the body of this file — no
 * other component needs to change, and no video state leaks into the case
 * reducer.
 *
 * Deliberately no fake video UI: no simulated participant tiles, no mute button
 * that does nothing. A convincing-looking call that cannot connect is worse in a
 * demo than an honest placeholder.
 */
export function JoinVideoVisitButton({ patientName, variant = 'outline', className = '' }) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={className}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <rect x="1" y="4" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11 7.2 15 5v6l-4-2.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        Join video visit
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-visit-title"
            className="w-full max-w-md rounded-lg border border-dune bg-sandstone-raised p-6 shadow-lift"
          >
            <p className="field-label">Placeholder</p>
            <h2 id="video-visit-title" className="mt-3 font-display text-2xl leading-tight text-ink">
              Video visit would start here
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-umber">
              This build has no video implementation. In production this opens a LiveKit room with
              {patientName ? ` ${patientName}` : ' the patient'}, gated on the physician's device
              permissions.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-umber">
              Kept as its own isolated component so real video logic can drop in without touching
              the rest of the dashboard.
            </p>
            <div className="mt-7 flex justify-end">
              <Button ref={closeRef} variant="secondary" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
