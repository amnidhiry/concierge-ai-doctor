import { StatusLabel } from './CaseSheet.jsx'

/**
 * Physician identity block.
 *
 * The product's core claim is that a named person is responsible for the
 * response, so the physician is presented as a person with credentials — not an
 * avatar in a testimonial card.
 *
 * ── On the photograph ──────────────────────────────────────────────────────
 * Pass `photoUrl` to render a real portrait. Leave it unset and you get a
 * document-style photo slot, which is a deliberate design element rather than a
 * broken image.
 *
 * Two rules for whatever image goes here:
 *
 *  1. It must be licensed for this use. A hotlinked stock-library preview URL is
 *     unlicensed (and usually a signed, expiring link that breaks on its own).
 *     Self-host a file you have rights to — drop it in /public and pass
 *     photoUrl="/dr-name.jpg".
 *  2. It should be the actual reviewing physician. A generic stock portrait
 *     attached to invented credentials makes the fabrication more convincing,
 *     which for a medical service is worse than an obvious placeholder.
 *
 * ── On the credentials ─────────────────────────────────────────────────────
 * `placeholder` renders a visible "needs real content" marker. Only set it false
 * when supplying a real, verified identity — inventing credentials for a medical
 * service is not a cosmetic detail.
 */

/**
 * Document photo slot. Corner registration marks and a stated purpose, so it
 * reads as a form field awaiting content rather than a failed image load.
 */
function PhotoSlot() {
  const corner = 'absolute h-2.5 w-2.5 border-oxblood/50'
  return (
    <div
      className="relative flex aspect-[4/5] w-full max-w-[8rem] items-end justify-center border border-dune bg-sandstone-sunk"
      role="img"
      aria-label="Photograph slot — no physician photograph supplied"
    >
      <span aria-hidden="true" className={`${corner} left-1 top-1 border-l border-t`} />
      <span aria-hidden="true" className={`${corner} right-1 top-1 border-r border-t`} />
      <span aria-hidden="true" className={`${corner} bottom-1 left-1 border-b border-l`} />
      <span aria-hidden="true" className={`${corner} bottom-1 right-1 border-b border-r`} />
      <span
        aria-hidden="true"
        className="pb-3 text-center font-mono text-micro uppercase tracking-label text-umber-light"
      >
        Photograph
        <br />
        to be supplied
      </span>
    </div>
  )
}

export function PhysicianIdentity({
  name,
  credential,
  registration,
  philosophy,
  focus = [],
  photoUrl = null,
  photoAlt = '',
  // Object-position for the crop. The slot is 4:5 portrait, so a landscape
  // source loses its sides — biasing upward keeps the face rather than centring
  // on the torso.
  photoPosition = 'center 22%',
  placeholder = true,
  className = '',
}) {
  return (
    <div className={`grid gap-6 sm:grid-cols-[8rem_1fr] sm:gap-8 ${className}`}>
      <div>
        {photoUrl ? (
          <img
            src={photoUrl}
            // A portrait is meaningful content, so it needs a real alt. Falling
            // back to the name beats an empty string here.
            alt={photoAlt || `Portrait of ${name}`}
            width={160}
            height={200}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: photoPosition }}
            className="aspect-[4/5] w-full max-w-[8rem] border border-dune object-cover"
          />
        ) : (
          <PhotoSlot />
        )}

        {placeholder && (
          <p className="mt-2 font-mono text-micro uppercase tracking-label text-oxblood">
            Placeholder
          </p>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-title font-medium text-ink">{name}</p>
          {placeholder && <StatusLabel tone="oxblood">Needs real content</StatusLabel>}
        </div>
        <p className="mt-1 text-meta text-umber">{credential}</p>
        {registration && (
          <p className="mt-0.5 font-mono text-micro text-umber-light">{registration}</p>
        )}

        {focus.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {focus.map((item) => (
              <li key={item} className="text-meta text-ink-muted">
                {item}
              </li>
            ))}
          </ul>
        )}

        {philosophy && (
          <blockquote className="mt-5 border-l-2 border-oxblood pl-4">
            <p className="patient-voice">{philosophy}</p>
          </blockquote>
        )}
      </div>
    </div>
  )
}
