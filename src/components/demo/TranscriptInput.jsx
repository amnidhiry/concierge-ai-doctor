import { Button } from '../ui/primitives.jsx'
import { EXAMPLE_SYNTHETIC_TRANSCRIPT } from '../../domain/mockSchedule.js'

/**
 * Transcript entry for the documentation stage.
 *
 * ── This component is where the build's biggest honesty boundary lives ─────
 * The call can now be transcribed live, but only by the browser's own speech
 * recognition — which is consumer-grade, absent on iOS Safari, and hears one
 * microphone per device. So a transcript may be good, partial, or missing, and the
 * two defensible ways to handle that are:
 *
 *   1. Present whatever was captured as authoritative, and let the demo imply
 *      clinical-grade transcription.
 *   2. Present it as a draft to be corrected, keep the paste path first-class, and
 *      label what came from where.
 *
 * The first is a lie about the one capability this stage exists to demonstrate,
 * and the audience for a demo like this — physicians evaluating whether to trust
 * the documentation — is exactly the audience that would be misled by it. So:
 * option two, stated at the top of the panel rather than in a footnote.
 *
 * The example transcript is offered behind an explicit button, is labelled
 * synthetic in its own first line, and is never inserted automatically. That
 * keeps the stage demonstrable without any moment where the app implies it
 * produced a transcript itself.
 */
export function TranscriptInput({ value, source, onChange, disabled }) {
  const chars = value.length

  return (
    <div className="overflow-hidden rounded-lg border border-draft/40 bg-sandstone-raised">
      <div className="border-b border-draft/25 bg-draft-wash px-5 py-4">
        <p className="field-label text-draft-deep">Visit transcript · entered by hand</p>
        <p className="mt-2 max-w-prose text-[15px] font-medium leading-relaxed text-ink">
          Live transcription is best-effort. Check it.
        </p>
        <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-ink-muted">
          The call can be transcribed live by the browser's speech recognition, which is
          consumer-grade and hears one microphone per device. Nothing is recorded and no audio is
          stored. Anything captured lands here for you to correct. Documentation
          is only ever drafted from text someone types or pastes here. Nothing generates a transcript
          for you, and the endpoint refuses to draft without one — a note built from an invented
          conversation would demonstrate the opposite of what this stage is for.
        </p>
      </div>

      <div className="px-5 py-4">
        <label htmlFor="visit-transcript" className="sr-only">
          Synthetic visit transcript
        </label>
        <textarea
          id="visit-transcript"
          value={value}
          disabled={disabled}
          onChange={(e) =>
            // Once a human edits captured text it is no longer verbatim capture,
            // so the label has to stop saying it is.
            onChange(e.target.value, source === 'captured' ? 'edited' : 'pasted')
          }
          rows={12}
          placeholder={
            'Paste or write the visit transcript here.\n\nSynthetic material only — never a real consultation, and never real patient information.'
          }
          className="w-full resize-y rounded-md border border-dune-deep bg-sandstone px-3.5 py-3 font-mono text-[13px] leading-relaxed text-ink placeholder:font-sans placeholder:text-[14px] placeholder:text-umber-light focus:border-pulse focus:outline-none focus:ring-1 focus:ring-pulse disabled:opacity-50"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-umber">
            {chars.toLocaleString()} characters
            {source === 'example' && (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-label text-draft-deep">
                · synthetic example loaded
              </span>
            )}
            {source === 'pasted' && chars > 0 && (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-label text-umber-light">
                · entered by hand
              </span>
            )}
            {/* Captured speech gets its own label. A physician about to sign a note
                needs to know whether the words came from the call or from an
                authored script — the three sources warrant different scrutiny. */}
            {source === 'edited' && chars > 0 && (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-label text-umber-light">
                · captured, then edited
              </span>
            )}
            {source === 'captured' && chars > 0 && (
              <span className="ml-2 font-mono text-[10px] uppercase tracking-label text-pulse">
                · captured live from the call
              </span>
            )}
          </p>

          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => onChange(EXAMPLE_SYNTHETIC_TRANSCRIPT, 'example')}
            className="px-3.5 py-1.5 text-sm"
          >
            Insert a synthetic example
          </Button>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-umber">
          The example is authored demo material — a written script, not a recording of anything. It
          is deliberately imperfect (an inaudible stretch, a dropped topic, a value the patient could
          not find) so the model's gap reporting has something real to catch.
        </p>
      </div>
    </div>
  )
}
