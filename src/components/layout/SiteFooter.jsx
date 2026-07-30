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
    <footer className="mt-24 border-t border-mist bg-ink text-mist-deep">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-xl text-paper">
              Concierge <span className="italic">AI</span> Doctor
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed">
              Cash-pay asynchronous care. A licensed physician reviews, edits, and owns every
              response that reaches a patient.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <p className="field-label text-slate-light">{column.heading}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-mist-deep transition-colors hover:text-paper"
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
          <p className="max-w-3xl text-xs leading-relaxed text-slate-light">
            <strong className="font-medium text-mist-deep">Prototype.</strong> This is a demo-day
            build, not a clinical product. It is not HIPAA-compliant infrastructure, it holds no
            real patient data, and nothing it produces is medical advice. AI output is always
            labelled as a draft pending physician review. Any case material entered here should be
            synthetic.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-label text-slate-light">
            © {new Date().getFullYear()} Concierge AI Doctor
          </p>
        </div>
      </Container>
    </footer>
  )
}
