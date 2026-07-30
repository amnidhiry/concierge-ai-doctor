import { useEffect, useRef, useState } from 'react'
import { useVideoVisit } from '../../hooks/useVideoVisit.js'
import { VideoVisitPanel } from '../video/LazyVideoVisitPanel.jsx'
import { patientVisitUrl } from '../../lib/videoVisit.js'
import { Button } from '../ui/primitives.jsx'

/**
 * Physician-side entry point to a real LiveKit visit.
 *
 * Phase 1 shipped this as a placeholder modal, structurally isolated so real
 * video could drop in without touching the dashboard. That held: this file's body
 * was replaced, its props are unchanged apart from the `caseId` the room is
 * derived from, and no video state leaked into the case model.
 *
 * Also surfaces the patient join link. The patient side runs in a second tab,
 * and a second tab has none of this tab's in-memory demo state — so the link
 * points at a standalone route keyed by case ID rather than at anything that
 * depends on the physician's session.
 */
export function JoinVideoVisitButton({
  caseId,
  patientName,
  displayName,
  variant = 'outline',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const closeRef = useRef(null)
  const visit = useVideoVisit({ caseId, role: 'physician', displayName })

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e) => {
      // Escape shouldn't yank the physician out of a live call by accident.
      if (e.key === 'Escape' && !visit.isActive) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, visit.isActive])

  async function copyLink() {
    const url = patientVisitUrl(caseId)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Clipboard API needs a secure context and can be blocked outright.
      // Falling back to a prompt beats a button that silently does nothing.
      window.prompt('Copy the patient visit link:', url)
    }
  }

  function close() {
    setOpen(false)
    visit.reset()
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={className}>
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

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !visit.isActive) close()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-visit-title"
            className="w-full max-w-3xl overflow-hidden rounded-lg border border-dune bg-sandstone-raised shadow-lift"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dune px-5 py-3.5">
              <div>
                <p id="video-visit-title" className="text-[15px] font-medium text-ink">
                  Video visit · {patientName || caseId}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-umber">room visit-{caseId}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={copyLink} className="px-3 py-1.5 text-sm">
                  {copied ? 'Link copied' : 'Copy patient link'}
                </Button>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  disabled={visit.isActive}
                  title={visit.isActive ? 'Leave the call before closing' : 'Close'}
                  className="rounded-md p-2 text-umber transition-colors hover:bg-dune/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Close video visit"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <VideoVisitPanel visit={visit} role="physician" onClose={close} />

            {!visit.isActive && (
              <div className="border-t border-dune bg-dune/25 px-5 py-3">
                <p className="text-[13px] leading-relaxed text-umber">
                  For the demo: join here, then open the patient link in a second tab to connect the
                  other side.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
