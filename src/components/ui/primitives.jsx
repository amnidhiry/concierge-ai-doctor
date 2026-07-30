import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

/** Layout + typographic primitives shared by the marketing site and the demo. */

export function Container({ children, className = '', width = 'default' }) {
  const widths = {
    default: 'max-w-6xl',
    narrow: 'max-w-3xl',
    wide: 'max-w-7xl',
  }
  return (
    <div className={`mx-auto w-full ${widths[width]} px-5 sm:px-8 ${className}`}>{children}</div>
  )
}

export function Eyebrow({ children, tone = 'slate' }) {
  const tones = { slate: 'text-slate', pulse: 'text-pulse', light: 'text-mist-deep' }
  return <p className={`field-label ${tones[tone]}`}>{children}</p>
}

export function SectionHeading({ eyebrow, title, lede, align = 'left', tone = 'dark' }) {
  const isCenter = align === 'center'
  return (
    <div className={`${isCenter ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
      {eyebrow && <Eyebrow tone={tone === 'light' ? 'light' : 'slate'}>{eyebrow}</Eyebrow>}
      <h2
        className={`mt-3 text-balance text-3xl leading-[1.15] sm:text-4xl ${
          tone === 'light' ? 'text-paper' : 'text-ink'
        }`}
      >
        {title}
      </h2>
      {lede && (
        <p
          className={`mt-4 text-[17px] leading-relaxed ${
            tone === 'light' ? 'text-mist-deep' : 'text-slate'
          }`}
        >
          {lede}
        </p>
      )}
    </div>
  )
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[15px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45'

const buttonVariants = {
  primary: 'bg-pulse text-white hover:bg-pulse-hover',
  secondary: 'bg-ink text-paper hover:bg-ink-soft',
  outline: 'border border-mist-deep bg-paper-raised text-ink hover:border-slate hover:bg-mist/40',
  ghost: 'text-pulse hover:bg-pulse-wash',
  onDark: 'bg-paper text-ink hover:bg-mist',
  verified: 'bg-verified text-white hover:bg-verified/90',
}

/** forwardRef so callers can manage focus (e.g. focusing a modal's close button). */
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

export function Card({ children, className = '', as: Tag = 'div' }) {
  return (
    <Tag
      className={`rounded-lg border border-mist bg-paper-raised shadow-card ${className}`}
    >
      {children}
    </Tag>
  )
}

/**
 * Generic status pill. For AI-generated content use <AiDraftBadge> instead —
 * that label is a product-trust signal and should never be restyled per-screen.
 */
export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'border-mist-deep bg-mist/50 text-ink-muted',
    pulse: 'border-pulse/25 bg-pulse-wash text-pulse',
    verified: 'border-verified/25 bg-verified-wash text-verified',
    alert: 'border-alert/25 bg-alert-wash text-alert',
    draft: 'border-draft/30 bg-draft-wash text-draft-deep',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-label ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function Divider({ className = '' }) {
  return <hr className={`border-mist ${className}`} />
}

export function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-3xl text-ink">{value}</p>
      <p className="mt-1 text-sm leading-snug text-slate">{label}</p>
    </div>
  )
}
