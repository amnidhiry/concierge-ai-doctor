import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { SiteNav } from './SiteNav.jsx'
import { SiteFooter } from './SiteFooter.jsx'

/** Marketing shell: nav, page, footer. The demo has its own chrome. */
export function SiteLayout() {
  const { pathname } = useLocation()

  // Client-side navigation preserves scroll position by default, which lands
  // the visitor mid-page on a route they've never seen.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
