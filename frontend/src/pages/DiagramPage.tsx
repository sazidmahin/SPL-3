import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, History, ImageDown, Loader2, MoreHorizontal, Pencil, RotateCcw, Save, Trash2 } from 'lucide-react'
import { diagramApi, errorMessage, projectApi } from '../api'
import type { DiagramVersion } from '../api'
import { ErrorState, LoadingState } from '../app/components/PageStates'
import { RenameDialog } from '../app/components/RenameDialog'
import { href, navigate, routes } from '../app/core/router'
import { useSession } from '../app/core/session'
import { useAsync } from '../app/core/useAsync'
import { DrawioEmbed } from '../features/diagram/DrawioEmbed'
import type { DrawioEmbedHandle } from '../features/diagram/DrawioEmbed'
import { downloadDataUrl, downloadTextFile } from '../shared/download'
import { formatDateTime, relativeTime } from '../shared/format'
import {
  Button,
  Card,
  Chip,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
  useFeedback,
} from '../shared/ui'

function stem(title: string) {
  return title.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'diagram'
}

export function DiagramPage({ projectId, diagramId }: { projectId: string; diagramId: string }) {
  const { workspaceId, canEdit } = useSession()
  const { toast, confirm } = useFeedback()
  const diagram = useAsync(() => diagramApi.get(workspaceId, projectId, diagramId), [workspaceId, projectId, diagramId], Boolean(workspaceId))
  const versions = useAsync(() => diagramApi.versions(workspaceId, projectId, diagramId), [workspaceId, projectId, diagramId], Boolean(workspaceId))
  const project = useAsync(() => projectApi.get(workspaceId, projectId), [workspaceId, projectId], Boolean(workspaceId))
  const embed = useRef<DrawioEmbedHandle>(null)

  const [xml, setXml] = useState('')
  const [savedXml, setSavedXml] = useState('')
  const [syncedVersionId, setSyncedVersionId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<DiagramVersion | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState<'png' | 'jpeg' | null>(null)
  const [renaming, setRenaming] = useState(false)

  // Load the canvas from the server's current version whenever that version changes.
  const current = diagram.data?.current
  if (current && current.id !== syncedVersionId) {
    setSyncedVersionId(current.id)
    setXml(current.drawio_xml)
    setSavedXml(current.drawio_xml)
    setViewing(null)
  }

  const dirty = xml !== savedXml && !viewing

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  async function saveVersion(sourceXml = xml) {
    if (!diagram.data) return
    setSaving(true)
    try {
      const version = await diagramApi.saveVersion(workspaceId, projectId, diagram.data.id, sourceXml)
      diagram.setData({ ...diagram.data, current_version: version.version_number, current: version, updated_at: version.created_at })
      versions.setData((current) => [...(current ?? []), version])
      setSavedXml(sourceXml)
      setXml(sourceXml)
      setViewing(null)
      toast(`Saved version ${version.version_number}`)
    } catch (caught) {
      toast('Save failed', { description: errorMessage(caught), tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function exportImage(format: 'png' | 'jpeg') {
    if (!embed.current || !diagram.data) return
    setExporting(format)
    try {
      const dataUrl = await embed.current.exportImage(format)
      downloadDataUrl(`${stem(diagram.data.title)}.${format === 'jpeg' ? 'jpg' : 'png'}`, dataUrl)
    } catch (caught) {
      toast('Export failed', { description: errorMessage(caught), tone: 'error' })
    } finally {
      setExporting(null)
    }
  }

  async function remove() {
    if (!diagram.data) return
    const ok = await confirm({ title: `Delete “${diagram.data.title}”?`, description: 'The diagram and its version history are removed from the project.' })
    if (!ok) return
    try {
      await diagramApi.remove(workspaceId, projectId, diagram.data.id)
      toast('Diagram deleted')
      navigate(routes.diagrams())
    } catch (caught) {
      toast('Delete failed', { description: errorMessage(caught), tone: 'error' })
    }
  }

  async function openVersion(version: DiagramVersion) {
    if (dirty && !(await confirm({ title: 'Discard unsaved changes?', description: 'Opening an older version replaces what is on the canvas.', confirmLabel: 'Discard' }))) return
    if (version.version_number === diagram.data?.current_version) {
      setViewing(null)
      setXml(savedXml)
    } else {
      setViewing(version)
      setXml(version.drawio_xml)
    }
  }

  if (diagram.loading && !diagram.data) return <LoadingState rows={3} />
  if (diagram.error || !diagram.data) return <ErrorState message={diagram.error ?? 'Diagram not found'} onRetry={diagram.reload} />

  const data = diagram.data
  const orderedVersions = [...(versions.data ?? [])].sort((a, b) => b.version_number - a.version_number)

  return (
    <section className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={href(project.data ? routes.project(projectId, 'diagrams') : routes.diagrams())}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-fg-3 transition hover:text-accent"
          >
            <ArrowLeft className="size-3.5" /> {project.data?.name ?? 'Diagrams'}
          </a>
          <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-fg sm:text-[26px]">{data.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-3">
            <Chip tone={data.source === 'generated' ? 'ai' : 'muted'}>{data.source === 'generated' ? 'Generated' : 'Manual'}</Chip>
            <Chip tone="muted">{data.diagram_type}</Chip>
            <span>
              Version {data.current_version} · {relativeTime(data.updated_at)}
            </span>
            {dirty ? <Chip tone="warning">Unsaved changes</Chip> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            viewing ? (
              <Button onClick={() => void saveVersion(viewing.drawio_xml)} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <RotateCcw />} Restore v{viewing.version_number}
              </Button>
            ) : (
              <Button onClick={() => void saveVersion()} disabled={saving || !dirty}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />} Save version
              </Button>
            )
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <Download /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void exportImage('png')} disabled={exporting !== null}>
                <ImageDown /> PNG image
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void exportImage('jpeg')} disabled={exporting !== null}>
                <ImageDown /> JPG image
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => downloadTextFile(`${stem(data.title)}.drawio`, xml, 'application/xml;charset=utf-8')}>
                <Download /> draw.io file
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canEdit ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="px-2.5" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setRenaming(true)}>
                  <Pencil /> Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void remove()} className="text-danger data-[highlighted]:text-danger">
                  <Trash2 /> Delete diagram
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {viewing ? (
        <Card className="flex flex-col gap-2 border-warning/30 bg-warning/[0.06] px-4 py-3 text-[13px] text-fg sm:flex-row sm:items-center">
          <History className="size-4 shrink-0 text-warning" />
          <span className="flex-1">
            Viewing version {viewing.version_number} from {formatDateTime(viewing.created_at)}. Restore it to make it the current version.
          </span>
          <Button size="sm" variant="secondary" onClick={() => void openVersion(orderedVersions[0])}>
            Back to latest
          </Button>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <DrawioEmbed
          ref={embed}
          xml={xml}
          title={`${data.title} editor`}
          className="h-[min(72vh,44rem)] min-h-[26rem]"
          onChange={canEdit && !viewing ? setXml : undefined}
        />
        <Card className="p-3">
          <p className="mb-2 flex items-center gap-1.5 px-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-3">
            <History className="size-3.5" /> Versions
          </p>
          <ul className="grid max-h-[28rem] grid-cols-1 gap-1 overflow-y-auto">
            {orderedVersions.map((version) => {
              const current = version.version_number === data.current_version
              const shown = viewing ? viewing.id === version.id : current
              return (
                <li key={version.id}>
                  <button
                    type="button"
                    onClick={() => void openVersion(version)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition',
                      shown ? 'bg-accent/10 text-accent' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold">Version {version.version_number}</span>
                      <span className="block truncate text-[11px] text-fg-3">{formatDateTime(version.created_at)}</span>
                    </span>
                    {current ? <Chip tone="success">Current</Chip> : null}
                  </button>
                </li>
              )
            })}
            {!orderedVersions.length ? <li className="px-2.5 py-2 text-[13px] text-fg-3">No versions yet.</li> : null}
          </ul>
        </Card>
      </div>

      <RenameDialog
        open={renaming}
        title="Rename diagram"
        initialValue={data.title}
        onOpenChange={setRenaming}
        onSubmit={async (title) => {
          try {
            const renamed = await diagramApi.rename(workspaceId, projectId, data.id, title)
            diagram.setData({ ...data, title: renamed.title })
            toast('Diagram renamed')
          } catch (caught) {
            toast('Rename failed', { description: errorMessage(caught), tone: 'error' })
            throw caught
          }
        }}
      />
    </section>
  )
}
