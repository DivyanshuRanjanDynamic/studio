import { cn } from '@/utils';

/** Button classes shared by server and client components (SKILL B2 padding, B9 states). */
const BUTTON_VARIANTS = {
  primary: 'bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90',
  secondary: 'border border-lp-fg/15 bg-lp-bg text-lp-fg hover:border-lp-fg/40 hover:bg-lp-muted',
  inverted: 'bg-lp-bg text-lp-fg hover:bg-lp-bg/90',
  'inverted-secondary': 'border border-lp-primary-fg/30 text-lp-primary-fg hover:bg-lp-primary-fg/10',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

/**
 * `withIcon` buttons carry a 32px round icon chip on the right, so they use
 * asymmetric padding (16px left, 4px right) to keep the chip inset evenly.
 */
export const buttonClass = (variant: ButtonVariant = 'primary', size: 'md' | 'sm' = 'md', withIcon = false) =>
  cn(
    'lp-press group inline-flex items-center justify-center rounded-full',
    withIcon ? 'gap-3 py-1 pl-4 pr-1' : 'gap-2 px-3 py-2',
    size === 'md' ? 'button-md' : 'button-sm',
    BUTTON_VARIANTS[variant]
  );
