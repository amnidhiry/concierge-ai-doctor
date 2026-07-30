/**
 * Design system for Concierge AI Doctor.
 *
 * Palette — cool, low-chroma, institutional. Deliberately avoids the
 * warm-cream/terracotta and dark-mode-plus-neon defaults; this product asks
 * patients and physicians to trust it with serious decisions, so the surface
 * reads closer to a clinical record than to a consumer app.
 *
 *   ink      #12232B  deep blue-graphite — body text, dark panels
 *   slate    #5B7482  secondary text, metadata
 *   mist     #DEE7EA  dividers, hairlines, inactive fills
 *   paper    #F6F8F9  page background (cool off-white, not cream)
 *   pulse    #14587F  primary action, links
 *   draft    #6D5BA6  reserved: "AI-generated, pending physician review"
 *   verified #2F6B4F  reserved: physician-reviewed / sent
 *
 * `draft` and `verified` are state colors, not decoration. Using `draft`
 * anywhere other than an unreviewed-AI-output signal weakens the one visual
 * cue the product most needs to keep honest.
 *
 * Type — Newsreader (a restrained low-contrast serif) for display only, IBM
 * Plex Sans for body, IBM Plex Mono for clinical field labels and timestamps.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12232B',
          soft: '#1D3641',
          muted: '#2C4B58',
        },
        slate: {
          DEFAULT: '#5B7482',
          light: '#8AA0AB',
        },
        mist: {
          DEFAULT: '#DEE7EA',
          deep: '#C7D5DA',
        },
        paper: {
          DEFAULT: '#F6F8F9',
          raised: '#FFFFFF',
        },
        pulse: {
          DEFAULT: '#14587F',
          hover: '#0F4665',
          wash: '#E7F0F5',
        },
        draft: {
          DEFAULT: '#6D5BA6',
          wash: '#EFEBF7',
          deep: '#4E3F80',
        },
        verified: {
          DEFAULT: '#2F6B4F',
          wash: '#E8F1EC',
        },
        alert: {
          DEFAULT: '#9B3B2F',
          wash: '#F7EAE8',
        },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        label: '0.08em',
      },
      maxWidth: {
        prose: '68ch',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18, 35, 43, 0.04), 0 8px 24px -16px rgba(18, 35, 43, 0.18)',
        lift: '0 2px 4px rgba(18, 35, 43, 0.05), 0 16px 40px -20px rgba(18, 35, 43, 0.28)',
      },
      keyframes: {
        // Used only by the Step 2 processing state, where motion communicates
        // that real work is in flight. Both are disabled under
        // prefers-reduced-motion (see src/index.css).
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(0.94)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        sweep: 'sweep 1.9s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        breathe: 'breathe 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
