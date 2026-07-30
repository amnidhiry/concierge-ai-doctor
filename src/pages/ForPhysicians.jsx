import { Button, Container, Stat } from '../components/ui/primitives.jsx'
import { AiDraftBadge } from '../components/ui/AiDraftBadge.jsx'
import {
  Annotation,
  CaseSheet,
  MetaList,
  MetaRow,
  SectionRule,
  SheetBody,
  SheetHeader,
} from '../components/case/CaseSheet.jsx'

/**
 * The physician-facing page.
 *
 * This page now carries the supply-side argument that used to sit on the
 * homepage — shift-based specialists, cash-pay panels, panel economics. A patient
 * arriving at the homepage should not have to parse the business model to
 * understand the offer, but a physician evaluating it needs exactly that, stated
 * directly.
 *
 * Kept the dark opening band: on this page the inversion marks an audience
 * change rather than decorating a marketing section.
 */

const FITS = [
  [
    'Emergency medicine',
    'You work in blocks. Between them you have hours that are useless for anything scheduled and fine for reading six written cases. Your triage instincts are the skill this format needs.',
  ],
  [
    'Hospital medicine',
    'You already translate discharge summaries into plain English for families, unpaid. Same work, defined scope, actually compensated.',
  ],
  [
    'Cardiology',
    'Prevention is the part of cardiology that never fits the clinic slot — it is a records-and-risk conversation, not a procedure. Async fits it better than fifteen minutes does.',
  ],
]

const MECHANICS = [
  [
    'You set the scope',
    'Which question types you take, how many patients, and what you decline. The intake enforces it.',
  ],
  [
    'Cases arrive assembled',
    'Each one is a structured record with the source documents already read: summary, considerations, open questions, and the gaps.',
  ],
  [
    'You review on your own schedule',
    'Between shifts, at 6am, whenever. The queue holds; the patient sees an expected-response window.',
  ],
  [
    'You edit and send',
    'Correct the record, write the patient-facing reply in your own voice, send. Documentation is generated from what you approved.',
  ],
]

const OBJECTIONS = [
  [
    'Am I signing off on something a model wrote?',
    'You are editing a draft, the way you would edit a resident’s note. The draft is structured to surface what it does not know — its open-questions and data-gaps sections are usually the most useful part. If it is wrong, you delete it. Nothing is sent until you send it.',
  ],
  [
    'What about liability?',
    'You are practising medicine and the same standards apply. What changes is that the scope is narrow and written down, the full record of what you saw and wrote is preserved, and there is no unreviewed automated output in the chain. Licensure and malpractice cover are yours; the platform does not alter them.',
  ],
  [
    'How much time does this take?',
    'The assembly — reading a long record, pulling out the relevant history, drafting a plain-language explanation — is the part that is automated. What is left is the judgment, which is fast when you already know the medicine.',
  ],
  [
    'What if a case does not belong in async care?',
    'You say so and route it. Recognising that is a clinical decision, and the intake surfaces time-sensitive presentations up front rather than burying them.',
  ],
]

export function ForPhysicians() {
  return (
    <>
      {/* Audience-change band. */}
      <section className="border-b border-ink bg-ink">
        <Container className="py-12 lg:py-16">
          <div className="max-w-measure">
            <p className="font-mono text-micro uppercase tracking-label text-dune">
              For physicians
            </p>
            <h1 className="mt-4 text-display-sm text-sandstone sm:text-display">
              Your expertise has a market. Your calendar has no room for it.
            </h1>
            <p className="mt-5 text-body-lg text-dune">
              AuricleHealth lets shift-based specialists run a small cash-pay panel asynchronously.
              If you work shifts you already have the two things a panel needs: specialty judgment,
              and hours that are unusable for scheduled clinical work. What you do not have is a way
              to charge for the first using the second.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button as="link" to="/demo/physician" variant="onDark">
                See the review dashboard
              </Button>
              <a
                href="#objections"
                className="text-meta text-dune underline decoration-umber underline-offset-4 transition-colors hover:text-sandstone hover:decoration-dune"
              >
                The obvious objections
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-dune">
        <Container className="py-12 lg:py-14">
          <SectionRule label="Who this fits" as="h2" />
          <dl className="mt-8 grid gap-x-12 gap-y-7 lg:grid-cols-3">
            {FITS.map(([role, body]) => (
              <div key={role} className="border-t-2 border-oxblood pt-4">
                <dt className="text-meta font-medium text-ink">{role}</dt>
                <dd className="mt-2 text-meta leading-relaxed text-umber">{body}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="border-b border-dune bg-sandstone-raised">
        <Container className="py-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:gap-16">
            <div>
              <SectionRule label="What running a panel looks like" as="h2" />
              <ol className="mt-8 space-y-6">
                {MECHANICS.map(([title, body], i) => (
                  <li key={title} className="grid grid-cols-[2.25rem_1fr] gap-x-3">
                    <span aria-hidden="true" className="font-mono text-micro leading-6 text-oxblood">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="doc-rule">
                      <p className="text-meta font-medium text-ink">{title}</p>
                      <p className="mt-1.5 max-w-measure text-meta leading-relaxed text-umber">
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-4">
              <CaseSheet>
                <SheetHeader label="Panel economics" title="Target operating model" />
                <SheetBody className="space-y-6">
                  <Stat value="6–8" label="Patients on a panel run alongside a full clinical schedule" />
                  <Stat value="~25 min" label="Median physician time per case, with the record pre-assembled" />
                  <Stat value="0" label="Prior authorisations, billing codes, or RVU targets" />
                </SheetBody>
              </CaseSheet>

              <Annotation>
                Assumptions, not measured results. Panel size and per-case time are the two numbers a
                pilot would need to validate first.
              </Annotation>
            </div>
          </div>
        </Container>
      </section>

      <section id="objections" className="border-b border-dune scroll-mt-20">
        <Container className="py-12 lg:py-14">
          <SectionRule label="The obvious objections" as="h2" />
          <dl className="mt-8 max-w-prose divide-y divide-dune border-t border-dune">
            {OBJECTIONS.map(([q, a]) => (
              <div key={q} className="py-6">
                <dt className="text-subtitle font-medium text-ink">{q}</dt>
                <dd className="mt-2.5 text-body leading-relaxed text-umber">{a}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 max-w-prose">
            <AiDraftBadge size="block" />
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center lg:gap-16">
            <div>
              <h2 className="text-title">
                The fastest way to judge this is to review a case yourself.
              </h2>
              <p className="mt-4 max-w-measure text-body leading-relaxed text-ink-muted">
                Paste in a synthetic case, let the record assemble, then sit in the reviewing seat and
                decide whether it saved you time or wasted it.
              </p>
              <Button as="link" to="/demo" variant="primary" className="mt-7">
                Open the demo
              </Button>
            </div>

            <MetaList className="border-t border-dune lg:border-l lg:border-t-0 lg:pl-10">
              <MetaRow label="Recruitment" tone="muted">
                Not open. This is a prototype and is not signing physicians.
              </MetaRow>
              <MetaRow label="Credentialling" tone="muted">
                No verification, licensure check, or malpractice process exists in this build.
              </MetaRow>
            </MetaList>
          </div>
        </Container>
      </section>
    </>
  )
}
