import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

/** Layout and control primitives shared by the marketing site and the demo. */

export function Container({ children, className = '', width = 'default' }) {
  const widths = {
    default: 'max-w-[76rem]',
    narrow: 'max-w-3xl',
    wide: 'max-w-[86rem]',
  }
  return (
    <div className={`mx-auto w-full ${widths[width]} px-5 sm:px-8 ${className}`}>{children}</div>
  )
}

export function Eyebrow({ children, tone = 'umber' }) {
  const tones = { umber: 'text-umber-light', pulse: 'text-pulse', light: 'text-dune' }
  return <p className={`font-mono text-micro uppercase tracking-label ${tones[tone]}`}>{children}</p>
}

/**
 * Buttons are squared to 2px, and sized off the meta scale so they sit as
 * controls rather than as marketing objects.
 */
const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-meta font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45'

const buttonVariants = {
  primary: 'bg-pulse text-white hover:bg-pulse-hover',
  secondary: 'bg-ink text-sandstone hover:bg-ink-soft',
  outline: 'border border-dune-deep bg-sandstone-raised text-ink hover:border-umber hover:bg-dune/40',
  ghost: 'text-pulse hover:bg-pulse-wash',
  onDark: 'bg-sandstone text-ink hover:bg-dune',
  verified: 'bg-verified text-white hover:bg-verified/90',
}

/** forwardRef so callers can manage focus (e.g. a modal's close button). */
export const Button = forwardRef(function Button(
  { variant = 'primary', className = '', as, to, ...props },
  ref,
) {
  const classes = `${buttonBase} ${buttonVariants[variant]} ${className}`
  if (as === 'link') {
    return <Link ref={ref} to={to} className={classes} {...props} />
  }
  return <button ref={ref} className={classes} {...props} />
})

/**
 * Card. Kept for the demo surfaces that already use it, but reduced to a
 * hairline-bordered panel — no elevation. For clinical content prefer
 * `CaseSheet`, which carries the document idiom.
 */
export function Card({ children, className = '', as: Tag = 'div' }) {
  return (
    <Tag className={`rounded-md border border-dune bg-sandstone-raised shadow-sheet ${className}`}>
      {children}
    </Tag>
  )
}

/**
 * Status pill. For AI-generated content use `AiDraftBadge` instead — that label
 * is a product-trust signal and should never be restyled per screen.
 */
export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'border-dune-deep bg-dune/40 text-ink-muted',
    pulse: 'border-pulse/30 bg-pulse-wash text-pulse',
    verified: 'border-verified/30 bg-verified-wash text-verified',
    alert: 'border-crimson/30 bg-crimson-wash text-crimson',
    draft: 'border-draft/35 bg-draft-wash text-draft-deep',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-micro uppercase tracking-label ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Figure-and-label pair. No longer used in a three-across hero row (that was the
 * generic stat strip); retained for the physician page, where the numbers are
 * operating assumptions with a stated caveat.
 */
export function Stat({ value, label }) {
  return (
    <div>
      <p className="text-display-sm text-ink">{value}</p>
      <p className="mt-1 text-meta leading-snug text-umber">{label}</p>
    </div>
  )
}
