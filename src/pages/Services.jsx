import { Badge, Button, Card, Container, Eyebrow, SectionHeading } from '../components/ui/primitives.jsx'
import { Reveal } from '../components/ui/Reveal.jsx'

const TIERS = [
  {
    name: 'Navigation',
    price: '$50–75',
    unit: 'per episode',
    summary:
      'One well-defined question, answered once. The entry point — and often all a patient actually needs.',
    forWho: 'A patient holding a report they can\'t read, or facing one decision.',
    includes: [
      'One asynchronous question, one physician-reviewed answer',
      'Plain-language translation of a pathology, imaging, or lab report',
      'Guidance on what to ask at the next appointment',
      'Referral direction — who to see, and how urgently',
    ],
    excludes: ['Ongoing follow-up', 'Chart review across multiple records'],
    highlight: false,
  },
  {
    name: 'Second Opinion',
    price: '$150–200',
    unit: 'per month',
    summary:
      'A specialist reads the whole record and gives an independent read on the plan — with follow-up while the decision is live.',
    forWho:
      'A patient in an active treatment decision who wants a second set of eyes before committing.',
    includes: [
      'Full review of submitted records by a specialist in the relevant field',
      'Structured written assessment: considerations, open questions, next steps',
      'Follow-up exchanges through the month as the situation develops',
      'One optional video visit',
    ],
    excludes: ['Prescribing', 'Ordering imaging or labs directly'],
    highlight: true,
  },
  {
    name: 'Async AI Concierge',
    price: '$300–500',
    unit: 'per month',
    summary:
      'A standing relationship with a physician who already knows the case. Ask anything, any time, and get a reviewed answer.',
    forWho:
      'A patient managing something complex or long-running who is tired of re-explaining their history.',
    includes: [
      'Unlimited asynchronous questions with a target <48h turnaround',
      'Continuity — the same physician, with the case history already loaded',
      'Proactive check-ins around scans, results, and treatment milestones',
      'Video visits as needed',
      'Records organized and kept current between visits',
    ],
    excludes: ['Emergency care', 'Anything requiring physical examination'],
    highlight: false,
  },
]

function TierCard({ tier }) {
  return (
    <Card
      className={`flex h-full flex-col p-6 sm:p-7 ${
        tier.highlight ? 'border-pulse/40 shadow-lift ring-1 ring-pulse/15' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl leading-tight text-ink">{tier.name}</h3>
        {tier.highlight && <Badge tone="pulse">Most common</Badge>}
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <p className="font-display text-3xl text-ink">{tier.price}</p>
        <p className="font-mono text-xs uppercase tracking-label text-slate">{tier.unit}</p>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-slate">{tier.summary}</p>

      <div className="mt-5 rounded-md bg-mist/40 px-4 py-3">
        <p className="field-label">Best for</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{tier.forWho}</p>
      </div>

      <div className="mt-6 flex-1">
        <p className="field-label">Includes</p>
        <ul className="mt-3 space-y-2.5">
          {tier.includes.map((item) => (
            <li key={item} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-muted">
              <svg
                viewBox="0 0 14 14"
                aria-hidden="true"
                className="mt-1.5 h-3 w-3 shrink-0 text-pulse"
                fill="none"
              >
                <path
                  d="M2 7.4 5.2 10.5 12 3.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="field-label mt-6">Not included</p>
        <ul className="mt-3 space-y-2">
          {tier.excludes.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate">
              <span className="mt-2.5 h-px w-3 shrink-0 bg-mist-deep" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        as="link"
        to="/demo"
        variant={tier.highlight ? 'primary' : 'outline'}
        className="mt-7 w-full"
      >
        See this in the demo
      </Button>
    </Card>
  )
}

export function Services() {
  return (
    <>
      <section className="border-b border-mist bg-paper-raised py-16 sm:py-20">
        <Container>
          <Reveal>
            <div className="max-w-3xl">
              <Eyebrow tone="pulse">Services</Eyebrow>
              <h1 className="mt-4 text-balance font-display text-4xl leading-[1.1] text-ink sm:text-5xl">
                Three tiers, priced so the physician can afford to think.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate">
                Cash-pay, no insurance, no prior authorization. Each tier defines a scope the
                physician can actually deliver between shifts — which is why the answers are worth
                paying for.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 100} className="h-full">
                <TierCard tier={tier} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-14 grid gap-8 rounded-lg border border-mist bg-paper-raised p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <SectionHeading
                  eyebrow="What every tier shares"
                  title="A physician signs off. Always."
                />
                <p className="mt-4 text-[15px] leading-relaxed text-slate">
                  AI drafts; a licensed physician reviews, edits, and takes responsibility. There is
                  no tier where an unreviewed model response reaches a patient — that isn't a
                  feature difference, it's the floor.
                </p>
              </div>
              <div className="space-y-4 sm:border-l sm:border-mist sm:pl-8">
                {[
                  ['Scope is explicit', 'Each tier says what it does not cover, in writing.'],
                  [
                    'No emergency care',
                    'Async care is wrong for anything acute. Patients are routed, not held.',
                  ],
                  [
                    'Records stay portable',
                    'Everything submitted or produced can be exported by the patient.',
                  ],
                ].map(([title, body]) => (
                  <div key={title}>
                    <p className="text-[15px] font-medium text-ink">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
