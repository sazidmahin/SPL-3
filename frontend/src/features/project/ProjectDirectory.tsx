import { useMemo, useState } from 'react'
import type { ComponentType, FormEvent, SVGProps } from 'react'
import {
  ChevronDown,
  FileText,
  Folder,
  Grid2X2,
  ListFilter,
  MoreVertical,
  Network,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import './ProjectDirectory.css'

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

type ViewMode = 'table' | 'cards'
type Tone = 'green' | 'blue' | 'purple' | 'neutral'

type ProjectRow = {
  id: string
  name: string
  description: string
  tags: string[]
  status: string
  tone: Tone
  updatedDate: string
  updatedMeta: string
  artifacts: {
    docs: number
    diagrams: number
    jobs: number
  }
}

const fallbackRows: ProjectRow[] = [
  projectRow('project-1', 'E-Commerce Platform', 'Online retail and order management system', ['E-Commerce', 'Retail'], 'In Progress', 'green', 'May 31, 2025', '2 hours ago', 28, 17, 46),
  projectRow('project-2', 'Healthcare Appointment System', 'Patient scheduling and appointment management', ['Healthcare', 'Scheduling'], 'Planning', 'blue', 'May 30, 2025', '1 day ago', 16, 12, 22),
  projectRow('project-3', 'Inventory Management System', 'Stock tracking and warehouse management', ['Logistics', 'Inventory'], 'In Progress', 'green', 'May 29, 2025', '2 days ago', 22, 14, 35),
  projectRow('project-4', 'Learning Management System', 'Online learning and course management', ['Education', 'E-Learning'], 'Review', 'purple', 'May 28, 2025', '3 days ago', 18, 11, 27),
  projectRow('project-5', 'Mobile Banking App', 'Secure mobile banking application', ['Finance', 'Mobile'], 'On Hold', 'neutral', 'May 27, 2025', '4 days ago', 12, 8, 15),
  projectRow('project-6', 'Visitor Management System', 'Office visitor check-in and tracking', ['Facilities', 'Security'], 'Planning', 'blue', 'May 26, 2025', '5 days ago', 9, 6, 11),
]

const suggestedDomains = ['E-Commerce', 'Healthcare', 'Education', 'Finance', 'Logistics', 'Other']

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
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const rows = useMemo(() => (projects.length > 0 ? projects.map(projectToRow) : fallbackRows), [projects])

  return (
    <section className="project-directory" id="projects">
      <header className="project-directory-header">
        <div>
          <h1>Projects</h1>
          <p>Create, organize, and track all your projects in one place.</p>
        </div>
        <div className="project-header-actions">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <button className="project-new-button" type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus size={17} />
            New Project
            <span />
            <ChevronDown size={15} />
          </button>
        </div>
      </header>

      <ProjectFilters onReload={onReload} disabled={!activeWorkspace || isLoadingProjects} />

      {viewMode === 'table' ? (
        <ProjectTable rows={rows.slice(0, 5)} activeProjectId={activeProject?.id} onSelectProject={onSelectProject} />
      ) : (
        <ProjectCards rows={rows} activeProjectId={activeProject?.id} onSelectProject={onSelectProject} />
      )}

      {isCreateOpen ? (
        <CreateProjectSidePanel
          activeWorkspace={activeWorkspace}
          projectName={projectName}
          projectDescription={projectDescription}
          isCreatingProject={isCreatingProject}
          onProjectNameChange={onProjectNameChange}
          onProjectDescriptionChange={onProjectDescriptionChange}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={onSubmit}
        />
      ) : null}
    </section>
  )
}

type ViewToggleProps = {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="project-view-toggle" role="tablist" aria-label="Project view">
      <button className={value === 'table' ? 'active' : ''} type="button" onClick={() => onChange('table')}>
        <ListFilter size={16} />
        Table
      </button>
      <button className={value === 'cards' ? 'active' : ''} type="button" onClick={() => onChange('cards')}>
        <Grid2X2 size={16} />
        Cards
      </button>
    </div>
  )
}

function ProjectFilters({ disabled, onReload }: { disabled: boolean; onReload: () => void }) {
  return (
    <div className="project-filter-row">
      <label className="project-search-filter">
        <Search size={18} />
        <input placeholder="Search projects..." />
      </label>
      <FilterButton label="Status" />
      <FilterButton label="Domain" />
      <FilterButton label="Updated" />
      <button className="clear-filter-button" type="button" onClick={onReload} disabled={disabled}>
        Clear filters
      </button>
    </div>
  )
}

function FilterButton({ label }: { label: string }) {
  return (
    <button className="project-filter-button" type="button">
      {label}
      <ChevronDown size={14} />
    </button>
  )
}

type ProjectListProps = {
  rows: ProjectRow[]
  activeProjectId: string | undefined
  onSelectProject: (projectId: string) => void
}

function ProjectTable({ rows, activeProjectId, onSelectProject }: ProjectListProps) {
  return (
    <div className="project-table-card">
      <div className="project-table-head">
        <span>Project Name</span>
        <span>Domain / Tags</span>
        <span>Status</span>
        <span>Artifacts</span>
        <span>Updated</span>
        <span>Actions</span>
      </div>
      {rows.map((row) => (
        <button
          className={row.id === activeProjectId ? 'project-table-row active' : 'project-table-row'}
          key={row.id}
          type="button"
          onClick={() => onSelectProject(row.id)}
        >
          <ProjectName row={row} />
          <TagGroup tags={row.tags} />
          <StatusPill tone={row.tone}>{row.status}</StatusPill>
          <ArtifactCounters row={row} />
          <span className="project-updated"><strong>{row.updatedDate}</strong><small>{row.updatedMeta}</small></span>
          <MoreVertical className="project-menu-icon" size={18} />
        </button>
      ))}
      <footer className="project-table-footer">
        <span>Showing 1 to {rows.length} of 12 projects</span>
        <div>
          <button type="button">‹</button>
          <button className="active" type="button">1</button>
          <button type="button">2</button>
          <button type="button">3</button>
          <button type="button">›</button>
        </div>
      </footer>
    </div>
  )
}

function ProjectCards({ rows, activeProjectId, onSelectProject }: ProjectListProps) {
  return (
    <div className="project-card-grid">
      {rows.map((row) => (
        <button
          className={row.id === activeProjectId ? 'project-card active' : 'project-card'}
          key={row.id}
          type="button"
          onClick={() => onSelectProject(row.id)}
        >
          <header>
            <ProjectName row={row} />
          </header>
          <TagGroup tags={row.tags} />
          <StatusPill tone={row.tone}>{row.status}</StatusPill>
          <ArtifactCounters row={row} />
          <footer>
            <span>Updated {row.updatedMeta}</span>
            <MoreVertical size={18} />
          </footer>
        </button>
      ))}
    </div>
  )
}

function ProjectName({ row }: { row: ProjectRow }) {
  return (
    <span className="project-name-cell">
      <span className="project-folder-icon"><Folder size={20} /></span>
      <span><strong>{row.name}</strong><small>{row.description}</small></span>
    </span>
  )
}

function TagGroup({ tags }: { tags: string[] }) {
  return (
    <span className="project-tag-group">
      {tags.map((tag) => <span key={tag}>{tag}</span>)}
    </span>
  )
}

function ArtifactCounters({ row }: { row: ProjectRow }) {
  return (
    <span className="artifact-counters">
      <Counter icon={FileText} value={row.artifacts.docs} />
      <Counter icon={Network} value={row.artifacts.diagrams} />
      <Counter icon={Sparkles} value={row.artifacts.jobs} />
    </span>
  )
}

function Counter({ icon: Icon, value }: { icon: ComponentType<SVGProps<SVGSVGElement>>; value: number }) {
  return <span><Icon width={17} height={17} />{value}</span>
}

function StatusPill({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`project-status-pill tone-${tone}`}>{children}</span>
}

type CreateProjectSidePanelProps = {
  activeWorkspace: WorkspaceMembership | undefined
  projectName: string
  projectDescription: string
  isCreatingProject: boolean
  onProjectNameChange: (value: string) => void
  onProjectDescriptionChange: (value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function CreateProjectSidePanel({
  activeWorkspace,
  projectName,
  projectDescription,
  isCreatingProject,
  onProjectNameChange,
  onProjectDescriptionChange,
  onClose,
  onSubmit,
}: CreateProjectSidePanelProps) {
  return (
    <div className="project-create-overlay" role="presentation">
      <button className="project-create-backdrop" type="button" aria-label="Close create project panel" onClick={onClose} />
      <aside className="project-create-panel" aria-label="Create new project">
        <header>
          <div>
            <h2>Create New Project</h2>
            <p>Start a new project by providing the basic information.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </header>
        <form className="project-create-form" onSubmit={onSubmit}>
          <label>
            <span>Project Name <b>*</b></span>
            <input value={projectName} maxLength={100} placeholder="Enter project name" onChange={(event) => onProjectNameChange(event.target.value)} required />
            <small>{projectName.length} / 100</small>
          </label>
          <label>
            <span>Description</span>
            <textarea value={projectDescription} maxLength={500} rows={5} placeholder="Describe the purpose and scope of this project..." onChange={(event) => onProjectDescriptionChange(event.target.value)} />
            <small>{projectDescription.length} / 500</small>
          </label>
          <label>
            <span>Domain / Tags</span>
            <select defaultValue="">
              <option value="" disabled>Select or add domains</option>
              {suggestedDomains.map((domain) => <option key={domain}>{domain}</option>)}
            </select>
          </label>
          <label>
            <span>Add Tags (optional)</span>
            <input placeholder="Type and press enter to add tags..." />
          </label>
          <div className="suggested-domain-list">
            <span>Suggested Domains</span>
            <div>{suggestedDomains.map((domain) => <button key={domain} type="button">{domain}</button>)}</div>
          </div>
          <footer>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={!activeWorkspace || isCreatingProject}>{isCreatingProject ? 'Creating' : 'Create Project'}</button>
          </footer>
        </form>
      </aside>
    </div>
  )
}

function projectToRow(project: Project): ProjectRow {
  return projectRow(
    project.id,
    project.name,
    project.description ?? 'Project workspace and generated artifacts',
    tagsFromProject(project.name),
    normalizeStatus(project.status),
    toneFromStatus(project.status),
    new Date(project.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    'recently updated',
    28,
    17,
    46,
  )
}

function projectRow(
  id: string,
  name: string,
  description: string,
  tags: string[],
  status: string,
  tone: Tone,
  updatedDate: string,
  updatedMeta: string,
  docs: number,
  diagrams: number,
  jobs: number,
): ProjectRow {
  return { id, name, description, tags, status, tone, updatedDate, updatedMeta, artifacts: { docs, diagrams, jobs } }
}

function normalizeStatus(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toneFromStatus(status: string): Tone {
  if (status.includes('planning')) return 'blue'
  if (status.includes('review')) return 'purple'
  if (status.includes('hold') || status.includes('archived')) return 'neutral'
  return 'green'
}

function tagsFromProject(name: string) {
  if (name.toLowerCase().includes('health')) return ['Healthcare', 'Scheduling']
  if (name.toLowerCase().includes('inventory')) return ['Logistics', 'Inventory']
  if (name.toLowerCase().includes('learning')) return ['Education', 'E-Learning']
  if (name.toLowerCase().includes('bank')) return ['Finance', 'Mobile']
  return ['E-Commerce', 'Retail']
}
