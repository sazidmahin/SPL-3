export function FooterSection() {
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-fg-3">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md bg-accent text-fg-invert">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-3.5">
            <path d="M4 6h12M4 10h8M4 14h10" />
          </svg>
        </span>
        <span className="font-display font-bold text-fg-2">SPL-3</span>
        <span>· Software Requirements Platform</span>
      </div>
      <span>&copy; {new Date().getFullYear()} IIT, University of Dhaka</span>
    </footer>
  )
}
