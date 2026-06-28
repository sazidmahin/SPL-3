import type { FormEvent } from 'react'
import './DiagramPanels.css'
import type { Diagram, DiagramVersion } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'

type DiagramsPanelProps = {
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  activeDiagram: Diagram | undefined
  diagrams: Diagram[]
  diagramVersions: DiagramVersion[]
  diagramXml: string
  isLoadingDiagrams: boolean
  isSavingDiagram: boolean
  canUseManualDrawio: boolean
  canExportDiagrams: boolean
  onReload: () => void
  onSelectDiagram: (diagramId: string) => void
  onDiagramXmlChange: (value: string) => void
  onResetXml: () => void
  onSaveVersion: () => void
  onExportDiagram: () => void
}

export function DiagramsPanel({
  activeWorkspace,
  activeProject,
  activeDiagram,
  diagrams,
  diagramVersions,
  diagramXml,
  isLoadingDiagrams,
  isSavingDiagram,
  canUseManualDrawio,
  canExportDiagrams,
  onReload,
  onSelectDiagram,
  onDiagramXmlChange,
  onResetXml,
  onSaveVersion,
  onExportDiagram,
}: DiagramsPanelProps) {
  return (
    <article className="panel diagrams-panel">
      <div className="panel-heading">
        <span className="panel-label">Manual diagrams</span>
        <button
          className="text-button"
          type="button"
          onClick={onReload}
          disabled={!activeWorkspace || !activeProject || isLoadingDiagrams}
        >
          {isLoadingDiagrams ? 'Loading' : 'Reload'}
        </button>
      </div>
      {!canUseManualDrawio ? <p className="upgrade-prompt">Upgrade to use manual Draw.io editing.</p> : null}

      <div className="diagram-layout">
        <div className="diagram-list" aria-label="Diagrams">
          {diagrams.map((diagram) => (
            <button
              key={diagram.id}
              className={diagram.id === activeDiagram?.id ? 'diagram-option active' : 'diagram-option'}
              type="button"
              onClick={() => onSelectDiagram(diagram.id)}
            >
              <span>{diagram.title}</span>
              <small>
                {diagram.diagram_type} / v{diagram.current_version}
              </small>
            </button>
          ))}
          {diagrams.length === 0 ? <p>No diagrams found.</p> : null}
        </div>

        <div className="drawio-editor">
          <iframe
            className="drawio-frame"
            src="https://embed.diagrams.net/?embed=1&proto=json&spin=1&ui=min"
            title="Draw.io editor"
          />
          <label>
            Draw.io XML
            <textarea
              value={diagramXml}
              onChange={(event) => onDiagramXmlChange(event.target.value)}
              rows={8}
              disabled={!canUseManualDrawio}
            />
          </label>
          <div className="diagram-actions">
            <button className="secondary-button" type="button" onClick={onResetXml} disabled={!canUseManualDrawio}>
              Blank XML
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onExportDiagram}
              disabled={!activeDiagram || !canExportDiagrams}
            >
              Export diagram
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={onSaveVersion}
              disabled={!activeDiagram || isSavingDiagram || !canUseManualDrawio}
            >
              {isSavingDiagram ? 'Saving' : 'Save version'}
            </button>
          </div>
          {!canExportDiagrams ? <p className="upgrade-prompt">Upgrade to export diagrams.</p> : null}
        </div>

        <div className="diagram-versions" aria-label="Diagram versions">
          <span className="panel-label">Versions</span>
          {diagramVersions.map((version) => (
            <button
              key={version.id}
              className="version-option"
              type="button"
              onClick={() => onDiagramXmlChange(version.drawio_xml)}
            >
              Version {version.version_number}
            </button>
          ))}
          {diagramVersions.length === 0 ? <p>No versions.</p> : null}
        </div>
      </div>
    </article>
  )
}

type CreateDiagramPanelProps = {
  activeProject: Project | undefined
  diagramTitle: string
  diagramType: string
  isCreatingDiagram: boolean
  canUseManualDrawio: boolean
  onDiagramTitleChange: (value: string) => void
  onDiagramTypeChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CreateDiagramPanel({
  activeProject,
  diagramTitle,
  diagramType,
  isCreatingDiagram,
  canUseManualDrawio,
  onDiagramTitleChange,
  onDiagramTypeChange,
  onSubmit,
}: CreateDiagramPanelProps) {
  return (
    <article className="panel create-diagram-panel">
      <span className="panel-label">New manual diagram</span>
      <form className="diagram-form" onSubmit={onSubmit}>
        <label>
          Title
          <input value={diagramTitle} onChange={(event) => onDiagramTitleChange(event.target.value)} required />
        </label>
        <label>
          Type
          <select value={diagramType} onChange={(event) => onDiagramTypeChange(event.target.value)}>
            <option value="class">Class</option>
            <option value="flowchart">Flowchart</option>
            <option value="sequence">Sequence</option>
            <option value="other">Other</option>
          </select>
        </label>
        <button
          className="primary-button"
          type="submit"
          disabled={!activeProject || isCreatingDiagram || !canUseManualDrawio}
        >
          {isCreatingDiagram ? 'Creating' : 'Create diagram'}
        </button>
      </form>
      {!canUseManualDrawio ? <p className="upgrade-prompt">Upgrade to create manual diagrams.</p> : null}
    </article>
  )
}