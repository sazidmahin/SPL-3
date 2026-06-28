import type { FormEvent } from 'react'
import './ProjectPanels.css'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'

type ProjectsPanelProps = {
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  projects: Project[]
  isLoadingProjects: boolean
  onReload: () => void
  onSelectProject: (projectId: string) => void
}

export function ProjectsPanel({
  activeWorkspace,
  activeProject,
  projects,
  isLoadingProjects,
  onReload,
  onSelectProject,
}: ProjectsPanelProps) {
  return (
    <article className="panel projects-panel">
      <div className="panel-heading">
        <span className="panel-label">Projects</span>
        <button
          className="text-button"
          type="button"
          onClick={onReload}
          disabled={!activeWorkspace || isLoadingProjects}
        >
          {isLoadingProjects ? 'Loading' : 'Reload'}
        </button>
      </div>

      <div className="project-layout">
        <div className="project-list" aria-label="Projects">
          {projects.map((project) => (
            <button
              key={project.id}
              className={project.id === activeProject?.id ? 'project-option active' : 'project-option'}
              type="button"
              onClick={() => onSelectProject(project.id)}
            >
              <span>{project.name}</span>
              <small>{new Date(project.created_at).toLocaleDateString()}</small>
            </button>
          ))}
          {projects.length === 0 ? <p>No projects found.</p> : null}
        </div>

        <div className="project-detail">
          {activeProject ? (
            <>
              <span className="panel-label">Project</span>
              <h2>{activeProject.name}</h2>
              <p>{activeProject.description ?? 'No description'}</p>
            </>
          ) : (
            <p>No project selected.</p>
          )}
        </div>
      </div>
    </article>
  )
}

type CreateProjectPanelProps = {
  activeWorkspace: WorkspaceMembership | undefined
  projectName: string
  projectDescription: string
  isCreatingProject: boolean
  onProjectNameChange: (value: string) => void
  onProjectDescriptionChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CreateProjectPanel({
  activeWorkspace,
  projectName,
  projectDescription,
  isCreatingProject,
  onProjectNameChange,
  onProjectDescriptionChange,
  onSubmit,
}: CreateProjectPanelProps) {
  return (
    <article className="panel create-project-panel">
      <span className="panel-label">New project</span>
      <form className="project-form" onSubmit={onSubmit}>
        <label>
          Name
          <input value={projectName} onChange={(event) => onProjectNameChange(event.target.value)} required />
        </label>
        <label>
          Description
          <textarea
            value={projectDescription}
            onChange={(event) => onProjectDescriptionChange(event.target.value)}
            rows={3}
          />
        </label>
        <button className="primary-button" type="submit" disabled={!activeWorkspace || isCreatingProject}>
          {isCreatingProject ? 'Creating' : 'Create project'}
        </button>
      </form>
    </article>
  )
}