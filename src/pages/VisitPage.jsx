import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useVoiceVisit } from '../hooks/useVoiceVisit.js'
import { VoiceVisitPanel } from '../components/voice/LazyVoiceVisitPanel.jsx'
import { Logo } from '../components/layout/SiteNav.jsx'
import { Container } from '../components/ui/primitives.jsx'
import { VISIT_MINUTES } from '../domain/models.js'

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

  const visit = useVoiceVisit({
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
            <h1 className="text-display-sm text-ink sm:text-display">
              {role === 'physician' ? 'Voice visit' : 'Your call with the physician'}
            </h1>
            <p className="mt-3 text-body-lg leading-relaxed text-umber">
              {role === 'physician'
                ? 'Joining as the physician in a standalone tab. Audio only.'
                : `A voice call, ${VISIT_MINUTES.min}–${VISIT_MINUTES.max} minutes. There is no camera and nothing is recorded — join when you are ready.`}
            </p>
          </div>

          <div className="mt-8 max-w-2xl overflow-hidden rounded-lg border border-dune bg-sandstone-raised shadow-card">
            <VoiceVisitPanel visit={visit} role={role} echoWarning />
          </div>

          {role === 'patient' && (
            <div className="mt-6 max-w-prose">
              <p className="text-[15px] leading-relaxed text-umber">
                After the call your physician writes a summary in plain language and a note you can
                hand to your own doctor. That is the last thing this visit produces — it is a single
                bounded appointment, so there is no follow-up here and no way to message afterwards.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-umber">
                If anything about your health changes before then, or you develop chest pain,
                breathlessness, or faintness, contact emergency services rather than waiting for this
                call.
              </p>
            </div>
          )}

          <p className="mt-6 max-w-prose text-xs leading-relaxed text-umber">
            Prototype. This page has no authentication — anyone with the link can join the room, which
            is fine for a demo and is not how a production build would work. Nothing is recorded and
            nothing is transcribed.
          </p>

          <Link
            to="/demo/visit"
            className="mt-4 inline-block font-mono text-[11px] uppercase tracking-label text-pulse hover:underline"
          >
            Back to the physician view
          </Link>
        </Container>
      </main>
    </div>
  )
}
