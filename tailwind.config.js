/**
 * Design system for AuricleHealth.
 *
 * Palette — sandstone and burnt sienna with red reserved for cardiac signal.
 * Preventative cardiology is the product, so warmth is doing work here: this is
 * long-horizon risk-reduction care, not acute intervention, and the surface
 * should read closer to a considered consultation than to an ER monitor.
 *
 *   ink      #2B211B  near-black warm brown — body text, dark panels
 *   umber    #7A6656  secondary text, metadata
 *   dune     #E3D7C6  dividers, hairlines, inactive fills
 *   sandstone#F7F2EA  page background
 *   pulse    #A54A26  burnt sienna — primary action, links, brand
 *   crimson  #A0242A  deep red — RESERVED: urgency and cardiac emphasis
 *   draft    #645A94  RESERVED: "AI-generated, pending physician review"
 *   verified #4E6B4A  RESERVED: physician-reviewed / sent
 *
 * Two reds would compete, so they're split by job: `pulse` (sienna) is every
 * ordinary action and carries the brand; `crimson` is only ever urgency or
 * cardiac emphasis. That keeps a red flag meaning something when it appears.
 *
 * `draft` stays a cool indigo-violet against the warm neutrals — the contrast
 * is the point. Machine-generated output should not look like it belongs to the
 * brand palette, and the coolness reads as provisional next to the sienna.
 *
 * Every foreground token clears 4.5:1 against `sandstone` (pulse 5.2, umber
 * 4.9, crimson 6.8, draft 5.5, verified 5.3), so `pulse` is safe for body links
 * rather than decoration-only.
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
          DEFAULT: '#2B211B',
          soft: '#3D2F26',
          muted: '#544235',
        },
        umber: {
          DEFAULT: '#7A6656',
          light: '#A08A76',
        },
        dune: {
          DEFAULT: '#E3D7C6',
          deep: '#CFBFA8',
        },
        sandstone: {
          DEFAULT: '#F7F2EA',
          raised: '#FFFDF8',
        },
        pulse: {
          DEFAULT: '#A54A26',
          hover: '#8A3C1E',
          wash: '#F6E7DE',
        },
        crimson: {
          DEFAULT: '#A0242A',
          wash: '#F8E6E4',
        },
        draft: {
          DEFAULT: '#645A94',
          wash: '#EDEBF5',
          deep: '#4B4275',
        },
        verified: {
          DEFAULT: '#4E6B4A',
          wash: '#E9F0E6',
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
        card: '0 1px 2px rgba(43, 33, 27, 0.04), 0 8px 24px -16px rgba(43, 33, 27, 0.20)',
        lift: '0 2px 4px rgba(43, 33, 27, 0.05), 0 16px 40px -20px rgba(43, 33, 27, 0.30)',
      },
      keyframes: {
        // Used only by the Step 2 processing state and the triage typing
        // indicator, where motion signals real work in flight. Both are disabled
        // under prefers-reduced-motion (see src/index.css).
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(0.94)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        solid: {
          '0%, 80%, 100%': { opacity: '0.3' },
          '40%': { opacity: '1' },
        },
      },
      animation: {
        sweep: 'sweep 1.9s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        breathe: 'breathe 2.4s ease-in-out infinite',
        dot: 'solid 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
