import {
  ExampleVisit,
  FinalCta,
  Hero,
  PatientQuestions,
  ProcessAndBoundaries,
  WhatYouReceive,
  WhoYouSpeakTo,
} from '../components/marketing/sections.jsx'

/**
 * Patient-first homepage.
 *
 * Composed rather than authored: each section is its own component in
 * components/marketing/sections.jsx, so the page reads as a sequence and the order
 * is easy to change.
 *
 * Two things this page deliberately does not do:
 *
 * - It does not explain the business model. Physicians are the paying customers,
 *   and that belongs on /for-physicians. A patient landing here needs to
 *   understand one call, not who is billed for the software behind it.
 * - It does not quote a price for the visit. There is no payment path in this
 *   build and no decided patient price, so a figure here would be invented.
 */
export function Landing() {
  return (
    <>
      <Hero />
      <ExampleVisit />
      <WhoYouSpeakTo />
      <WhatYouReceive />
      <PatientQuestions />
      <ProcessAndBoundaries />
      <FinalCta />
    </>
  )
}
