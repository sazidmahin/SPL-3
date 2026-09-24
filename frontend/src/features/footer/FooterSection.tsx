import { BrandMark } from '../../shared/ui'

export function FooterSection() {
  return (
    <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 pb-2 text-xs text-fg-3">
      <div className="flex items-center gap-2">
        <BrandMark className="size-6 rounded-md shadow-none" />
        <span className="font-display font-bold text-fg-2">SpecTwin</span>
        <span className="hidden sm:inline">· Software Requirements Platform</span>
      </div>
      <span>&copy; {new Date().getFullYear()} IIT, University of Dhaka</span>
    </footer>
  )
}
