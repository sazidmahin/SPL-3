/** Mid-tone status colours for SVG charts (recharts sets `fill` attributes, which cannot read CSS variables). Legible on both themes. */
export const STATUS_CHART_COLORS: Record<string, string> = {
  completed: '#10b981',
  running: '#0ea5e9',
  pending: '#8b5cf6',
  partially_completed: '#f59e0b',
  failed: '#f43f5e',
}

export const FALLBACK_CHART_COLOR = '#94a3b8'
