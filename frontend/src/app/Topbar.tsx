import { Bell, ChevronRight, LogOut, Menu, Moon, Search, Settings, Sun } from 'lucide-react'
import type { AuthUser } from '../domains/auth/types'
import { useTheme } from '../shared/theme'
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
} from '../shared/ui'

type TopbarProps = {
  workspaceName: string
  sectionLabel: string
  user: AuthUser
  onOpenNav: () => void
  onSignOut: () => void
}

const iconButton =
  'relative grid size-9 shrink-0 place-items-center rounded-lg text-fg-2 transition hover:bg-surface-3 hover:text-fg focus-visible:ring-4 focus-visible:ring-accent/15 [&_svg]:size-[18px]'

export function Topbar({ workspaceName, sectionLabel, user, onOpenNav, onSignOut }: TopbarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-bg/75 px-3 backdrop-blur-xl backdrop-saturate-150 sm:gap-3 sm:px-6 lg:px-8">
      <button type="button" className={`${iconButton} lg:hidden`} aria-label="Open navigation" onClick={onOpenNav}>
        <Menu />
      </button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className="hidden truncate text-fg-3 sm:inline">{workspaceName}</span>
        <ChevronRight className="hidden size-3.5 shrink-0 text-fg-3 sm:block" />
        <span className="truncate font-semibold text-fg">{sectionLabel}</span>
      </nav>

      <label className="group relative ml-auto hidden w-full max-w-sm items-center md:flex">
        <Search className="pointer-events-none absolute left-3 size-4 text-fg-3" />
        <input
          type="search"
          placeholder="Search projects, documents…"
          aria-label="Global search"
          className="h-9.5 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[13px] text-fg shadow-[var(--elev-1)] outline-none transition placeholder:text-fg-3 hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent/15"
        />
      </label>

      <div className="ml-auto flex items-center gap-1 md:ml-2">
        <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <button type="button" className={iconButton} aria-label="Toggle colour theme" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </Tooltip>
        <Tooltip content="Notifications">
          <button type="button" className={iconButton} aria-label="Notifications">
            <Bell />
            <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-bg bg-danger" />
          </button>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 rounded-full transition hover:ring-4 hover:ring-accent/15" aria-label="Account menu">
              <Avatar name={user.full_name} className="ring-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[14rem]">
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <Avatar name={user.full_name} className="ring-0" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-fg">{user.full_name}</div>
                <div className="truncate text-xs text-fg-3">{user.email}</div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { window.location.hash = 'profile' }}>
              <Settings className="size-4" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={toggleTheme}>
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
