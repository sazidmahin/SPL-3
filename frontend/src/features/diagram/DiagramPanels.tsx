import type { FormEvent } from 'react'
import type { Diagram, DiagramVersion } from '../../domains/diagram/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import { Button, Card, Field, Input, PageHeader, Select, Textarea, cn } from '../../shared/ui'
import { DrawioEmbed } from './DrawioEmbed'

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

const optionClass = 'grid w-full gap-1 rounded-md border px-3 py-2.5 text-left text-sm transition'

function UpgradeNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-warning/25 bg-warning/10 p-3 text-[13px] font-medium text-warning">{children}</p>
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
    <Card className="grid gap-4 p-5">
      <PageHeader
        size="section"
        eyebrow="Manual diagrams"
        title="Draw.io editor"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={onReload}
            disabled={!activeWorkspace || !activeProject || isLoadingDiagrams}
          >
            {isLoadingDiagrams ? 'Loading…' : 'Reload'}
          </Button>
        }
      />
      {!canUseManualDrawio ? <UpgradeNote>Upgrade to use manual Draw.io editing.</UpgradeNote> : null}
      <div className="grid gap-5 xl:grid-cols-[13.75rem_minmax(0,1fr)_10rem]">
        <div className="grid content-start gap-2" aria-label="Diagrams">
          {diagrams.map((diagram) => (
            <button
              key={diagram.id}
              type="button"
              onClick={() => onSelectDiagram(diagram.id)}
              className={cn(
                optionClass,
                diagram.id === activeDiagram?.id
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:bg-surface-2',
              )}
            >
              <span className="font-semibold text-fg">{diagram.title}</span>
              <small className="text-xs text-fg-3">
                {diagram.diagram_type} · v{diagram.current_version}
              </small>
            </button>
          ))}
          {diagrams.length === 0 ? <p className="text-[13px] text-fg-3">No diagrams found.</p> : null}
        </div>
        <div className="grid min-w-0 gap-3">
          {diagramXml ? (
            <DrawioEmbed xml={diagramXml} title="Draw.io diagram preview" className="h-96" />
          ) : (
            <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-3">Select a diagram to preview it.</p>
          )}
          <Field label="Draw.io XML">
            <Textarea
              className="min-h-40 font-mono text-xs"
              value={diagramXml}
              onChange={(event) => onDiagramXmlChange(event.target.value)}
              rows={8}
              disabled={!canUseManualDrawio}
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="secondary" size="sm" onClick={onResetXml} disabled={!canUseManualDrawio}>
              Blank XML
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onExportDiagram}
              disabled={!activeDiagram || !canExportDiagrams}
            >
              Export diagram
            </Button>
            <Button
              size="sm"
              onClick={onSaveVersion}
              disabled={!activeDiagram || isSavingDiagram || !canUseManualDrawio}
            >
              {isSavingDiagram ? 'Saving…' : 'Save version'}
            </Button>
          </div>
          {!canExportDiagrams ? <UpgradeNote>Upgrade to export diagrams.</UpgradeNote> : null}
        </div>
        <div className="grid content-start gap-2" aria-label="Diagram versions">
          <span className="text-[11px] font-bold uppercase tracking-wide text-accent">Versions</span>
          {diagramVersions.map((version) => (
            <button
              key={version.id}
              type="button"
              onClick={() => onDiagramXmlChange(version.drawio_xml)}
              className={cn(optionClass, 'border-border hover:bg-surface-2')}
            >
              Version {version.version_number}
            </button>
          ))}
          {diagramVersions.length === 0 ? <p className="text-[13px] text-fg-3">No versions.</p> : null}
        </div>
      </div>
    </Card>
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
    <Card className="grid gap-4 p-5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-accent">New manual diagram</span>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Title">
          <Input value={diagramTitle} onChange={(event) => onDiagramTitleChange(event.target.value)} required />
        </Field>
        <Field label="Type">
          <Select value={diagramType} onChange={(event) => onDiagramTypeChange(event.target.value)}>
            <option value="class">Class</option>
            <option value="flowchart">Flowchart</option>
            <option value="sequence">Sequence</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Button
          type="submit"
          className="sm:col-span-2"
          disabled={!activeProject || isCreatingDiagram || !canUseManualDrawio}
        >
          {isCreatingDiagram ? 'Creating…' : 'Create diagram'}
        </Button>
      </form>
      {!canUseManualDrawio ? <UpgradeNote>Upgrade to create manual diagrams.</UpgradeNote> : null}
    </Card>
  )
}
