import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Folder, MoreHorizontal, Plus, RefreshCw, Search } from 'lucide-react'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Sheet,
  SheetContent,
  Textarea,
  cn,
} from '../../shared/ui'

type ProjectDirectoryProps = {
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  projects: Project[]
  isLoadingProjects: boolean
  projectName: string
  projectDescription: string
  isCreatingProject: boolean
  onReload: () => void
  onSelectProject: (projectId: string) => void
  onProjectNameChange: (value: string) => void
  onProjectDescriptionChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ProjectDirectory({
  activeWorkspace,
  activeProject,
  projects,
  isLoadingProjects,
  projectName,
  projectDescription,
  isCreatingProject,
  onReload,
  onSelectProject,
  onProjectNameChange,
  onProjectDescriptionChange,
  onSubmit,
}: ProjectDirectoryProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesQuery =
        !term || project.name.toLowerCase().includes(term) || (project.description ?? '').toLowerCase().includes(term)
      const matchesStatus = status === 'all' || project.status === status
      return matchesQuery && matchesStatus
    })
  }, [projects, query, status])

  const statuses = useMemo(() => Array.from(new Set(projects.map((project) => project.status))), [projects])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    onSubmit(event)
    setIsCreateOpen(false)
  }

  return (
    <section className="grid gap-5" id="projects">
      <PageHeader
        title="Projects"
        description={`${projects.length} project${projects.length === 1 ? '' : 's'} in ${activeWorkspace?.workspace.name ?? 'this workspace'}`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={onReload}
              disabled={!activeWorkspace || isLoadingProjects}
              aria-label="Refresh projects"
            >
              <RefreshCw className={cn(isLoadingProjects && 'animate-spin')} />
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} disabled={!activeWorkspace}>
              <Plus /> New Project
            </Button>
          </>
        }
      />

      <Card className="flex flex-wrap items-center gap-2.5 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" />
          <Input
            type="search"
            placeholder="Search projects…"
            aria-label="Search projects"
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          className="w-auto cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-[13.5px] text-fg outline-none focus:border-accent"
          aria-label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {formatStatus(value)}
            </option>
          ))}
        </select>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon={Folder}
          title={projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
          description={
            projects.length === 0
              ? 'Create your first project to start generating SRS documents and diagrams.'
              : 'Try a different search term or status filter.'
          }
          action={
            projects.length === 0 ? (
              <Button size="sm" onClick={() => setIsCreateOpen(true)} disabled={!activeWorkspace}>
                <Plus /> New Project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project.id)}
              className={cn(
                'flex flex-col rounded-lg border bg-surface p-5 text-left shadow-sm transition hover:shadow-md',
                project.id === activeProject?.id ? 'border-accent' : 'border-border',
              )}
            >
              <div className="mb-3.5 flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-md bg-accent/15 text-accent">
                  <Folder className="size-5" />
                </span>
                <MoreHorizontal className="size-4 text-fg-3" />
              </div>
              <div className="mb-1.5 font-display text-[15px] font-bold text-fg">{project.name}</div>
              <div className="mb-3.5 flex-1 text-[12.5px] leading-relaxed text-fg-2">
                {project.description || 'No description provided.'}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-fg-2">
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      project.status === 'archived' ? 'bg-fg-3' : 'bg-success',
                    )}
                  />
                  {formatStatus(project.status)}
                </span>
                <span className="text-[11px] text-fg-3">{relativeTime(project.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent
          title="New Project"
          description="Give your project a name and a short description."
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <form id="create-project-form" className="grid gap-4" onSubmit={handleSubmit}>
            <Field label="Project name" htmlFor="project-name" required hint={`${projectName.length} / 100`}>
              <Input
                id="project-name"
                maxLength={100}
                placeholder="e.g. E-Commerce Platform"
                value={projectName}
                onChange={(event) => onProjectNameChange(event.target.value)}
                required
              />
            </Field>
            <Field
              label="Description"
              htmlFor="project-description"
              hint={`${projectDescription.length} / 500`}
            >
              <Textarea
                id="project-description"
                rows={4}
                maxLength={500}
                placeholder="What does this system do?"
                value={projectDescription}
                onChange={(event) => onProjectDescriptionChange(event.target.value)}
              />
            </Field>
          </form>
          <div className="mt-6 flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-project-form"
              className="flex-1"
              disabled={!activeWorkspace || isCreatingProject || !projectName.trim()}
            >
              {isCreatingProject ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {isLoadingProjects && projects.length > 0 ? (
        <Chip tone="muted" className="w-max">
          Refreshing…
        </Chip>
      ) : null}
    </section>
  )
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/^\w/, (character) => character.toUpperCase())
}

function relativeTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
