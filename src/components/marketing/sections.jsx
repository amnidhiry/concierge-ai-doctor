import { Link } from 'react-router-dom'
import { Button, Container } from '../ui/primitives.jsx'
import {
  Annotation,
  CaseSheet,
  MetaList,
  MetaRow,
  SectionRule,
  SheetBody,
  SheetFooter,
  SheetHeader,
  StatusLabel,
} from '../case/CaseSheet.jsx'
import { PhysicianIdentity } from '../case/PhysicianIdentity.jsx'
import { SpecialistReviewSheet } from './SpecialistReviewSheet.jsx'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'

/**
 * Homepage sections.
 *
 * Composition notes, since they are the point of the redesign:
 *
 * - No section uses the old eyebrow + oversized-serif-title + lede triple. Each
 *   one is named by a labelled rule and gets straight to content.
 * - Sections alternate between the full-width document grid and an asymmetric
 *   two-column split, so the page does not read as a stack of centered blocks.
 * - Content is grouped by rules and left-hung margins rather than by cards.
 * - The serif appears only in patient questions, the physician's philosophy, and
 *   one pull quote.
 */

/* ---------------------------------------------------------------- 1. Hero -- */

export function Hero() {
  return (
    <section className="border-b border-dune">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:items-start lg:gap-14">
          <div className="max-w-measure">
            <p className="sheet-label">Preventative cardiology</p>

            <h1 className="mt-4 text-display-sm sm:text-display">
              Understand what your records mean—before your next decision.
            </h1>

            <p className="mt-5 text-body-lg text-ink-muted">
              Send your question, test results, and relevant history. A specialist reviews the
              complete picture and sends a considered written response within 48 hours.
            </p>

            <p className="mt-4 max-w-note text-body text-umber">
              The specialist read your chart. Not a portal message telling you to book an
              appointment.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button as="link" to="/demo" variant="primary">
                Start a specialist review
              </Button>
              <Link
                to="/for-physicians"
                className="text-meta text-umber underline decoration-dune-deep underline-offset-4 transition-colors hover:text-ink hover:decoration-pulse"
              >
                For physicians
              </Link>
            </div>
          </div>

          <div className="lg:pt-2">
            <SpecialistReviewSheet />
          </div>
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------- 2. Example case -- */

const CASE_STAGES = [
  {
    n: '01',
    label: 'Patient submits',
    body: 'A written question plus whatever records exist — a calcium score report, three years of lipid panels, a note about a parent’s heart attack.',
  },
  {
    n: '02',
    label: 'Records are assembled',
    body: 'Software reads the material and lays out what it contains, what it does not, and which values the reviewing physician will need to confirm. It does not decide anything.',
  },
  {
    n: '03',
    label: 'Specialist reviews',
    body: 'A cardiologist reads the assembled record against the source documents, corrects what is wrong, and writes the response in their own words.',
  },
  {
    n: '04',
    label: 'Response sent',
    body: 'A written answer under a named physician, with the reasoning attached and the open questions stated plainly.',
  },
]

export function ExampleCase() {
  return (
    <section className="border-b border-dune bg-sandstone-raised">
      <Container className="py-12 lg:py-16">
        <SectionRule label="One complete case" />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
          {/* Left: the narrative arc, on a document grid. */}
          <div>
            <h2 className="text-title">
              From a question a patient could not get answered, to a response they could act on.
            </h2>
            <p className="mt-4 max-w-measure text-body text-ink-muted">
              This is the calcium-score case from the sheet above, carried through. Nothing in the
              sequence happens without the cardiologist.
            </p>

            <ol className="mt-8 space-y-6">
              {CASE_STAGES.map((stage) => (
                <li key={stage.n} className="grid grid-cols-[2.25rem_1fr] gap-x-3">
                  <span
                    aria-hidden="true"
                    className="font-mono text-micro leading-6 text-oxblood"
                  >
                    {stage.n}
                  </span>
                  <div className="doc-rule">
                    <p className="text-meta font-medium text-ink">{stage.label}</p>
                    <p className="mt-1.5 max-w-measure text-meta leading-relaxed text-umber">
                      {stage.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: the resulting response, as a document. */}
          <div className="space-y-4">
            <CaseSheet as="article">
              <SheetHeader
                label="Response · case pt-2284"
                title="Sent by Dr. Imani Reyes"
                aside={<StatusLabel tone="verified">Physician reviewed</StatusLabel>}
              />
              <SheetBody className="space-y-4">
                <p className="text-body leading-relaxed text-ink">
                  Your calcium score of 240 does put you in a higher-risk group than most men your
                  age, and it is a reasonable trigger for the conversation your GP started. It is
                  not, on its own, the whole answer.
                </p>
                <p className="text-body leading-relaxed text-ink">
                  Two things are missing from what you sent, and both would change my advice: an
                  ApoB and an Lp(a). Your report also gives a percentile without saying which
                  reference population it used, which matters more than it sounds.
                </p>
                <p className="text-body leading-relaxed text-ink">
                  I would get those two values before deciding about a statin — not instead of
                  deciding, but so the decision is made on the full picture. I have written to your
                  GP with the specific requests.
                </p>
              </SheetBody>
              <SheetFooter>
                <MetaList>
                  <MetaRow label="Turnaround">31 hours from submission</MetaRow>
                  <MetaRow label="Reviewed against" tone="muted">
                    CAC report · 3 lipid panels · family history
                  </MetaRow>
                </MetaList>
              </SheetFooter>
            </CaseSheet>

            <Annotation>
              Illustrative case. Written for this prototype, not a real patient or a real clinical
              opinion.
            </Annotation>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------- 3. Who reviews it -- */

export function WhoReviews() {
  return (
    <section className="border-b border-dune">
      <Container className="py-12 lg:py-16">
        <SectionRule label="Who reviews your case" />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-16">
          <PhysicianIdentity
            name="Dr. Imani Reyes"
            credential="MD · Preventative cardiology"
            registration="Registration number — to be supplied"
            focus={['Lipids and Lp(a)', 'Coronary calcium', 'Premature family history']}
            philosophy="Most of the people who write to me do not need a new test. They need someone to read the ones they already have, in order, against their actual history."
            placeholder
          />

          <div className="lg:border-l lg:border-dune lg:pl-10">
            <h2 className="text-title">One named physician, responsible for the answer</h2>
            <p className="mt-4 text-body leading-relaxed text-ink-muted">
              The response you receive is written and signed by the specialist who read your
              records. Software assembles the material and flags gaps; it does not form the opinion
              and it does not send anything.
            </p>
            <p className="mt-4 text-body leading-relaxed text-ink-muted">
              If the reviewing physician thinks your question needs an examination, imaging, or an
              in-person appointment, they will say so rather than answer around it.
            </p>

            <div className="mt-7">
              <AiDraftBadge size="block" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------ 4. What you receive -- */

const DELIVERABLE = [
  {
    label: 'Written response',
    detail:
      'Plain language, addressed to you, signed by the reviewing physician. Typically 300–600 words.',
  },
  {
    label: 'What the records show',
    detail:
      'The values and history the opinion rests on, listed so you can check them against your own documents.',
  },
  {
    label: 'What is missing',
    detail:
      'Specific gaps — a named test, an unrecorded date, an age at a family event — and why each one matters.',
  },
  {
    label: 'Open questions',
    detail:
      'The things the physician could not settle from the records, and what answering them would change.',
  },
  {
    label: 'Suggested next steps',
    detail:
      'Options to consider and discuss with your own doctor. Not prescriptions, and not instructions.',
  },
]

export function WhatYouReceive() {
  return (
    <section className="border-b border-dune bg-sandstone-raised">
      <Container className="py-12 lg:py-16">
        <SectionRule label="What you receive" />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h2 className="text-title">One document, structured the same way every time.</h2>
            <p className="mt-4 max-w-measure text-body leading-relaxed text-ink-muted">
              Not a chat transcript and not a summary. A record you can keep, re-read before an
              appointment, and hand to another clinician.
            </p>
          </div>

          {/* A structured deliverable, rendered as the contents page of a
              document rather than as five feature cards. */}
          <CaseSheet>
            <SheetHeader label="Contents" title="Specialist review document" />
            <SheetBody className="py-1">
              <MetaList>
                {DELIVERABLE.map((item) => (
                  <MetaRow key={item.label} label={item.label}>
                    {item.detail}
                  </MetaRow>
                ))}
              </MetaList>
            </SheetBody>
          </CaseSheet>
        </div>
      </Container>
    </section>
  )
}

/* --------------------------------------------------- 5. Patient questions -- */

const QUESTIONS = [
  {
    quote:
      'My father had a heart attack at 49 and I am 47. My cholesterol was called “fine” but nobody has actually looked at me.',
    meta: 'Age 47 · premature family history',
  },
  {
    quote:
      'I have tried two statins and both gave me muscle pain. My doctor said to try again in a few months. Is there anything else?',
    meta: 'Age 51 · statin intolerance',
  },
  {
    quote:
      'I paid for a calcium scan because a friend suggested it. Now I have a number and no idea what to do with it.',
    meta: 'Age 61 · incidental finding',
  },
]

export function PatientQuestions() {
  return (
    <section className="border-b border-dune">
      <Container className="py-12 lg:py-16">
        <SectionRule label="What people actually write in" as="h2" />

        <div className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((q) => (
            <figure key={q.meta} className="border-t-2 border-oxblood pt-4">
              <blockquote>
                <p className="patient-voice">“{q.quote}”</p>
              </blockquote>
              <figcaption className="mt-3 font-mono text-micro uppercase tracking-label text-umber-light">
                {q.meta}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-8 max-w-prose text-meta text-umber">
          Composite examples written for this prototype. No real correspondence is reproduced.
        </p>
      </Container>
    </section>
  )
}

/* ------------------------------------------- 6. Process and boundaries ------ */

const BOUNDARIES = [
  ['Not for anything urgent', 'Chest pain, breathlessness, fainting, or a suspected event needs an emergency department, not an asynchronous review. The intake stops and says so if it detects one.'],
  ['No prescribing', 'The reviewing physician does not issue prescriptions or order tests directly. They tell you and your own doctor what is worth considering.'],
  ['No examination', 'This is a records review. Anything that needs hands, a stethoscope, or a scan has to happen in person.'],
  ['Your own doctor stays central', 'This is a second read, written to be handed to the clinician who manages your care — not a replacement for them.'],
]

export function ProcessAndBoundaries() {
  return (
    <section className="border-b border-dune bg-sandstone-raised">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionRule label="How it works" as="h2" />
            <div className="mt-6 max-w-measure space-y-4">
              <p className="text-body leading-relaxed text-ink-muted">
                You write your question and attach what you have — reports, panels, a discharge
                summary, or just a description. An intake assistant asks follow-up questions to fill
                obvious gaps.
              </p>
              <p className="text-body leading-relaxed text-ink-muted">
                Your material is assembled into a structured record: what it contains, what it does
                not, and which values need confirming. A cardiologist reads that against your source
                documents, edits it, and writes the response.
              </p>
              <p className="text-body leading-relaxed text-ink-muted">
                You receive it within 48 hours, under their name.
              </p>
            </div>
          </div>

          <div>
            <SectionRule label="What this is not" as="h2" />
            <dl className="mt-6 divide-y divide-dune">
              {BOUNDARIES.map(([term, detail]) => (
                <div key={term} className="py-4 first:pt-0">
                  <dt className="text-meta font-medium text-ink">{term}</dt>
                  <dd className="mt-1.5 max-w-measure text-meta leading-relaxed text-umber">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ----------------------------------------------------------- 7. Final CTA -- */

export function FinalCta() {
  return (
    <section>
      <Container className="py-14 lg:py-20">
        <div className="mx-auto max-w-2xl border-y border-ink py-10 text-center">
          <h2 className="text-display-sm">Send your records and your question.</h2>
          <p className="mx-auto mt-4 max-w-note text-body leading-relaxed text-ink-muted">
            A cardiologist reads the whole picture and writes back within 48 hours. If your question
            is not one this service should answer, they will tell you that instead.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Button as="link" to="/demo" variant="primary">
              Start a specialist review
            </Button>
            <Link
              to="/services"
              className="text-meta text-umber underline decoration-dune-deep underline-offset-4 transition-colors hover:text-ink hover:decoration-pulse"
            >
              What it costs
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
