import {
  CaseSheet,
  MetaList,
  MetaRow,
  SheetBody,
  SheetFooter,
  StatusLabel,
} from '../case/CaseSheet.jsx'

/**
 * The hero artifact: a refined clinical consultation sheet.
 *
 * Not a floating dashboard mock. There is no chrome, no window bar, no drop
 * shadow suggesting it hovers, and no chart or graph — it is a document, so it is
 * built from rules and aligned metadata. The one piece of colour is the oxblood
 * rule beside the missing-context block, because that block is the product's
 * actual argument: the value is in noticing what the record does not contain.
 *
 * Content is illustrative rather than a real case. Marked as such in the footer.
 */
export function SpecialistReviewSheet() {
  return (
    <CaseSheet as="article" className="max-w-[34rem]">
      {/* Sheet masthead — two rules, tight, like a form header. */}
      <div className="border-b border-ink px-5 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-micro uppercase tracking-label text-ink">
            Specialist review
          </p>
          <p className="font-mono text-micro uppercase tracking-label text-umber-light">
            Cardiology
          </p>
        </div>
      </div>

      <SheetBody className="space-y-5">
        {/* The patient's question, in the serif — their words, set apart from the
            clinical apparatus around them. */}
        <div>
          <p className="sheet-label">Patient question</p>
          <blockquote className="mt-2">
            <p className="patient-voice">
              “My calcium score is 240. Do I need a statin?”
            </p>
          </blockquote>
        </div>

        <hr className="border-dune" />

        <MetaList>
          <MetaRow label="Records reviewed">
            CAC report · lipid history (3 panels) · family history
          </MetaRow>
          <MetaRow label="Submitted" tone="muted">
            Today, 09:14
          </MetaRow>
        </MetaList>

        {/* The missing-context block. Oxblood rule and left-hung annotation —
            this is the one emphasised element on the sheet. */}
        <div className="doc-rule-accent">
          <p className="font-mono text-micro uppercase tracking-label text-oxblood">
            Important missing context
          </p>
          <ul className="mt-2 space-y-1">
            {[
              'ApoB — not measured',
              'Lp(a) — not measured',
              'Age/sex percentile — basis not stated on report',
            ].map((item) => (
              <li key={item} className="text-meta leading-relaxed text-ink">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </SheetBody>

      <SheetFooter>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div>
            <p className="text-meta font-medium text-ink">Dr. Imani Reyes</p>
            <p className="font-mono text-micro text-umber-light">
              Reviewing physician · placeholder identity
            </p>
          </div>
          <StatusLabel tone="draft">Awaiting physician review</StatusLabel>
        </div>
      </SheetFooter>
    </CaseSheet>
  )
}
