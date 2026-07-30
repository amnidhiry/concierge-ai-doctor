import { Button, Container } from '../components/ui/primitives.jsx'
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
import { VISIT_MINUTES } from '../domain/models.js'

/**
 * The physician-facing page — and the commercial one.
 *
 * ── Who the customer is ────────────────────────────────────────────────────
 * Preventive-cardiology physicians are the paying customers. They subscribe to the
 * software; they charge their own patients for the visit, on their own terms, and
 * keep it. There is no revenue share, no per-visit cut, and no patient
 * subscription anywhere in the model. That is the single most important thing this
 * page has to say, because it is the thing a physician evaluating it will assume
 * otherwise.
 *
 * ── What this page replaced ────────────────────────────────────────────────
 * This is no longer a pitch for shift-based specialists to run small cash-pay
 * rosters of patients, and no longer carries the three-figure "panel economics"
 * block it used to. Every part of that described a different product: written
 * correspondence rather than a scheduled call, continuing care rather than bounded
 * episodic visits, and a platform taking patient revenue rather than selling
 * software. The figures were also invented measurements for a service that has not
 * run, so they are gone rather than restated.
 *
 * Kept the dark opening band: on this page the inversion marks an audience change
 * rather than decorating a marketing section.
 */

const PRICING = {
  low: 150,
  high: 300,
  callsToBreakEven: 'about two visits',
}

const WHAT_YOU_GET = [
  [
    'Booking and AI-assisted intake',
    'Your patient books a slot and answers an intake agent beforehand. What would have eaten the first ten minutes of your call is already done when you dial.',
  ],
  [
    'A care packet, before you speak',
    'What their material states, with a source on every claim, what it does not contain, and the questions worth asking while you have them on the phone. Three minutes to read.',
  ],
  [
    'The call itself',
    `Scheduled voice, ${VISIT_MINUTES.min}–${VISIT_MINUTES.max} minutes, in the browser. No app for the patient to install, no camera, nothing recorded.`,
  ],
  [
    'The write-up, drafted',
    'A clinical note, a plain-language summary for the patient, and a billing-code suggestion with its unmet conditions listed. You correct all three and approve them under your name.',
  ],
]

const OBJECTIONS = [
  [
    'Do you take a cut of what I charge?',
    'No. You pay a monthly software fee and nothing else. You set your own visit price, bill your own patients, and keep all of it. There is no per-visit fee, no revenue share, and no patient-side subscription — we are not in the middle of your relationship with your patient, and we do not want to be.',
  ],
  [
    'Am I approving something a model wrote?',
    'You are correcting a draft, the way you would correct a resident’s note. It is drafted from a transcript of your own call, and it is built to surface what the transcript does not establish — that gap list is usually the most useful part. If it is wrong you delete it. Nothing goes to the patient until you approve it.',
  ],
  [
    'What about liability?',
    'You are practising medicine and the same standards apply. What changes is that the scope is narrow and written down, the record of what you read and approved is preserved, and there is no unreviewed automated output in the chain. Licensure and malpractice cover are yours; software does not alter them.',
  ],
  [
    'How much of my time does one visit take?',
    `The reading — a long record, the relevant history, the plain-language write-up — is the part that is assisted. What is left is the ${VISIT_MINUTES.min}–${VISIT_MINUTES.max} minute call plus the time to check and approve the draft. We are not going to quote you a figure for the second part until real physicians have measured it.`,
  ],
  [
    'Why voice and not video?',
    'Because the visit is a conversation about a record, and video adds a consent and retention problem it does not need. Patients also reliably know how to take a phone call. Nothing is recorded either way.',
  ],
  [
    'What if a case does not belong in this visit?',
    'You say so and route it. Recognising that is a clinical decision, and the intake surfaces time-sensitive presentations up front rather than booking them a call for next week.',
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
              For preventive-cardiology physicians
            </p>
            <h1 className="mt-4 text-display-sm text-sandstone sm:text-display">
              Software for the expert-opinion visit you already wish you had time to do properly.
            </h1>
            <p className="mt-5 text-body-lg text-dune">
              AuricleHealth handles the booking, the intake, the pre-call reading, and the write-up for
              one bounded {VISIT_MINUTES.min}–{VISIT_MINUTES.max} minute preventive-cardiology
              consultation. You take the call and approve the notes. You set the price, you bill your
              patient, and you keep it — we sell you the software, not a share of your practice.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button as="link" to="/demo/visit" variant="onDark">
                See the physician view
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

      {/* Pricing. Stated plainly and early, because a physician evaluating a tool
          should not have to hunt for what it costs — and because the shape of the
          fee is the argument. */}
      <section className="border-b border-dune">
        <Container className="py-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-16">
            <div>
              <SectionRule label="What it costs you" as="h2" />
              <p className="mt-7 flex flex-wrap items-baseline gap-x-3">
                <span className="text-display text-ink">
                  ${PRICING.low}–{PRICING.high}
                </span>
                <span className="font-mono text-micro uppercase tracking-label text-umber-light">
                  per month
                </span>
              </p>
              <p className="mt-5 max-w-measure text-body leading-relaxed text-ink-muted">
                A flat monthly software subscription. Priced so that {PRICING.callsToBreakEven} a month
                covers it at a typical specialist consultation fee — which means the tool pays for
                itself early in the month and everything after that is yours.
              </p>
              <p className="mt-4 max-w-measure text-body leading-relaxed text-ink-muted">
                We do not touch patient payments. You charge what you charge, through whatever you
                already use, and we never see it.
              </p>
            </div>

            <MetaList className="border-t border-dune lg:border-l lg:border-t-0 lg:pl-10">
              <MetaRow label="You pay">
                A monthly subscription. Nothing per visit.
              </MetaRow>
              <MetaRow label="We take">
                No revenue share, no commission, no percentage of your fee.
              </MetaRow>
              <MetaRow label="Your patient pays">
                You, directly, at a price you set. There is no patient subscription.
              </MetaRow>
              <MetaRow label="Billing" tone="muted">
                The write-up includes a code suggestion with its unverified conditions listed. You
                decide what is correct and bill it yourself — nothing is submitted anywhere by us.
              </MetaRow>
            </MetaList>
          </div>

          <Annotation className="mt-8 max-w-prose">
            Indicative pricing for this prototype. Nothing here is a live offer, no subscription can
            be purchased, and no payment is processed anywhere in this build.
          </Annotation>
        </Container>
      </section>

      <section className="border-b border-dune bg-sandstone-raised">
        <Container className="py-12 lg:py-14">
          <SectionRule label="What the software does" as="h2" />
          <ol className="mt-8 grid gap-x-12 gap-y-7 lg:grid-cols-2">
            {WHAT_YOU_GET.map(([title, body], i) => (
              <li key={title} className="grid grid-cols-[2.25rem_1fr] gap-x-3">
                <span aria-hidden="true" className="font-mono text-micro leading-6 text-oxblood">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="doc-rule">
                  <p className="text-meta font-medium text-ink">{title}</p>
                  <p className="mt-1.5 max-w-measure text-meta leading-relaxed text-umber">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:gap-16">
            <div>
              <h3 className="text-title">And what it deliberately does not do</h3>
              <p className="mt-4 max-w-measure text-body leading-relaxed text-ink-muted">
                There is no message inbox, no patient panel to maintain, no follow-up queue, and no
                after-hours anything. One visit, bounded, then closed. That is a constraint on the
                product because it is the only version a specialist can deliver alongside a real
                clinical schedule — an inbox you are expected to answer is a second job.
              </p>
            </div>

            <CaseSheet>
              <SheetHeader label="Not in the product" title="By design, not backlog" />
              <SheetBody>
                <ul className="space-y-2">
                  {[
                    'A message inbox between visits',
                    'A roster of patients under your continuing care',
                    'Prescribing or e-prescribing',
                    'Ordering labs or imaging',
                    'Recording or transcribing calls',
                    'Claims submission',
                  ].map((item) => (
                    <li key={item} className="text-meta leading-relaxed text-umber">
                      {item}
                    </li>
                  ))}
                </ul>
              </SheetBody>
            </CaseSheet>
          </div>
        </Container>
      </section>

      <section id="objections" className="scroll-mt-20 border-b border-dune">
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
                The fastest way to judge this is to sit in the reviewing seat.
              </h2>
              <p className="mt-4 max-w-measure text-body leading-relaxed text-ink-muted">
                Run a synthetic case through it: read the care packet, take the call in two browser
                tabs, then correct and approve the write-up. Twenty minutes will tell you whether it
                saved you time or made work.
              </p>
              <Button as="link" to="/demo" variant="primary" className="mt-7">
                Open the demo
              </Button>
            </div>

            <MetaList className="border-t border-dune lg:border-l lg:border-t-0 lg:pl-10">
              <MetaRow label="Sign-up" tone="muted">
                Not open. This is a prototype and is not taking subscriptions.
              </MetaRow>
              <MetaRow label="Credentialling" tone="muted">
                No verification, licensure check, or malpractice process exists in this build.
              </MetaRow>
              <MetaRow label="Compliance" tone="muted">
                Not HIPAA/BAA-grade. Use synthetic case material only.
              </MetaRow>
            </MetaList>
          </div>
        </Container>
      </section>
    </>
  )
}
