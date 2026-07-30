import { Button, Container } from '../components/ui/primitives.jsx'
import {
  Annotation,
  CaseSheet,
  MetaList,
  MetaRow,
  SectionRule,
  SheetBody,
  SheetHeader,
  StatusLabel,
} from '../components/case/CaseSheet.jsx'

/**
 * Services and pricing.
 *
 * Restructured from three rounded feature cards into a tariff: each tier is a
 * document with its scope, inclusions, and — given how this is sold — an explicit
 * list of what it does not cover. For a cash-pay clinical service the exclusions
 * carry as much weight as the inclusions, so they sit on the document grid rather
 * than in small print under a "not included" caption.
 */

const TIERS = [
  {
    name: 'Navigation',
    price: '$50–75',
    unit: 'per episode',
    lede: 'One well-defined question, answered once. The entry point, and often all that is needed.',
    forWho: 'Someone holding a report they cannot read, or facing a single decision.',
    includes: [
      'One asynchronous question, one physician-reviewed answer',
      'Plain-language reading of a lipid panel, calcium score, or imaging report',
      'What to ask at the next appointment',
      'Referral direction — who to see, and how soon',
    ],
    excludes: ['Ongoing follow-up', 'Review across multiple records'],
    emphasis: false,
  },
  {
    name: 'Second Opinion',
    price: '$150–200',
    unit: 'per month',
    lede: 'A cardiologist reads the whole record and gives an independent view, with follow-up while the decision is live.',
    forWho: 'Someone in an active decision who wants a second read before committing.',
    includes: [
      'Full review of submitted records by a preventative cardiologist',
      'Structured written assessment: considerations, open questions, next steps',
      'Follow-up exchanges through the month as things develop',
      'One optional video visit',
    ],
    excludes: ['Prescribing', 'Ordering imaging or labs directly'],
    emphasis: true,
  },
  {
    name: 'Async Concierge',
    price: '$300–500',
    unit: 'per month',
    lede: 'A standing relationship with a physician who already knows the case. Ask anything; get a reviewed answer.',
    forWho: 'Someone managing long-running risk who is tired of re-explaining their history.',
    includes: [
      'Unlimited asynchronous questions, target under 48 hours',
      'Continuity — the same physician, history already loaded',
      'Proactive check-ins around results and treatment changes',
      'Video visits as needed',
      'Records kept organised between appointments',
    ],
    excludes: ['Emergency care', 'Anything requiring physical examination'],
    emphasis: false,
  },
]

function TierSheet({ tier }) {
  return (
    <CaseSheet as="article" className={tier.emphasis ? 'border-oxblood' : undefined}>
      <SheetHeader
        label={tier.name}
        title={
          <span className="flex items-baseline gap-2">
            <span className="text-title">{tier.price}</span>
            <span className="font-mono text-micro uppercase tracking-label text-umber-light">
              {tier.unit}
            </span>
          </span>
        }
        aside={tier.emphasis ? <StatusLabel tone="oxblood">Most common</StatusLabel> : null}
      />

      <SheetBody className="space-y-5">
        <p className="max-w-measure text-meta leading-relaxed text-ink-muted">{tier.lede}</p>

        <MetaList className="border-y border-dune">
          <MetaRow label="Best for" tone="muted">
            {tier.forWho}
          </MetaRow>
        </MetaList>

        <div>
          <p className="sheet-label">Includes</p>
          <ul className="mt-2.5 space-y-1.5">
            {tier.includes.map((item) => (
              <li key={item} className="grid grid-cols-[0.75rem_1fr] gap-x-2.5">
                <span aria-hidden="true" className="pt-1.5 text-oxblood">
                  <svg viewBox="0 0 12 12" className="h-2 w-2" fill="none">
                    <path
                      d="M1.5 6.2 4.4 9 10.5 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-meta leading-relaxed text-ink">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="doc-rule">
          <p className="sheet-label">Not covered</p>
          <ul className="mt-2 space-y-1">
            {tier.excludes.map((item) => (
              <li key={item} className="text-meta leading-relaxed text-umber">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Button
          as="link"
          to="/demo"
          variant={tier.emphasis ? 'primary' : 'outline'}
          className="w-full"
        >
          See this in the demo
        </Button>
      </SheetBody>
    </CaseSheet>
  )
}

export function Services() {
  return (
    <>
      <section className="border-b border-dune">
        <Container className="py-12 lg:py-14">
          <div className="max-w-measure">
            <p className="sheet-label">Services</p>
            <h1 className="mt-4 text-display-sm sm:text-display">
              Three tiers, priced so the specialist can afford to think.
            </h1>
            <p className="mt-5 text-body-lg text-ink-muted">
              Cash-pay. No insurance, no prior authorisation, no billing codes. Each tier defines a
              scope a physician can actually deliver — which is why the answers are worth paying for.
            </p>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-12">
          <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-5">
            {TIERS.map((tier) => (
              <TierSheet key={tier.name} tier={tier} />
            ))}
          </div>

          <Annotation className="mt-6 max-w-prose">
            Indicative pricing for this prototype. Nothing here is a live offer, and no payment is
            processed anywhere in this build.
          </Annotation>
        </Container>
      </section>

      <section className="border-t border-dune bg-sandstone-raised">
        <Container className="py-12 lg:py-14">
          <SectionRule label="Common to every tier" />
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <h2 className="text-title">A physician signs off. Always.</h2>
              <p className="mt-4 max-w-measure text-body leading-relaxed text-ink-muted">
                Software assembles the record; a licensed physician reviews it, edits it, and takes
                responsibility for what is sent. There is no tier where an unreviewed model response
                reaches a patient. That is not a difference between tiers — it is the floor.
              </p>
            </div>

            <dl className="divide-y divide-dune border-t border-dune">
              {[
                [
                  'Scope is explicit',
                  'Each tier states what it does not cover, in writing, before you buy.',
                ],
                [
                  'No emergency care',
                  'Asynchronous review is wrong for anything acute. Those cases are redirected, not held.',
                ],
                [
                  'Records stay yours',
                  'Anything submitted or produced can be exported and taken elsewhere.',
                ],
              ].map(([term, detail]) => (
                <div key={term} className="py-4">
                  <dt className="text-meta font-medium text-ink">{term}</dt>
                  <dd className="mt-1.5 max-w-measure text-meta leading-relaxed text-umber">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>
    </>
  )
}
