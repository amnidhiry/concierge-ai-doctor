import {
  ExampleCase,
  FinalCta,
  Hero,
  PatientQuestions,
  ProcessAndBoundaries,
  WhatYouReceive,
  WhoReviews,
} from '../components/marketing/sections.jsx'

/**
 * Patient-first homepage.
 *
 * Composed rather than authored: each section is its own component in
 * components/marketing/sections.jsx, so the page reads as a sequence and the
 * order is easy to change.
 *
 * What changed from the previous version, and why:
 *
 * - The physician business model (shift-based doctors running cash-pay panels) is
 *   gone from here entirely and now lives on /for-physicians. A patient landing
 *   on this page should understand the promise without being told how the supply
 *   side works.
 * - The three-stat row, the three value cards, the four-step grid, and the
 *   six-specialty list are removed. They restated each other and produced the
 *   generic problem/benefits/steps/CTA sequence.
 * - `Reveal` scroll animation is not used on this page. Twenty fade-ups was the
 *   motion doing decorative work; the composition holds without it, and less
 *   motion suits a clinical surface.
 */
export function Landing() {
  return (
    <>
      <Hero />
      <ExampleCase />
      <WhoReviews />
      <WhatYouReceive />
      <PatientQuestions />
      <ProcessAndBoundaries />
      <FinalCta />
    </>
  )
}
