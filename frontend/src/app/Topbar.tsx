import { Bell, ChevronRight, LogOut, Search, Settings } from 'lucide-react'
import type { AuthUser } from '../domains/auth/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../shared/ui'

type TopbarProps = {
  workspaceName: string
  sectionLabel: string
  user: AuthUser
  onSignOut: () => void
}

export function Topbar({ workspaceName, sectionLabel, user, onSignOut }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[58px] items-center gap-4 border-b border-border bg-surface/90 px-6 backdrop-blur">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
        <span className="text-fg-3">{workspaceName}</span>
        <ChevronRight className="size-3.5 text-fg-3" />
        <span className="font-semibold text-fg">{sectionLabel}</span>
      </nav>

      <label className="relative ml-2 hidden max-w-80 flex-1 items-center md:flex">
        <Search className="pointer-events-none absolute left-3 size-3.5 text-fg-3" />
        <input
          type="search"
          placeholder="Search…"
          aria-label="Global search"
          className="w-full rounded-full border border-border bg-surface-2 py-1.5 pl-9 pr-3 text-[13px] text-fg outline-none transition placeholder:text-fg-3 focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative grid size-8.5 place-items-center rounded-full text-fg-2 transition hover:bg-surface-3"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full border-[1.5px] border-surface bg-danger" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-surface-3" aria-label="Account menu">
              <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-accent2 to-accent text-[10px] font-bold text-white">
                {initials(user.full_name)}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2.5 py-1.5">
              <div className="text-[13px] font-semibold text-fg">{user.full_name}</div>
              <div className="truncate text-xs text-fg-3">{user.email}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { window.location.hash = 'profile' }}>
              <Settings className="size-4" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onSignOut} className="text-danger data-[highlighted]:text-danger">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  )
}
