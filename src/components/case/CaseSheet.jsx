/**
 * Case-file primitives.
 *
 * The design language is a specialist's consultation sheet: a pale surface, thin
 * rules, compact metadata, and content hung off a document grid. These replace
 * the previous rounded-and-shadowed `Card` for anything clinical, so a case
 * artifact reads as a record rather than as a feature tile.
 *
 * Deliberately low on containers — most of these render rules and grids, not
 * boxes.
 */

/**
 * A document surface. `as` lets a sheet be an <article> or <aside> where that is
 * the correct semantics rather than always a <div>.
 */
export function CaseSheet({ children, className = '', as: Tag = 'div', tone = 'raised' }) {
  const tones = {
    raised: 'bg-sandstone-raised border-dune',
    sunk: 'bg-sandstone-sunk border-dune',
    plain: 'bg-transparent border-dune',
  }
  return (
    <Tag className={`border ${tones[tone]} shadow-sheet ${className}`}>{children}</Tag>
  )
}

/** Sheet header: a title line over a rule, with optional right-aligned status. */
export function SheetHeader({ label, title, aside, className = '' }) {
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-dune px-5 py-3.5 ${className}`}>
      <div className="min-w-0">
        {label && <p className="sheet-label">{label}</p>}
        {title && <p className="mt-1 text-subtitle font-medium text-ink">{title}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  )
}

export function SheetBody({ children, className = '' }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

export function SheetFooter({ children, className = '' }) {
  return (
    <div className={`border-t border-dune bg-sandstone/60 px-5 py-3 ${className}`}>{children}</div>
  )
}

/**
 * A label/value row on a document grid.
 *
 * Uses a definition list rather than a table: these are name–value pairs, not
 * tabular data, and <dl> gives screen readers the association without needing
 * headers. Label column is fixed so values align down the sheet.
 */
export function MetaList({ children, className = '' }) {
  return <dl className={`divide-y divide-dune/70 ${className}`}>{children}</dl>
}

export function MetaRow({ label, children, tone = 'default' }) {
  const valueTone = tone === 'muted' ? 'text-umber' : 'text-ink'
  return (
    <div className="grid gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[10.5rem_1fr]">
      <dt className="font-mono text-micro uppercase tracking-label text-umber-light">{label}</dt>
      <dd className={`text-meta leading-relaxed ${valueTone}`}>{children}</dd>
    </div>
  )
}

/**
 * A horizontal rule carrying a label, for naming a passage without an oversized
 * section introduction.
 *
 * `as` matters for accessibility, not looks. Where the rule is a section's only
 * name, it must be a real heading or screen-reader users navigating by heading
 * skip the section entirely — pass `as="h2"`. Where the section also has a
 * visible h2, leave it as the default paragraph so the outline doesn't gain a
 * duplicate level. Styling is identical either way.
 */
export function SectionRule({ label, className = '', as: Tag = 'p' }) {
  if (!label) return <hr className={`border-dune ${className}`} />
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Tag className="sheet-label shrink-0 font-normal">{label}</Tag>
      <hr className="flex-1 border-dune" aria-hidden="true" />
    </div>
  )
}

/**
 * Clinical status label. Squared, hairline-bordered, small — reads as a stamp on
 * a record rather than a pill on a dashboard.
 *
 * `draft` and `verified` intentionally match AiDraftBadge's palette so the
 * "pending physician review" signal stays consistent everywhere it appears.
 */
export function StatusLabel({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'border-dune-deep bg-sandstone text-umber',
    draft: 'border-draft/40 bg-draft-wash text-draft-deep',
    verified: 'border-verified/40 bg-verified-wash text-verified',
    oxblood: 'border-oxblood/35 bg-oxblood-wash text-oxblood',
    urgent: 'border-crimson/40 bg-crimson-wash text-crimson',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-micro uppercase tracking-label ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Marginal note. On wide screens it hangs in the margin beside its content; on
 * narrow screens it falls inline above, since there is no margin to hang in.
 */
export function Annotation({ children, className = '' }) {
  return (
    <p className={`annotation border-l border-oxblood/40 pl-3 ${className}`}>{children}</p>
  )
}
