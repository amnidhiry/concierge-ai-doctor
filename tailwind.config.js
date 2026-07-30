/**
 * Design tokens for AuricleHealth.
 *
 * The visual concept is a specialist's case file: clinical, editorial, precise.
 * Documents, rules, and annotations rather than floating cards; hierarchy through
 * precision rather than scale.
 *
 * TOKEN NAMING — deliberately unchanged from the previous palette even though the
 * values are new. The demo flow carries ~300 class references across 30 files;
 * renaming `sandstone` to `ivory` would churn all of it for no visual gain and
 * real risk to a working flow. The names are role-based (`sandstone` = page
 * surface, `umber` = secondary text, `dune` = rules) so they still describe their
 * jobs accurately.
 *
 * PALETTE ROLES
 *   sandstone         #F4EFE6  warm ivory — page background
 *   sandstone.raised  #FDFBF6  pale cream — case-file surfaces
 *   ink               #241B15  near-black warm brown — primary text
 *   umber             #6F5F50  muted taupe — secondary text
 *   dune              #DCD1C2  rules, hairlines, borders
 *   pulse             #A84B23  burnt sienna — primary action, selective emphasis
 *   oxblood           #6E1F24  clinical annotations, active states, document rules
 *   crimson           #A32A25  urgency only (emergency routing, errors)
 *   draft             #645A94  RESERVED: AI-generated, pending physician review
 *   verified          #4E6B4A  RESERVED: physician-reviewed
 *
 * Two deep reds serve different jobs and are kept distinct: `oxblood` is
 * annotation and structure at hairline scale, `crimson` is alarm in filled
 * blocks. Collapsing them would make a genuine red flag stop reading as one.
 *
 * CONTRAST — every text token clears WCGA AA 4.5:1 on `sandstone`:
 *   ink 13.9 · umber 5.4 · umber.light 4.8 · pulse 5.0 · oxblood 9.8
 *   crimson 6.0 · draft 5.5 · verified 5.3
 * `umber.light` was #A08A76 (≈2.6:1) and was being used for small metadata text —
 * that was an accessibility defect, now fixed.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#241B15',
          soft: '#3A2E24',
          muted: '#4E4034',
        },
        umber: {
          DEFAULT: '#6F5F50',
          light: '#786553',
        },
        dune: {
          DEFAULT: '#DCD1C2',
          deep: '#C3B4A1',
          faint: '#EAE3D8',
        },
        sandstone: {
          DEFAULT: '#F4EFE6',
          raised: '#FDFBF6',
          sunk: '#EDE6DA',
        },
        pulse: {
          DEFAULT: '#A84B23',
          hover: '#8C3D1B',
          wash: '#F3E4DA',
        },
        oxblood: {
          DEFAULT: '#6E1F24',
          hover: '#571519',
          wash: '#F1E4E3',
        },
        crimson: {
          DEFAULT: '#A32A25',
          wash: '#F7E7E5',
        },
        draft: {
          DEFAULT: '#645A94',
          wash: '#ECEAF4',
          deep: '#4B4275',
        },
        verified: {
          DEFAULT: '#4E6B4A',
          wash: '#E8EFE5',
        },
      },

      fontFamily: {
        // Sans carries the site: body, navigation, controls, metadata, headings.
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        // Serif is now selective — patient questions, physician quotations, pull
        // quotes. It is no longer the default for headings (see index.css).
        display: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },

      /**
       * Restrained type scale. The old hero ran to 3.5rem; `display` tops out at
       * 2.25rem, so hierarchy comes from weight, rule, and spacing rather than
       * scale. Line heights are tuned for a 62–72ch measure.
       */
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1.45', letterSpacing: '0.045em' }],
        meta: ['0.8125rem', { lineHeight: '1.5' }],
        body: ['0.9375rem', { lineHeight: '1.65' }],
        'body-lg': ['1.0313rem', { lineHeight: '1.6' }],
        subtitle: ['1.125rem', { lineHeight: '1.5' }],
        title: ['1.3125rem', { lineHeight: '1.35', letterSpacing: '-0.006em' }],
        'display-sm': ['1.625rem', { lineHeight: '1.22', letterSpacing: '-0.012em' }],
        display: ['2.25rem', { lineHeight: '1.14', letterSpacing: '-0.018em' }],
        quote: ['1.375rem', { lineHeight: '1.45' }],
      },

      // Reduced from 0.08em. Small-caps labels remain, but tracked far less and
      // used sparingly rather than as the label for everything.
      letterSpacing: {
        label: '0.045em',
        tight: '-0.012em',
      },

      /**
       * Small and deliberate. Overriding the scale rather than editing ~46
       * existing `rounded-md`/`rounded-lg` classNames means the whole app tightens
       * at once, and a component added later inherits it.
       */
      borderRadius: {
        none: '0',
        sm: '1px',
        DEFAULT: '2px',
        md: '2px',
        lg: '3px',
        xl: '4px',
        '2xl': '5px',
        full: '9999px',
      },

      maxWidth: {
        prose: '68ch',
        measure: '62ch',
        note: '48ch',
      },

      spacing: {
        rule: '1px',
        gutter: '1.75rem',
      },

      /**
       * Shadows are near-absent by design — depth comes from rules and surface
       * value, not elevation. `sheet` is a single hairline-equivalent lift for
       * case-file surfaces; `lift` is reserved for genuine overlays (modals).
       */
      boxShadow: {
        sheet: '0 1px 0 rgba(36, 27, 21, 0.04)',
        lift: '0 1px 2px rgba(36, 27, 21, 0.06), 0 18px 44px -24px rgba(36, 27, 21, 0.28)',
        card: '0 1px 0 rgba(36, 27, 21, 0.04)',
      },

      keyframes: {
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
