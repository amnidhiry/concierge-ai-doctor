import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Container, Button } from '../ui/primitives.jsx'

export function Logo({ tone = 'dark' }) {
  const text = tone === 'light' ? 'text-sandstone' : 'text-ink'
  const mark = tone === 'light' ? 'text-dune-deep' : 'text-pulse'
  return (
    <Link to="/" className="group inline-flex items-baseline gap-2">
      {/* ECG trace — the mark and the `pulse` token share the cardiology motif. */}
      <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 self-center ${mark}`}>
        <path
          d="M1 8h3l1.6-4.4L8.4 13l1.9-5H15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`font-display text-[19px] leading-none ${text}`}>
        Auricle<span className="italic text-pulse">Health</span>
      </span>
    </Link>
  )
}

const LINKS = [
  { to: '/services', label: 'Services' },
  { to: '/for-physicians', label: 'For physicians' },
]

export function SiteNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close the mobile sheet on navigation, otherwise it stays open over the new page.
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-dune bg-sandstone/85 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-[15px] transition-colors ${
                    isActive ? 'text-pulse' : 'text-ink-muted hover:text-ink'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Button as="link" to="/demo" variant="primary" className="ml-2">
              Open the demo
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
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
              {open ? (
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 6h14M3 10h14M3 14h14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {open && (
        <div id="mobile-nav" className="border-t border-dune bg-sandstone md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2.5 text-[15px] ${
                    isActive ? 'bg-pulse-wash text-pulse' : 'text-ink-muted'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Button as="link" to="/demo" variant="primary" className="mt-2 w-full">
              Open the demo
            </Button>
          </Container>
        </div>
      )}
    </header>
  )
}
