import { useSearchParams, useParams, Link } from 'react-router-dom'
import { useVideoVisit } from '../hooks/useVideoVisit.js'
import { VideoVisitPanel } from '../components/video/LazyVideoVisitPanel.jsx'
import { Logo } from '../components/layout/SiteNav.jsx'
import { Container } from '../components/ui/primitives.jsx'

/**
 * Standalone patient join page: `/visit/:caseId`.
 *
 * Deliberately outside the `/demo` route tree and independent of DemoProvider.
 * The patient joins in a second browser tab, and a second tab has none of the
 * first tab's in-memory state — so anything this page needs has to come from the
 * URL. The case ID in the path is sufficient, because the room name is derived
 * from it server-side.
 *
 * `?role=physician` is supported so the physician side can also be opened in its
 * own tab, which is useful when demoing on a second monitor.
 */
export function VisitPage() {
  const { caseId } = useParams()
  const [params] = useSearchParams()
  const role = params.get('role') === 'physician' ? 'physician' : 'patient'

  const visit = useVideoVisit({
    caseId,
    role,
    displayName: role === 'physician' ? 'Dr. Imani Reyes' : 'Patient',
  })

  return (
    <div className="flex min-h-screen flex-col bg-sandstone">
      <header className="border-b border-dune bg-sandstone-raised">
        <Container width="wide">
          <div className="flex h-16 items-center justify-between gap-4">
            <Logo />
            <p className="font-mono text-[11px] uppercase tracking-label text-umber">
              {role === 'physician' ? 'Physician' : 'Patient'} · visit-{caseId}
            </p>
          </div>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
              {role === 'physician' ? 'Video visit' : 'Your video visit'}
            </h1>
            <p className="mt-3 text-[17px] leading-relaxed text-umber">
              {role === 'physician'
                ? 'Joining as the physician in a standalone tab.'
                : 'Your physician has opened a video visit. Join when you are ready — this is a live connection, not a recording.'}
            </p>
          </div>

          <div className="mt-8 max-w-3xl overflow-hidden rounded-lg border border-dune bg-sandstone-raised shadow-card">
            <VideoVisitPanel visit={visit} role={role} echoWarning />
          </div>

          <p className="mt-6 max-w-prose text-xs leading-relaxed text-umber">
            Prototype. This page has no authentication — anyone with the link can join the room, which
            is fine for a demo and is not how a production build would work. Nothing is recorded.
          </p>

          <Link
            to="/demo/physician"
            className="mt-4 inline-block font-mono text-[11px] uppercase tracking-label text-pulse hover:underline"
          >
            Back to the physician dashboard
          </Link>
        </Container>
      </main>
    </div>
  )
}
