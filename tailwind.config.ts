import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Variables come from next/font in src/app/fonts.ts
        body: ['var(--font-lora)', 'serif'],
        headline: ['var(--font-cormorant)', 'serif'],
        heading: ['var(--font-instrument-serif)', 'serif'],
        libre: ['var(--font-libre-baskerville)', 'serif'],
        code: ['monospace'],
        consolas: ['Consolas', 'Monaco', 'monospace'],
        bankgothic: ['"BankGothic Md BT"', '"Bank Gothic Light"', 'sans-serif'],
        'lp-sans': ['var(--lp-font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'lp-serif': ['var(--lp-font-serif)', 'Georgia', 'serif'],
        'lp-mono': ['var(--lp-font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'heading-lg': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-lg-sm': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      colors: {
        // MechHub design system tokens
        mh: {
          // Backgrounds
          'bg-base':     '#080C14',
          'bg-surface':  '#0D1421',
          'bg-elevated': '#121A2B',
          'bg-border':   '#1E2D45',
          // Brand Blue
          'blue-dim':    '#1A3A5C',
          'blue-mid':    '#2563EB',
          'blue':        '#3B82F6',
          'blue-light':  '#60A5FA',
          'blue-glow':   '#93C5FD',
          // Text
          'text-primary':   '#F0F6FF',
          'text-secondary': '#8BA3C0',
          'text-tertiary':  '#4A6580',
          // Semantic
          'success': '#22C55E',
          'warning': '#F59E0B',
          'danger':  '#EF4444',
        },
        // Landing page (home) tokens — oklch channels defined on .lp-root in components/home/landing.css
        lp: {
          bg: 'oklch(var(--lp-background) / <alpha-value>)',
          fg: 'oklch(var(--lp-foreground) / <alpha-value>)',
          card: 'oklch(var(--lp-card) / <alpha-value>)',
          primary: 'oklch(var(--lp-primary) / <alpha-value>)',
          'primary-fg': 'oklch(var(--lp-primary-foreground) / <alpha-value>)',
          muted: 'oklch(var(--lp-muted) / <alpha-value>)',
          'muted-fg': 'oklch(var(--lp-muted-foreground) / <alpha-value>)',
          accent: 'oklch(var(--lp-accent) / <alpha-value>)',
          border: 'oklch(var(--lp-border) / <alpha-value>)',
          ink: 'oklch(var(--lp-ink) / <alpha-value>)',
          'ink-fg': 'oklch(var(--lp-ink-foreground) / <alpha-value>)',
          destructive: 'oklch(var(--lp-destructive) / <alpha-value>)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-parts': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee 30s linear infinite',
        'marquee-parts': 'marquee-parts 40s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
