import { Button, Container } from '../components/ui/primitives.jsx'
import {
  Annotation,
  CaseSheet,
  MetaList,
  MetaRow,
  SectionRule,
  SheetBody,
  SheetHeader,
} from '../components/case/CaseSheet.jsx'
import { VISIT_MINUTES, VISIT_SCOPE } from '../domain/models.js'

/**
 * What the visit covers.
 *
 * ── What this page replaced, and why ───────────────────────────────────────
 * This was `/services`: three priced tiers — a per-episode question, a monthly
 * second-opinion plan, a monthly concierge subscription with unlimited
 * asynchronous questions. Every one of those described a product this is not.
 * There is one bounded episodic visit, patients are not on a subscription, and
 * asynchronous physician correspondence does not exist here at all.
 *
 * It also carried patient prices. There is no payment path in this build and no
 * decided patient price, so quoting one was inventing a commercial fact. This page
 * therefore defines scope precisely and says nothing about cost — which is the
 * honest version, and for a clinical service the more useful half anyway.
 *
 * `/services` redirects here (see App.jsx) rather than 404ing.
 */

/** The one thing a scope page owes the reader: where the edges are. */
const EDGE_CASES = [
  [
    'If you need something urgently',
    'This is a scheduled call. Chest pain, pressure, breathlessness, faintness, or a suspected event needs an emergency department today. The intake stops and says so if it detects one, rather than booking you in for Thursday.',
  ],
  [
    'If your question needs an examination',
    'Anything requiring hands, a stethoscope, or a scan has to happen in person. The physician will say so on the call rather than working around it.',
  ],
  [
    'If you want a medication changed',
    'The physician cannot prescribe through this visit. They can tell you what they would consider and why, in a note you hand to the clinician who can prescribe.',
  ],
  [
    'If you want tests ordered',
    'Also not something this visit does. What you get instead is a specific list — which tests, and what each one would change — written down for your own doctor.',
  ],
  [
    'If you want ongoing care',
    'This is one call. There is no follow-up appointment, no messaging afterwards, and nobody here managing your risk over time. Your own doctor keeps doing that, which is the correct arrangement.',
  ],
  [
    'If a risk score is what you are after',
    'The physician will discuss your risk, but nothing here calculates a PREVENT or ASCVD score from an incomplete record. If your records already state a score it is reported as they state it; if they do not, you will be told which inputs are missing rather than given a number built out of assumptions.',
  ],
]

export function TheVisit() {
  return (
    <>
      <section className="border-b border-dune">
        <Container className="py-12 lg:py-14">
          <div className="max-w-measure">
            <p className="sheet-label">The visit</p>
            <h1 className="mt-4 text-display-sm sm:text-display">
              One call, {VISIT_MINUTES.min}–{VISIT_MINUTES.max} minutes, with the reading done
              beforehand.
            </h1>
            <p className="mt-5 text-body-lg text-ink-muted">
              A bounded expert-opinion visit in preventive cardiology. Everything it includes is on
              this page, and so is everything it does not — for a clinical service the second list
              carries as much weight as the first, so it is not in small print.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-dune bg-sandstone-raised">
        <Container className="py-12">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <CaseSheet as="article">
              <SheetHeader
                label="Included"
                title={`One expert-opinion visit`}
              />
              <SheetBody>
                <ul className="space-y-2.5">
                  {VISIT_SCOPE.includes.map((item) => (
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
              </SheetBody>
            </CaseSheet>

            <CaseSheet as="article" className="border-oxblood">
              <SheetHeader label="Not included" title="What this visit does not do" />
              <SheetBody>
                <ul className="space-y-2.5">
                  {VISIT_SCOPE.excludes.map((item) => (
                    <li key={item} className="doc-rule-accent py-0.5">
                      <span className="text-meta leading-relaxed text-ink">{item}</span>
                    </li>
                  ))}
                </ul>
              </SheetBody>
            </CaseSheet>
          </div>

          <Annotation className="mt-6 max-w-prose">
            No price is quoted anywhere on this site. This is a prototype with no payment processing
            of any kind, and the patient price has not been set — a figure here would be invented.
          </Annotation>
        </Container>
      </section>

      <section className="border-b border-dune">
        <Container className="py-12 lg:py-14">
          <SectionRule label="Where the edges are" as="h2" />
          <dl className="mt-8 max-w-prose divide-y divide-dune border-t border-dune">
            {EDGE_CASES.map(([term, detail]) => (
              <div key={term} className="py-5">
                <dt className="text-subtitle font-medium text-ink">{term}</dt>
                <dd className="mt-2 text-body leading-relaxed text-umber">{detail}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="bg-sandstone-raised">
        <Container className="py-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <h2 className="text-title">A physician approves everything. Always.</h2>
              <p className="mt-4 max-w-measure text-body leading-relaxed text-ink-muted">
                Software assembles the record and drafts the write-up; a licensed physician takes the
                call, corrects the draft, and puts their name on what you receive. There is no path
                through this product where unreviewed model output reaches a patient. That is not a
                feature of one tier — it is the floor.
              </p>

              <Button as="link" to="/demo" variant="primary" className="mt-7">
                Book a call
              </Button>
            </div>

            <MetaList className="border-t border-dune">
              <MetaRow label="Format" tone="muted">
                Voice only. No camera, no recording, no transcription.
              </MetaRow>
              <MetaRow label="Length" tone="muted">
                {VISIT_MINUTES.min}–{VISIT_MINUTES.max} minutes, scheduled.
              </MetaRow>
              <MetaRow label="Preparation" tone="muted">
                AI-assisted intake, plus a care packet the physician reads before you speak.
              </MetaRow>
              <MetaRow label="Afterwards" tone="muted">
                A plain-language summary and a clinical note, both physician-approved. Then the visit
                is complete.
              </MetaRow>
              <MetaRow label="Your records" tone="muted">
                Anything submitted or produced can be exported and taken elsewhere.
              </MetaRow>
              <MetaRow label="This build" tone="muted">
                A prototype. Not in clinical use, not accepting patients, and not HIPAA/BAA-grade
                infrastructure.
              </MetaRow>
            </MetaList>
          </div>
        </Container>
      </section>
    </>
  )
}
