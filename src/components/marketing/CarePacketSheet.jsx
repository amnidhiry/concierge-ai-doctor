import {
  CaseSheet,
  MetaList,
  MetaRow,
  SheetBody,
  SheetFooter,
  StatusLabel,
} from '../case/CaseSheet.jsx'

/**
 * The hero artifact: the care packet the physician reads before the call.
 *
 * Not a floating dashboard mock. There is no chrome, no window bar, no drop shadow
 * suggesting it hovers, and no chart — it is a document, so it is built from rules
 * and aligned metadata.
 *
 * The two pieces of colour are the oxblood rule beside the missing-context block
 * and the "no score calculated" line, because those are the product's actual
 * argument: the value is in noticing what the record does not contain, and in
 * refusing to manufacture the number everyone wants.
 *
 * Content is illustrative rather than a real case. Marked as such in the footer.
 */
export function CarePacketSheet() {
  return (
    <CaseSheet as="article" className="max-w-[34rem]">
      {/* Sheet masthead — two rules, tight, like a form header. */}
      <div className="border-b border-ink px-5 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-micro uppercase tracking-label text-ink">
            Care packet · read before the call
          </p>
          <p className="font-mono text-micro uppercase tracking-label text-umber-light">
            30 min · voice
          </p>
        </div>
      </div>

      <SheetBody className="space-y-5">
        {/* The patient's question, in the serif — their words, set apart from the
            clinical apparatus around them. */}
        <div>
          <p className="sheet-label">What they want from the call</p>
          <blockquote className="mt-2">
            <p className="patient-voice">“My calcium score is 240. Do I need a statin?”</p>
          </blockquote>
        </div>

        <hr className="border-dune" />

        <MetaList>
          <MetaRow label="Records read">CAC report · lipid panel · family history</MetaRow>
          <MetaRow label="Supplied score">
            Agatston 240
            <span className="mt-0.5 block font-mono text-micro uppercase tracking-label text-umber-light">
              Chart: coronary calcium CT
            </span>
          </MetaRow>
        </MetaList>

        {/* The risk-score line. This is the claim that separates the product from
            a calculator, so it sits on the sheet rather than in a footnote. */}
        <div className="doc-rule-accent">
          <p className="font-mono text-micro uppercase tracking-label text-oxblood">
            Risk assessment
          </p>
          <p className="mt-2 text-meta leading-relaxed text-ink">
            No risk score calculated — the record has no ApoB, no Lp(a), and no confirmed smoking
            status, so no validated equation can be run on it. The Agatston score above is reported
            as supplied.
          </p>
        </div>

        {/* The missing-context block. */}
        <div className="doc-rule-accent">
          <p className="font-mono text-micro uppercase tracking-label text-oxblood">
            Ask on the call
          </p>
          <ul className="mt-2 space-y-1">
            {[
              'Has an ApoB ever been measured?',
              'Has an Lp(a) ever been measured — and has his brother been tested?',
              'Which reference population does the 78th percentile use?',
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
              Physician on the call · placeholder identity
            </p>
          </div>
          <StatusLabel tone="draft">AI-assembled · not an opinion</StatusLabel>
        </div>
      </SheetFooter>
    </CaseSheet>
  )
}
