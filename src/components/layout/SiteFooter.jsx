import { Link } from 'react-router-dom'
import { Container } from '../ui/primitives.jsx'
import { MetaList, MetaRow } from '../case/CaseSheet.jsx'

/**
 * Footer as a colophon.
 *
 * Previously a dark four-column link farm with the disclaimer as small print at
 * the bottom. Now it stays on the ivory page — a footer that inverts to near-black
 * is a SaaS convention that fights the document feel — and the prototype
 * disclosures are the primary content rather than a legal afterthought. For a
 * healthcare service, being precise about what this is *not* is a trust signal,
 * so it gets a labelled definition list instead of a grey sentence.
 */

const NAV = [
  { to: '/services', label: 'Services and pricing' },
  { to: '/for-physicians', label: 'For physicians' },
  { to: '/demo', label: 'Start a specialist review' },
]

const DISCLOSURES = [
  [
    'Status',
    'Prototype. Built for demonstration, not in clinical use, and not accepting real patients.',
  ],
  [
    'Data',
    'No real patient records. Everything entered is synthetic, and nothing persists past a page refresh.',
  ],
  [
    'Not medical advice',
    'Nothing produced here is medical advice or a diagnosis. AI output is labelled as a draft until a physician has reviewed it.',
  ],
  [
    'Physician identity',
    'The reviewing physician shown throughout is a placeholder. No real clinician’s name or credentials appear on this site.',
  ],
  [
    'Compliance',
    'Not HIPAA/BAA-grade infrastructure. No authentication, no audit trail, no encryption guarantees.',
  ],
]

export function SiteFooter() {
  return (
    <footer className="border-t border-ink bg-sandstone">
      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="font-display text-subtitle text-ink">
              Auricle<span className="italic">Health</span>
            </p>
            <p className="mt-3 max-w-note text-meta leading-relaxed text-umber">
              Asynchronous preventative cardiology. A named specialist reads your records and writes
              the response.
            </p>

            <nav aria-label="Footer" className="mt-7">
              <ul className="space-y-2">
                {NAV.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-meta text-ink-muted underline decoration-dune-deep underline-offset-4 transition-colors hover:text-ink hover:decoration-pulse"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div>
            <p className="sheet-label">Prototype disclosures</p>
            <MetaList className="mt-4 border-t border-dune">
              {DISCLOSURES.map(([label, detail]) => (
                <MetaRow key={label} label={label} tone="muted">
                  {detail}
                </MetaRow>
              ))}
            </MetaList>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3 border-t border-dune pt-5">
          <p className="font-mono text-micro uppercase tracking-label text-umber-light">
            © {new Date().getFullYear()} AuricleHealth
          </p>
          <p className="font-mono text-micro text-umber-light">
            If you are having symptoms now, contact emergency services.
          </p>
        </div>
      </Container>
    </footer>
  )
}
