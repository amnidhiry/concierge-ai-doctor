import { useEffect, useRef, useState } from 'react'
import { useVoiceVisit } from '../../hooks/useVoiceVisit.js'
import { VoiceVisitPanel } from '../voice/LazyVoiceVisitPanel.jsx'
import { patientVisitUrl } from '../../lib/voiceVisit.js'
import { Button } from '../ui/primitives.jsx'

/**
 * Physician-side entry point to the scheduled voice call.
 *
 * Also surfaces the patient join link. The patient side runs in a second tab, and
 * a second tab has none of this tab's in-memory demo state — so the link points
 * at a standalone route keyed by case ID rather than at anything that depends on
 * the physician's session.
 */
export function StartVoiceVisitButton({
  caseId,
  patientName,
  displayName,
  durationMinutes,
  onEndVisit,
  onTranscriptChange,
  variant = 'primary',
  className = '',
  label = 'Start the call',
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const closeRef = useRef(null)
  const visit = useVoiceVisit({ caseId, role: 'physician', displayName })

  useEffect(() => {
    if (!open) return undefined
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
      // The Clipboard API needs a secure context and can be blocked outright.
      // Falling back to a prompt beats a button that silently does nothing.
      window.prompt('Copy the patient call link:', url)
    }
  }

  function close() {
    setOpen(false)
    visit.reset()
  }

  /** Ending the visit closes the dialog: the next thing to do is the write-up. */
  function handleEndVisit() {
    onEndVisit?.()
    setOpen(false)
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={className}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path
            d="M3.2 2h2.3l1.1 2.8-1.5 1.1a7.4 7.4 0 0 0 3.9 3.9l1.1-1.5L13 9.4v2.3a1.3 1.3 0 0 1-1.4 1.3A10.6 10.6 0 0 1 2 3.4 1.3 1.3 0 0 1 3.2 2Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label}
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
            aria-labelledby="voice-visit-title"
            className="w-full max-w-2xl overflow-hidden border border-dune bg-sandstone-raised shadow-lift"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dune px-5 py-3.5">
              <div className="min-w-0">
                <p id="voice-visit-title" className="text-[15px] font-medium text-ink">
                  Voice visit · {patientName || caseId}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-umber">
                  room visit-{caseId} · audio only
                </p>
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
                  aria-label="Close voice visit"
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

            <VoiceVisitPanel
              visit={visit}
              role="physician"
              onClose={close}
              onEndVisit={onEndVisit ? handleEndVisit : undefined}
              durationMinutes={durationMinutes}
              onTranscriptChange={onTranscriptChange}
            />

            {!visit.isActive && (
              <div className="border-t border-dune bg-dune/25 px-5 py-3">
                <p className="text-[13px] leading-relaxed text-umber">
                  For the demo: join here, then open the patient link in a second tab to connect the
                  other side. Use headphones — two tabs on one machine will echo.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
