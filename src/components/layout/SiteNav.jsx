import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Container, Button } from '../ui/primitives.jsx'

/**
 * Wordmark. The serif stays here — a wordmark is a mark, not a headline, and this
 * is one of the few places the editorial face is doing brand work rather than
 * shouting hierarchy.
 */
export function Logo({ tone = 'dark' }) {
  const text = tone === 'light' ? 'text-sandstone' : 'text-ink'
  const mark = tone === 'light' ? 'text-dune' : 'text-oxblood'
  return (
    <Link to="/" className="inline-flex items-baseline gap-2">
      {/* ECG trace — the one figurative mark in the identity. */}
      <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 self-center ${mark}`}>
        <path
          d="M1 8h3l1.6-4.4L8.4 13l1.9-5H15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`font-display text-[1.0625rem] leading-none tracking-tight ${text}`}>
        Auricle<span className="italic">Health</span>
      </span>
    </Link>
  )
}

/**
 * Patient-first navigation. "For physicians" is deliberately a quiet text link
 * rather than a peer nav item — the supply side of the business is not what a
 * patient landing here needs to parse first.
 */
const PATIENT_LINKS = [{ to: '/the-visit', label: 'The visit' }]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close the mobile sheet on navigation, otherwise it stays open over the new page.
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-dune bg-sandstone/92 backdrop-blur-md">
      <Container>
        <div className="flex h-14 items-center justify-between gap-4">
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
            {PATIENT_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-meta transition-colors ${
                    isActive
                      ? 'text-ink underline decoration-oxblood decoration-2 underline-offset-[6px]'
                      : 'text-umber hover:text-ink'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/for-physicians"
              className={({ isActive }) =>
                `text-meta transition-colors ${
                  isActive
                    ? 'text-ink underline decoration-oxblood decoration-2 underline-offset-[6px]'
                    : 'text-umber-light hover:text-ink'
                }`
              }
            >
              For physicians
            </NavLink>
            <span aria-hidden="true" className="h-4 w-px bg-dune" />
            <Button as="link" to="/demo" variant="primary">
              Book a call
            </Button>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 rounded-md p-2 text-ink md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {open && (
        <div id="mobile-nav" className="border-t border-dune bg-sandstone md:hidden">
          <Container className="flex flex-col py-3">
            <nav aria-label="Main" className="flex flex-col divide-y divide-dune">
              {[...PATIENT_LINKS, { to: '/for-physicians', label: 'For physicians' }].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `py-3 text-meta ${isActive ? 'text-ink' : 'text-umber'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <Button as="link" to="/demo" variant="primary" className="mt-4 w-full">
              Book a call
            </Button>
          </Container>
        </div>
      )}
    </header>
  )
}
