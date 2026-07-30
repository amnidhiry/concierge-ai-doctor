import { Link } from 'react-router-dom'
import { Container } from '../ui/primitives.jsx'

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { to: '/services', label: 'Services & pricing' },
      { to: '/demo', label: 'Interactive demo' },
    ],
  },
  {
    heading: 'For clinicians',
    links: [
      { to: '/for-physicians', label: 'Run a panel' },
      { to: '/demo/physician', label: 'Physician dashboard' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-dune bg-ink text-dune-deep">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-xl text-sandstone">
              Auricle<span className="italic text-dune-deep">Health</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed">
              Cash-pay asynchronous preventative cardiology. A licensed physician reviews, edits,
              and owns every response that reaches a patient.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="field-label text-umber-light">{column.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-dune-deep transition-colors hover:text-sandstone"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-ink-muted pt-8">
          <p className="max-w-3xl text-xs leading-relaxed text-umber-light">
            <strong className="font-medium text-dune-deep">Prototype.</strong> This is a demo-day
            build, not a clinical product. It is not HIPAA-compliant infrastructure, it holds no
            real patient data, and nothing it produces is medical advice. AI output is always
            labelled as a draft pending physician review. Any case material entered here should be
            synthetic.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-label text-umber-light">
            © {new Date().getFullYear()} AuricleHealth
          </p>
        </div>
      </Container>
    </footer>
  )
}
