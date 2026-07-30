import { Button, Card, Container, Eyebrow, SectionHeading, Stat } from '../components/ui/primitives.jsx'
import { AiDraftBadge } from '../components/ui/AiDraftBadge.jsx'
import { Reveal } from '../components/ui/Reveal.jsx'

const FITS = [
  {
    role: 'Emergency medicine',
    body: 'You work in blocks. Between them you have hours that are useless for anything scheduled and fine for reviewing six written cases. Your triage instincts are exactly the skill this format needs.',
  },
  {
    role: 'Hospitalists',
    body: 'You already translate discharge summaries into plain English for families every day, unpaid. Same work, defined scope, actually compensated.',
  },
  {
    role: 'Oncologists',
    body: 'Second-opinion demand in oncology outstrips supply badly, and most of it is a records-review question. Async fits the work better than a clinic slot does.',
  },
]

const ECONOMICS = [
  ['6–8', 'Patients on a panel you can run alongside a full clinical schedule'],
  ['~25 min', 'Median physician time per reviewed case, with the draft pre-assembled'],
  ['0', 'Prior authorizations, billing codes, or RVU targets'],
]

const OBJECTIONS = [
  {
    q: 'Am I signing off on something a model wrote?',
    a: 'You are editing a draft, the same way you edit a resident\'s note. The draft is explicitly structured to surface what it does not know — its open-questions and data-gaps sections are usually the most useful part. If the draft is wrong, you delete it; nothing is sent until you send it.',
  },
  {
    q: 'What about liability?',
    a: 'You are practicing medicine and the same standards apply. What changes is that the scope is narrow and written down, the full record of what you saw and what you wrote is preserved, and there is no unreviewed automated output in the chain. Licensure and malpractice coverage are yours; the platform does not alter them.',
  },
  {
    q: 'How much time does this actually take?',
    a: 'The assembly work — reading a 40-page record, pulling out the relevant history, drafting a plain-language explanation — is what the model does. What is left is the judgment, which is the part that is fast when you already know the medicine.',
  },
  {
    q: 'What if a case does not belong in async care?',
    a: 'Then you say so and route it. Recognizing that is a clinical decision, and the intake is designed to surface time-sensitive findings up front rather than bury them.',
  },
]

export function ForPhysicians() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-mist bg-ink">
        <Container className="relative py-16 sm:py-24">
          <div className="max-w-3xl">
            <Eyebrow tone="light">For physicians</Eyebrow>
            <h1 className="mt-4 text-balance font-display text-4xl leading-[1.08] text-paper sm:text-5xl">
              Your expertise has a market. Your calendar doesn't have room for it.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-mist-deep">
              If you work shifts, you already have the two things an asynchronous panel needs: deep
              specialty judgment, and hours that are unusable for scheduled clinical work. What you
              don't have is a way to charge for the first using the second.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as="link" to="/demo/physician" variant="onDark">
                See the review dashboard
              </Button>
              <Button
                as="link"
                to="/services"
                variant="ghost"
                className="text-mist-deep hover:bg-ink-soft hover:text-paper"
              >
                Pricing tiers
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Who this fits"
              title="Shift-based specialists, mostly."
              lede="The format rewards physicians who are used to making decisions from a record rather than a relationship — and who have irregular blocks of time rather than a steady clinic."
            />
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FITS.map((fit, i) => (
              <Reveal key={fit.role} delay={i * 90}>
                <Card className="h-full p-6">
                  <p className="field-label text-pulse">{fit.role}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{fit.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-mist bg-paper-raised py-20 sm:py-24">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <SectionHeading
                eyebrow="The mechanics"
                title="What running a panel actually looks like."
              />
              <ol className="mt-8 space-y-6">
                {[
                  [
                    'You set the scope',
                    'Which specialties, which question types, how many patients, and what you will not take. The intake enforces it.',
                  ],
                  [
                    'Cases arrive pre-assembled',
                    'Each one shows up as a structured draft with the record already read: summary, considerations, open questions, data gaps.',
                  ],
                  [
                    'You review on your schedule',
                    'Between shifts, at 6am, whenever. The queue holds; the patient sees an expected-response window.',
                  ],
                  [
                    'You edit and send',
                    'Correct the draft, rewrite the patient-facing reply in your own voice, send. Documentation is generated from what you actually approved.',
                  ],
                ].map(([title, body], i) => (
                  <li key={title} className="flex gap-5">
                    <span className="font-mono text-sm text-pulse">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-[17px] text-ink">{title}</p>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-slate">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={120}>
              <Card className="p-6 sm:p-7">
                <p className="field-label">Panel economics</p>
                <div className="mt-6 space-y-7">
                  {ECONOMICS.map(([value, label]) => (
                    <Stat key={label} value={value} label={label} />
                  ))}
                </div>
                <div className="hairline mt-7 pt-6">
                  <p className="text-sm leading-relaxed text-slate">
                    Figures are the target operating model for this prototype, not measured
                    results. Panel size and per-case time are the two numbers a pilot needs to
                    validate first.
                  </p>
                </div>
              </Card>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="The obvious objections"
              title="Answered directly, because you'd ask anyway."
            />
          </Reveal>

          <div className="mt-12 max-w-prose space-y-0">
            {OBJECTIONS.map((item, i) => (
              <Reveal key={item.q} delay={i * 70}>
                <div className="border-t border-mist py-7">
                  <h3 className="text-xl leading-snug text-ink">{item.q}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate">{item.a}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150}>
            <div className="mt-12 max-w-prose">
              <AiDraftBadge size="block" />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="pb-8">
        <Container>
          <Reveal>
            <div className="rounded-xl border border-mist bg-paper-raised px-6 py-12 text-center sm:px-12">
              <h2 className="mx-auto max-w-xl text-balance font-display text-3xl leading-tight text-ink">
                The fastest way to judge this is to review a case yourself.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-slate">
                Paste in a synthetic case, let the model draft it, then sit in the physician's seat
                and decide whether the draft saved you time or wasted it.
              </p>
              <Button as="link" to="/demo" variant="primary" className="mt-8">
                Open the demo
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
