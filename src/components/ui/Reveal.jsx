import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-triggered fade/rise for marketing sections.
 *
 * Adapted from the React Bits `AnimatedContent` / `FadeContent` pattern
 * (https://reactbits.dev) — reimplemented here as ~40 lines of
 * IntersectionObserver plus a CSS transition rather than pulled in as a
 * dependency, so it inherits this project's design tokens and needs no
 * animation library. This is one of only two places motion appears in the build;
 * the other is the Step 2 processing state.
 *
 * Respects prefers-reduced-motion by rendering in the final state immediately.
 */
export function Reveal({ children, delay = 0, y = 14, className = '', as: Tag = 'div' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-[650ms] ease-out ${className}`}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translate3d(0, ${y}px, 0)`,
        transitionDelay: shown ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </Tag>
  )
}
