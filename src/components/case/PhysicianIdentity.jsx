import { StatusLabel } from './CaseSheet.jsx'

/**
 * Physician identity block.
 *
 * The product's core claim is that a named person is responsible for the
 * response, so the physician has to be presented as a person with credentials —
 * not an avatar in a testimonial card.
 *
 * PLACEHOLDER CONTENT: the name, credentials, and philosophy passed to this
 * component are invented for the prototype. Every instance renders a visible
 * "placeholder" marker so no one can mistake it for a real clinician's
 * credentials. Remove `placeholder` only when supplying a real, verified
 * identity — inventing credentials for a medical service is not a cosmetic
 * detail.
 */
export function PhysicianIdentity({
  name,
  credential,
  registration,
  philosophy,
  focus = [],
  placeholder = true,
  className = '',
}) {
  return (
    <div className={`grid gap-6 sm:grid-cols-[8rem_1fr] sm:gap-8 ${className}`}>
      {/* Photograph placeholder. Deliberately a labelled empty frame rather than
          a stock portrait or an illustrated avatar — both would misrepresent
          this as a real person. */}
      <div>
        <div
          className="flex aspect-[4/5] w-full max-w-[8rem] items-end justify-center border border-dune bg-sandstone-sunk"
          role="img"
          aria-label="Photograph placeholder — no physician photograph supplied"
        >
          <span className="pb-3 font-mono text-micro uppercase tracking-label text-umber-light">
            Photo
          </span>
        </div>
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
