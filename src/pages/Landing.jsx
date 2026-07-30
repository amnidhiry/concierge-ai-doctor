import { Badge, Button, Card, Container, Eyebrow, SectionHeading, Stat } from '../components/ui/primitives.jsx'
import { AiDraftBadge } from '../components/ui/AiDraftBadge.jsx'
import { Reveal } from '../components/ui/Reveal.jsx'

const STEPS = [
  {
    n: '01',
    title: 'Patient submits, in their own words',
    body: 'A short conversational intake plus whatever records they already have — a lipid panel, a calcium score report, a wall of text from a portal. No forms to decode.',
  },
  {
    n: '02',
    title: 'AI assembles the case',
    body: 'The model reads the intake and the records and produces a structured draft: what this case is, what the differential considerations are, and — most usefully — what is missing and what the physician should ask.',
  },
  {
    n: '03',
    title: 'Physician reviews and edits',
    body: 'The draft lands in a review queue between shifts. The physician corrects it, deletes what is wrong, and sends. Nothing reaches the patient unreviewed.',
  },
  {
    n: '04',
    title: 'Patient gets a real answer',
    body: 'A plain-language response from a named physician, with the reasoning attached — not a portal message telling them to schedule an appointment.',
  },
]

const SPECIALTIES = [
  {
    name: 'Lipids & Lp(a)',
    note: 'ApoB, Lp(a), discordant panels, statin decisions and intolerance',
  },
  {
    name: 'Coronary calcium',
    note: 'CAC scores, percentile context, what a zero score does and does not rule out',
  },
  {
    name: 'Premature family history',
    note: 'A parent or sibling with an early event, and what to actually test',
  },
  {
    name: 'Blood pressure',
    note: 'Home-reading interpretation, resistant hypertension, post-pre-eclampsia risk',
  },
  {
    name: 'Metabolic risk',
    note: 'Insulin resistance, A1c trends, visceral adiposity, lipid interaction',
  },
  {
    name: 'Secondary prevention',
    note: 'Post-MI or post-stent targets, when to intensify therapy',
  },
]

function HeroPreview() {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-dune bg-dune/30 px-4 py-3">
        <p className="field-label">Cardiology queue · case pt-2284</p>
        <Badge tone="pulse">Waiting 41m</Badge>
      </div>
      <div className="space-y-4 p-5">
        <AiDraftBadge size="block" />
        <div>
          <p className="field-label">One-line summary</p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">
            61M with a coronary calcium score of 240, reluctant to start a statin and asking what
            the number actually means for him.
          </p>
        </div>
        <div className="hairline pt-4">
          <p className="field-label">Open questions for you</p>
          <ul className="mt-2 space-y-2 text-[15px] leading-relaxed text-ink-muted">
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-draft" />
              Confirm the age/sex percentile — the report gives an absolute score only.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-draft" />
              No ApoB or Lp(a) in the record. Worth having before the statin conversation?
            </li>
          </ul>
        </div>
      </div>
    </Card>
  )
}

export function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-dune">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-pulse-wash/70 to-transparent"
        />
        <Container className="relative py-16 sm:py-24">
          <div className="grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <Eyebrow tone="pulse">Asynchronous preventative cardiology</Eyebrow>
              <h1 className="mt-4 text-balance font-display text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-[3.5rem]">
                The specialist read your chart. Not a portal message telling you to book an
                appointment.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-umber">
                AuricleHealth lets shift-based physicians run small cash-pay panels between
                shifts. AI handles triage, chart synthesis, and documentation. The physician handles
                judgment — and signs every response.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button as="link" to="/demo" variant="primary">
                  Walk through a real case
                </Button>
                <Button as="link" to="/for-physicians" variant="outline">
                  I'm a physician
                </Button>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-dune pt-8">
                <Stat value="6–8" label="Patients on a typical starting panel" />
                <Stat value="<48h" label="Target turnaround, asynchronous" />
                <Stat value="100%" label="Responses physician-reviewed before send" />
              </div>
            </div>

            <Reveal delay={120} className="lg:pt-10">
              <HeroPreview />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Value prop */}
      <section className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="The problem"
              title="Serious health decisions get made in fifteen-minute slots, weeks apart."
              lede="A patient handed a risk number has questions that don't fit an appointment, and a physician with the expertise to answer them has no billable way to do it. The gap isn't clinical knowledge. It's the format."
            />
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Async is the right shape',
                body: 'A thoughtful written answer to "does this calcium score mean I have to take a statin" is worth more than a rushed visit — and it can be written at 10pm between shifts.',
              },
              {
                title: 'AI does the assembly, not the judgment',
                body: 'Reading a 40-page record and pulling out what matters is exactly what a model is good at. Deciding what to tell a frightened patient is not.',
              },
              {
                title: 'Cash-pay keeps it honest',
                body: 'No prior auth, no coding, no RVU math. A defined scope at a defined price, so the physician can spend the time the question actually needs.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 90}>
                <Card className="h-full p-6">
                  <h3 className="text-xl leading-snug text-ink">{item.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-umber">{item.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="border-y border-dune bg-sandstone-raised py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="How it works" title="Four steps, one of them human." />
          </Reveal>

          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 80}>
                <div className="flex gap-5">
                  <p className="font-mono text-sm text-pulse">{step.n}</p>
                  <div className="border-l border-dune pl-5">
                    <h3 className="text-xl leading-snug text-ink">{step.title}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-umber">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div className="mt-14 rounded-lg border border-draft/25 bg-draft-wash/60 p-6 sm:p-7">
              <AiDraftBadge />
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
                Every piece of AI output in the product carries this label until a physician has
                reviewed it — in the patient's view, in the physician's queue, and in the record.
                When the label changes to <span className="font-medium">physician reviewed</span>,
                a named clinician has taken responsibility for the content. That distinction is the
                product.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Specialties */}
      <section className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Specialties supported"
              title="Built for the specialties where the question is bigger than the visit."
              lede="Panels work best where patients face a decision with real stakes and a lot of documentation — and where the physician's day is already shift-shaped."
            />
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
            {SPECIALTIES.map((s, i) => (
              <Reveal key={s.name} delay={i * 60}>
                <div className="border-t border-dune py-5">
                  <p className="text-[17px] text-ink">{s.name}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-umber">{s.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="pb-8">
        <Container>
          <Reveal>
            <div className="rounded-xl bg-ink px-6 py-14 sm:px-12 sm:py-16">
              <div className="max-w-2xl">
                <Eyebrow tone="light">See it work</Eyebrow>
                <h2 className="mt-3 text-balance font-display text-3xl leading-tight text-sandstone sm:text-4xl">
                  Paste in a case and watch it move through the whole pipeline.
                </h2>
                <p className="mt-4 text-[17px] leading-relaxed text-dune-deep">
                  The demo runs a live synthesis call on whatever case material you provide — intake
                  to physician-reviewed reply. Use synthetic data only.
                </p>
                <Button as="link" to="/demo" variant="onDark" className="mt-8">
                  Open the demo
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
