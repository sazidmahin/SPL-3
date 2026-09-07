import { ChevronsUpDown, LogOut, Plus, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AuthUser } from '../domains/auth/types'
import type { WorkspaceMembership } from '../domains/workspace/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '../shared/ui'

export type NavItem = { id: string; label: string; icon: LucideIcon }
export type NavGroup = { title?: string; items: NavItem[] }

type SidebarProps = {
  user: AuthUser
  roleLabel: string
  groups: NavGroup[]
  activeSection: string
  workspaces: WorkspaceMembership[]
  activeWorkspace: WorkspaceMembership | undefined
  onSelectWorkspace: (workspaceId: string) => void
  onSignOut: () => void
}

export function Sidebar({
  user,
  roleLabel,
  groups,
  activeSection,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onSignOut,
}: SidebarProps) {
  const workspaceName = activeWorkspace?.workspace.name ?? 'Personal Workspace'

  return (
    <aside
      className="sticky top-0 z-30 flex h-svh w-60 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar"
      aria-label="Primary navigation"
    >
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4.5 pb-3.5 pt-5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-fg-invert">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-[18px]">
            <path d="M4 6h12M4 10h8M4 14h10" />
          </svg>
        </span>
        <div>
          <div className="font-display text-base font-extrabold tracking-tight text-sidebar-fg-active">SPL-3</div>
          <div className="text-[10px] text-sidebar-fg">by IIT, University of Dhaka</div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="mx-3 mb-2 mt-3 flex items-center gap-2 rounded-md border border-sidebar-border bg-white/[0.04] px-3 py-2.5 text-left transition hover:bg-white/[0.07]">
            <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-accent text-[11px] font-extrabold text-fg-invert">
              {initials(workspaceName)}
            </span>
            <span className="flex-1 truncate text-[13px] font-semibold text-sidebar-fg-active">{workspaceName}</span>
            <ChevronsUpDown className="size-3.5 text-sidebar-fg" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[13rem]">
          {workspaces.length === 0 ? (
            <DropdownMenuItem disabled>No workspaces</DropdownMenuItem>
          ) : (
            workspaces.map((membership) => (
              <DropdownMenuItem
                key={membership.workspace.id}
                onSelect={() => onSelectWorkspace(membership.workspace.id)}
                className={cn(membership.workspace.id === activeWorkspace?.workspace.id && 'text-fg')}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-sm bg-accent/15 text-[10px] font-extrabold text-accent">
                  {initials(membership.workspace.name)}
                </span>
                <span className="flex-1 truncate">{membership.workspace.name}</span>
                <span className="text-[10px] uppercase tracking-wide text-fg-3">{membership.role.replaceAll('_', ' ')}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="flex flex-1 flex-col gap-px overflow-y-auto px-2.5 py-1.5">
        {groups.map((group, groupIndex) => (
          <div key={group.title ?? groupIndex} className="flex flex-col gap-px">
            {group.title ? (
              <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-fg">
                {group.title}
              </div>
            ) : groupIndex > 0 ? (
              <div className="my-2 h-px bg-sidebar-border" />
            ) : null}
            {group.items.map((item) => {
              const Icon = item.icon
              const active = item.id === activeSection
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition',
                    active
                      ? 'bg-accent/10 text-accent'
                      : 'text-sidebar-fg hover:bg-white/[0.04] hover:text-sidebar-fg-active',
                  )}
                >
                  <Icon className="size-[15px] shrink-0" />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <a
          href="#projects"
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-accent/30 bg-accent/10 px-3 py-2.5 text-[13px] font-semibold text-accent transition hover:border-accent hover:bg-accent/20"
        >
          <Plus className="size-3.5" />
          New Project
        </a>
        <div className="mt-2.5 flex items-center gap-2.5 px-2.5 pt-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent2 to-accent text-[11px] font-bold text-white">
            {initials(user.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-sidebar-fg-active">{user.full_name}</div>
            <div className="truncate text-[11px] capitalize text-sidebar-fg">{roleLabel.replaceAll('_', ' ')}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="grid size-7 shrink-0 place-items-center rounded-md text-sidebar-fg transition hover:bg-white/[0.06] hover:text-sidebar-fg-active"
                aria-label="Account menu"
              >
                <Settings className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => { window.location.hash = 'settings' }}>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSignOut} className="text-danger data-[highlighted]:text-danger">
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  )
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'W'
  )
}
