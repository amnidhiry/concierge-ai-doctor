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
import { CarePacketSheet } from './CarePacketSheet.jsx'
import { AiDraftBadge } from '../ui/AiDraftBadge.jsx'
import { VISIT_MINUTES, VISIT_SCOPE } from '../../domain/models.js'

/**
 * Homepage sections.
 *
 * Composition notes, since they are the point of the design:
 *
 * - No section uses the eyebrow + oversized-serif-title + lede triple. Each one is
 *   named by a labelled rule and gets straight to content.
 * - Sections alternate between the full-width document grid and an asymmetric
 *   two-column split, so the page does not read as a stack of centered blocks.
 * - Content is grouped by rules and left-hung margins rather than by cards.
 * - The serif appears only in patient questions and the physician's philosophy.
 * - No stat row. Three big numbers with captions would be inventing metrics for a
 *   service that has not run.
 *
 * Content note: this page is patient-first throughout. How the business works —
 * that physicians are the paying customers — is on /for-physicians, because a
 * patient reading this page needs to understand one call, not a revenue model.
 */

/* ---------------------------------------------------------------- 1. Hero -- */

export function Hero() {
  return (
    <section className="border-b border-dune">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:items-start lg:gap-14">
          <div className="max-w-measure">
            <p className="sheet-label">Preventive cardiology</p>

            <h1 className="mt-4 text-display-sm sm:text-display">
              {VISIT_MINUTES.min}–{VISIT_MINUTES.max} minutes on the phone with a preventive
              cardiologist who has already read your file.
            </h1>

            <p className="mt-5 text-body-lg text-ink-muted">
              You send your question and whatever results you have. The physician reads it before you
              speak. Then you have one scheduled call — long enough to actually get through it, and
              you leave with a written summary and a note for your own doctor.
            </p>

            <p className="mt-4 max-w-note text-body text-umber">
              One call. Not a subscription, not a message thread, and not a replacement for your own
              doctor.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button as="link" to="/demo" variant="primary">
                Book a call
              </Button>
              <Link
                to="/the-visit"
                className="text-meta text-umber underline decoration-dune-deep underline-offset-4 transition-colors hover:text-ink hover:decoration-pulse"
              >
                What the call covers
              </Link>
            </div>
          </div>

          <div className="lg:pt-2">
            <CarePacketSheet />
          </div>
        </div>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------- 2. Example visit -- */

const VISIT_STAGES = [
  {
    n: '01',
    label: 'You book, and answer some questions',
    body: 'Pick a time, then an intake assistant asks what brought you here and what results you have. It is the part that would otherwise eat the first ten minutes of the call.',
  },
  {
    n: '02',
    label: 'The physician reads your file first',
    body: 'Software assembles what your material states, where each fact came from, and what it does not contain. It decides nothing. The physician reads that against your actual documents.',
  },
  {
    n: '03',
    label: 'You talk, for as long as the slot',
    body: `A ${VISIT_MINUTES.min}–${VISIT_MINUTES.max} minute voice call. No camera, nothing recorded. They already know the file, so the time goes on your questions.`,
  },
  {
    n: '04',
    label: 'You get it in writing',
    body: 'A plain-language summary of what was said, and a clinical note you can hand to your own doctor. The physician edits and approves both before you see them.',
  },
]

export function ExampleVisit() {
  return (
    <section className="border-b border-dune bg-sandstone-raised">
      <Container className="py-12 lg:py-16">
        <SectionRule label="One complete visit" />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
          {/* Left: the narrative arc, on a document grid. */}
          <div>
            <h2 className="text-title">
              From a number nobody explained, to a conversation and something in writing.
            </h2>
            <p className="mt-4 max-w-measure text-body text-ink-muted">
              This is the calcium-score case from the sheet above, carried through. Nothing in the
              sequence happens without the cardiologist.
            </p>

            <ol className="mt-8 space-y-6">
              {VISIT_STAGES.map((stage) => (
                <li key={stage.n} className="grid grid-cols-[2.25rem_1fr] gap-x-3">
                  <span aria-hidden="true" className="font-mono text-micro leading-6 text-oxblood">
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

          {/* Right: what the patient is left holding, as a document. */}
          <div className="space-y-4">
            <CaseSheet as="article">
              <SheetHeader
                label="Patient summary · case pt-2284"
                title="Approved by Dr. Imani Reyes"
                aside={<StatusLabel tone="verified">Physician approved</StatusLabel>}
              />
              <SheetBody className="space-y-4">
                <p className="text-body leading-relaxed text-ink">
                  We talked about your calcium score of 240. It is a real finding, and your GP is not
                  wrong to have raised a statin — but I would not settle the question yet.
                </p>
                <p className="text-body leading-relaxed text-ink">
                  Two values are missing that would change the target and the urgency: an ApoB and an
                  Lp(a). Your calcium report also gives a percentile without saying which population
                  it compared you against, which matters more than it sounds.
                </p>
                <p className="text-body leading-relaxed text-ink">
                  So: ask your GP for those two blood tests, and ask the imaging centre for the full
                  report. Take the note below with you. If the Lp(a) comes back high, that is the
                  point to ask about seeing a lipid specialist.
                </p>
              </SheetBody>
              <SheetFooter>
                <MetaList>
                  <MetaRow label="Call length">27 minutes, voice</MetaRow>
                  <MetaRow label="Read beforehand" tone="muted">
                    CAC report · lipid panel · family history
                  </MetaRow>
                  <MetaRow label="Also provided" tone="muted">
                    Clinical note for the patient's own clinician
                  </MetaRow>
                </MetaList>
              </SheetFooter>
            </CaseSheet>

            <Annotation>
              Illustrative. Written for this prototype — not a real patient, a real call, or a real
              clinical opinion.
            </Annotation>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------- 3. Who you speak to -- */

export function WhoYouSpeakTo() {
  return (
    <section className="border-b border-dune">
      <Container className="py-12 lg:py-16">
        <SectionRule label="Who you speak to" />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-16">
          <PhysicianIdentity
            name="Dr. Imani Reyes"
            credential="MD · Preventive cardiology"
            registration="Registration number — to be supplied"
            focus={['Lipids and Lp(a)', 'Coronary calcium', 'Premature family history']}
            philosophy="Most of the people I speak to do not need a new test. They need someone to read the ones they already have, in order, against their actual history — and twenty-five minutes to say it out loud."
            // Gitignored and not in the repo — a fresh clone renders the document
            // photo slot instead. See .gitignore for why, and for how to ship a
            // properly licensed portrait.
            photoUrl="/dr-imani-reyes.jpg"
            photoAlt="Portrait of Dr. Imani Reyes"
            // `placeholder` stays set: Imani Reyes is a fictional persona, and this
            // marker is what stops a real-looking portrait from making invented
            // credentials read as verified.
            placeholder
          />

          <div className="lg:border-l lg:border-dune lg:pl-10">
            <h2 className="text-title">One named physician, on the call and on the record</h2>
            <p className="mt-4 text-body leading-relaxed text-ink-muted">
              A licensed physician takes the call and approves everything written afterwards under
              their own name. Software assembles your material and flags what is missing from it; it
              does not form the opinion, it does not speak to you, and it does not approve anything.
            </p>
            <p className="mt-4 text-body leading-relaxed text-ink-muted">
              If your question needs an examination, imaging, or an in-person appointment, they will
              say so on the call rather than answer around it.
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
    label: 'The call itself',
    detail: `${VISIT_MINUTES.min}–${VISIT_MINUTES.max} minutes of a preventive cardiologist's attention, by voice, with your file already read.`,
  },
  {
    label: 'A plain-language summary',
    detail:
      'What was discussed, what the physician said about it, and what to do next. Written for you, approved by them.',
  },
  {
    label: 'A clinical note',
    detail:
      "In clinical language, for your own doctor. The document that makes the call useful after it ends.",
  },
  {
    label: 'What your records are missing',
    detail:
      'Specific gaps — a named test, an unrecorded date, an age at a family event — and why each one matters.',
  },
]

export function WhatYouReceive() {
  return (
    <section className="border-b border-dune bg-sandstone-raised">
      <Container className="py-12 lg:py-16">
        <SectionRule label="What you leave with" />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h2 className="text-title">A conversation, and two documents that outlast it.</h2>
            <p className="mt-4 max-w-measure text-body leading-relaxed text-ink-muted">
              The point of writing it down is that a call you cannot remember in a fortnight was worth
              very little. One document is for you; the other is for whoever manages your care.
            </p>
          </div>

          {/* Rendered as the contents page of a document rather than as feature
              cards. */}
          <CaseSheet>
            <SheetHeader label="Contents" title="One expert-opinion visit" />
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
        <SectionRule label="What people book this call about" as="h2" />

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

export function ProcessAndBoundaries() {
  return (
    <section className="border-b border-dune bg-sandstone-raised">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionRule label="Why one call works" as="h2" />
            <div className="mt-6 max-w-measure space-y-4">
              <p className="text-body leading-relaxed text-ink-muted">
                The reason a fifteen-minute appointment fails at prevention is not the fifteen
                minutes. It is that the clinician is reading your file for the first time while you
                sit there.
              </p>
              <p className="text-body leading-relaxed text-ink-muted">
                So the reading happens first, and the physician arrives knowing what your records
                state, where each figure came from, and what is missing from them. That is what makes
                twenty-five minutes enough to be worth having.
              </p>
              <p className="text-body leading-relaxed text-ink-muted">
                And it is deliberately one call. A single well-prepared conversation is a thing a
                specialist can actually deliver — which is why it is worth booking, and why we are not
                promising to be your cardiologist.
              </p>
            </div>
          </div>

          <div>
            <SectionRule label="What this is not" as="h2" />
            <ul className="mt-6 divide-y divide-dune">
              {VISIT_SCOPE.excludes.map((item) => {
                const [term, detail] = item.split(' — ')
                return (
                  <li key={item} className="py-3.5 first:pt-0">
                    <p className="text-meta font-medium text-ink">{term}</p>
                    {detail && (
                      <p className="mt-1 max-w-measure text-meta leading-relaxed text-umber">
                        {detail}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="mt-5 max-w-measure text-meta leading-relaxed text-umber">
              Chest pain, breathlessness, or faintness needs an emergency department today, not a call
              booked for Thursday. The intake stops and says so if it detects one.
            </p>
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
          <h2 className="text-display-sm">Book the call.</h2>
          <p className="mx-auto mt-4 max-w-note text-body leading-relaxed text-ink-muted">
            Send your question and your results. A preventive cardiologist reads them, then spends{' '}
            {VISIT_MINUTES.min}–{VISIT_MINUTES.max} minutes on the phone with you. If your question is
            not one this visit should answer, they will tell you that instead.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Button as="link" to="/demo" variant="primary">
              Book a call
            </Button>
            <Link
              to="/the-visit"
              className="text-meta text-umber underline decoration-dune-deep underline-offset-4 transition-colors hover:text-ink hover:decoration-pulse"
            >
              What it covers
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
