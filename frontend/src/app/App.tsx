import '../App.css'
import { AuthView } from '../features/auth/AuthView'
import { BillingPanel } from '../features/billing/BillingPanel'
import { CreateDiagramPanel, DiagramsPanel } from '../features/diagram/DiagramPanels'
import { CreateProjectPanel, ProjectsPanel } from '../features/project/ProjectPanels'
import { SrsPanel } from '../features/srs/SrsPanel'
import { CreateWorkspacePanel, WorkspacePanel } from '../features/workspace/WorkspacePanels'
import { useAppController } from './useAppController'

export function App() {
  const controller = useAppController()
  const { session, error, signOut } = controller.shell

  if (!session) {
    return <AuthView {...controller.authView} />
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">SRS Diagram Platform</span>
          <h1>Workspace</h1>
        </div>
        <button className="secondary-button" type="button" onClick={signOut}>
          Sign out
        </button>
      </header>

      <section className="dashboard-grid">
        <article className="panel identity-panel">
          <span className="panel-label">Signed in</span>
          <h2>{session.user.full_name}</h2>
          <p>{session.user.email}</p>
        </article>

        <WorkspacePanel {...controller.workspacePanel} />
        <CreateWorkspacePanel {...controller.createWorkspacePanel} />
        <BillingPanel {...controller.billingPanel} />
        <ProjectsPanel {...controller.projectsPanel} />
        <CreateProjectPanel {...controller.createProjectPanel} />
        <SrsPanel {...controller.srsPanel} />
        <DiagramsPanel {...controller.diagramsPanel} />
        <CreateDiagramPanel {...controller.createDiagramPanel} />
      </section>

      {error ? <p className="status-message error-message">{error}</p> : null}
    </main>
  )
}
