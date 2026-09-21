import { cn } from './cn'

export type Tone =
  | 'neutral'
  | 'accent'
  | 'ai'
  | 'active'
  | 'pending'
  | 'danger'
  | 'muted'
  | 'sky'
  | 'success'
  | 'warning'
  | 'info'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonBase =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-3.5 [&_svg]:shrink-0'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-fg-invert hover:bg-accent-dim',
  secondary: 'border border-border bg-surface-3 text-fg-2 hover:border-border-strong hover:bg-surface-2 hover:text-fg',
  ghost: 'text-fg-2 hover:bg-surface-3 hover:text-fg',
  danger: 'border border-danger/20 bg-danger/10 text-danger hover:bg-danger/15',
  ai: 'bg-gradient-to-br from-accent2-dim to-accent-dim text-white hover:brightness-110',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-[13px]',
  lg: 'px-5 py-2.5 text-sm',
}

export type { ButtonVariant, ButtonSize }

export function buttonClasses(options: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  const { variant = 'primary', size = 'md', className } = options
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)
}

export const chipTones: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-fg-2 border-border',
  muted: 'bg-surface-3 text-fg-2 border-border',
  accent: 'bg-accent/15 text-accent border-accent/25',
  ai: 'bg-accent2/15 text-accent2 border-accent2/25',
  active: 'bg-success/10 text-success border-success/25',
  success: 'bg-success/10 text-success border-success/25',
  pending: 'bg-warning/10 text-warning border-warning/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
  sky: 'bg-sky/10 text-sky border-sky/25',
  info: 'bg-sky/10 text-sky border-sky/25',
}

const controlBase =
  'w-full rounded-md border border-border bg-surface text-fg outline-none transition placeholder:text-fg-3 focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60'

export function inputClasses(options: { size?: 'sm' | 'md'; className?: string } = {}) {
  const { size = 'md', className } = options
  return cn(controlBase, size === 'sm' ? 'px-2.5 py-1.5 text-[12.5px]' : 'px-3 py-2 text-[13.5px]', className)
}
