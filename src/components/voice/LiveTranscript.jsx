import { useEffect, useRef } from 'react'
import { StatusLabel } from '../case/CaseSheet.jsx'

/**
 * The in-call transcript panel.
 *
 * Three facts are on screen rather than in a tooltip, because each one changes
 * how much a physician should trust what they are reading:
 *
 *  - it hears this device's microphone only, so speaker labels come from whose
 *    device this is and not from voice diarisation;
 *  - Chrome performs recognition on Google's servers, so the audio leaves the
 *    machine even though nothing is stored;
 *  - accuracy is consumer-grade.
 *
 * The alternative — a clean panel that just shows text — would read as a clinical
 * transcription feature, which this is not.
 */
export function LiveTranscript({
  supported,
  capturing,
  segments,
  interim,
  error,
  onStart,
  onStop,
  onDismissError,
  className = '',
}) {
  const scrollRef = useRef(null)

  // Follow the tail as speech arrives, so the physician sees the newest line
  // without scrolling mid-call.
  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [segments.length, interim])

  return (
    <section
      className={`flex min-h-0 flex-col border border-ink-muted/40 bg-ink-soft/40 ${className}`}
      aria-label="Live transcript"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              capturing ? 'animate-breathe bg-crimson' : 'bg-dune-deep/60'
            }`}
          />
          <p className="font-mono text-micro uppercase tracking-label text-sandstone">
            Live transcript
          </p>
        </div>

        {supported ? (
          <button
            type="button"
            onClick={capturing ? onStop : onStart}
            className="border border-dune/30 px-2.5 py-1 font-mono text-micro uppercase tracking-label text-sandstone transition-colors hover:bg-dune/15"
          >
            {capturing ? 'Stop' : segments.length ? 'Resume' : 'Start'}
          </button>
        ) : (
          <StatusLabel tone="neutral">Not supported here</StatusLabel>
        )}
      </header>

      {!supported && (
        <p className="px-4 py-3 text-meta leading-relaxed text-dune">
          This browser has no speech recognition API — Chrome and Edge have it, Safari and Firefox
          largely do not. The call still works; you can paste a transcript afterwards.
        </p>
      )}

      {error && (
        <div role="alert" className="border-b border-crimson/40 bg-crimson/15 px-4 py-2.5">
          <p className="text-meta leading-relaxed text-sandstone">{error.message}</p>
          {!error.fatal && (
            <button
              type="button"
              onClick={onDismissError}
              className="mt-1.5 font-mono text-micro uppercase tracking-label text-dune hover:text-sandstone"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
        {segments.length === 0 && !interim && (
          <p className="text-meta leading-relaxed text-dune-deep">
            {capturing
              ? 'Listening. Recognised speech will appear here.'
              : supported
                ? 'Not transcribing. Start it to capture what is said.'
                : ''}
          </p>
        )}

        {segments.map((segment, i) => (
          <p key={i} className="text-meta leading-relaxed text-sandstone">
            <span className="font-mono text-micro uppercase tracking-label text-dune-deep">
              {segment.speaker}
            </span>{' '}
            {segment.text}
          </p>
        ))}

        {/* Interim text is dimmed and italic: it is a guess the recogniser has not
            committed to and will frequently rewrite. Styling it identically to
            final text would present a draft as settled. */}
        {interim && (
          <p className="text-meta italic leading-relaxed text-dune-deep">{interim}</p>
        )}
      </div>

      <footer className="border-t border-ink-muted/40 px-4 py-2.5">
        <p className="text-[11px] leading-relaxed text-dune-deep">
          Captures <strong className="font-medium text-dune">this device's microphone only</strong>,
          so the labels say whose device spoke, not who was recognised — there is no voice
          identification. Chrome performs recognition on Google's servers. Accuracy is
          consumer-grade and unverified. <strong className="font-medium text-dune">No audio is
          recorded or stored</strong>; only this text, in memory.
        </p>
      </footer>
    </section>
  )
}
