import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDemo } from '../../context/DemoProvider.jsx'
import { StepRail } from '../../components/demo/StepRail.jsx'
import { Logo } from '../../components/layout/SiteNav.jsx'
import { Button, Container } from '../../components/ui/primitives.jsx'

/**
 * Demo chrome: its own header with the step rail, so the flow reads as a
 * product surface rather than another marketing page.
 */
export function DemoLayout() {
  const { liveCase, hasIntake, resetDemo } = useDemo()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-sandstone">
      <header className="sticky top-0 z-40 border-b border-dune bg-sandstone/90 backdrop-blur-md">
        <Container width="wide">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Logo />
              <span className="hidden font-mono text-[10px] uppercase tracking-label text-umber sm:inline">
                Demo
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasIntake && (
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-sm"
                  onClick={() => {
                    resetDemo()
                    navigate('/demo')
                  }}
                >
                  Reset
                </Button>
              )}
              <Button as="link" to="/" variant="outline" className="px-3.5 py-1.5 text-sm">
                Exit demo
              </Button>
            </div>
          </div>
        </Container>
        <div className="border-t border-dune bg-sandstone-raised">
          <Container width="wide" className="py-2.5">
            <StepRail status={liveCase.status} />
          </Container>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-dune bg-sandstone-raised">
        <Container width="wide" className="py-6">
          <p className="max-w-3xl text-xs leading-relaxed text-umber">
            <strong className="font-medium text-ink-muted">Prototype.</strong> Step 2 makes a real
            Anthropic API call; the physician panel below the live case is static sample data, and
            the video button is a placeholder. Nothing here is medical advice, and no data persists
            past a page refresh. Use synthetic case material only.
          </p>
        </Container>
      </footer>
    </div>
  )
}
