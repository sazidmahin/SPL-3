import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Bell,
  Blocks,
  Bot,
  Box,
  ChevronDown,
  Circle,
  Copy,
  Download,
  GitFork,
  Grid3X3,
  Hand,
  LayoutDashboard,
  Mail,
  Maximize,
  Menu,
  MousePointer2,
  PanelLeftClose,
  Redo2,
  Save,
  Search,
  Send,
  Settings2,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Undo2,
  User,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

type PaletteItem = {
  label: string
  icon: typeof Box
  tone: 'green' | 'purple' | 'dark'
}

type PropertyField = {
  label: string
  value: string
  multiline?: boolean
}

const paletteActions: PaletteItem[] = [
  { label: 'Action', icon: Box, tone: 'green' },
  { label: 'Sub-Activity', icon: Blocks, tone: 'green' },
  { label: 'Call Behavior Action', icon: Copy, tone: 'green' },
  { label: 'Send Signal', icon: Send, tone: 'purple' },
  { label: 'Accept Event Action', icon: Circle, tone: 'purple' },
]

const controlNodes: PaletteItem[] = [
  { label: 'Start', icon: Circle, tone: 'dark' },
  { label: 'End', icon: Circle, tone: 'dark' },
  { label: 'Decision', icon: GitFork, tone: 'dark' },
  { label: 'Merge', icon: GitFork, tone: 'dark' },
  { label: 'Fork', icon: LayoutDashboard, tone: 'dark' },
  { label: 'Join', icon: LayoutDashboard, tone: 'dark' },
]

const propertyFields: PropertyField[] = [
  { label: 'ID', value: 'action_5' },
  { label: 'Name', value: 'Confirm order' },
  { label: 'Description', value: 'Final confirmation of the order before processing payment.', multiline: true },
]

const nodes: Node[] = [
  { id: 'start', type: 'input', position: { x: 492, y: 20 }, data: { label: '' }, className: 'size-4! rounded-full! border-2! border-slate-900! bg-white!', selectable: false, draggable: false },
  { id: 'add-items', position: { x: 430, y: 88 }, data: { label: 'User adds items to cart' }, className: 'rounded-lg! border! border-slate-300! bg-white! px-3! py-2! text-sm! font-semibold! text-slate-800! shadow-sm!', draggable: false },
  { id: 'review', position: { x: 430, y: 178 }, data: { label: 'Review cart' }, className: 'rounded-lg! border! border-slate-300! bg-white! px-3! py-2! text-sm! font-semibold! text-slate-800! shadow-sm!', draggable: false },
  { id: 'decision', position: { x: 461, y: 270 }, data: { label: <span className="block -rotate-45 text-center text-xs font-bold text-slate-800">Proceed to checkout?</span> }, className: 'grid! size-27! rotate-45! place-items-center! rounded! border! border-slate-400! bg-white! shadow-sm!', draggable: false },
  { id: 'continue', position: { x: 280, y: 350 }, data: { label: 'Continue shopping' }, className: 'rounded-lg! border! border-slate-300! bg-white! px-3! py-2! text-xs! font-semibold! text-slate-800! shadow-sm!', draggable: false },
  { id: 'shipping', position: { x: 590, y: 350 }, data: { label: 'Enter shipping information' }, className: 'rounded-lg! border! border-slate-300! bg-white! px-3! py-2! text-xs! font-semibold! text-slate-800! shadow-sm!', draggable: false },
  { id: 'payment', position: { x: 590, y: 442 }, data: { label: 'Select payment method' }, className: 'rounded-lg! border! border-slate-300! bg-white! px-3! py-2! text-xs! font-semibold! text-slate-800! shadow-sm!', draggable: false },
  { id: 'confirm', position: { x: 590, y: 534 }, data: { label: 'Confirm order' }, className: 'rounded-lg! border-2! border-brand-500! bg-brand-50! px-3! py-2! text-xs! font-bold! text-brand-800! shadow-sm!', draggable: false },
  { id: 'fork', position: { x: 390, y: 636 }, data: { label: '' }, className: 'h-2! w-57! rounded-full! bg-slate-900!', selectable: false, draggable: false },
  { id: 'mail', position: { x: 385, y: 706 }, data: { label: <span className="flex items-center gap-2"><Mail size={20} />Send order confirmation</span> }, className: 'rounded-lg! border! border-slate-300! bg-white! px-3! py-2! text-sm! font-semibold! text-slate-800! shadow-sm!', draggable: false },
  { id: 'end', type: 'output', position: { x: 492, y: 825 }, data: { label: '' }, className: 'size-4! rounded-full! bg-slate-900!', selectable: false, draggable: false },
]

const edges: Edge[] = [
  { id: 'e-start-add', source: 'start', target: 'add-items', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-add-review', source: 'add-items', target: 'review', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-review-decision', source: 'review', target: 'decision', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-decision-continue', source: 'decision', target: 'continue', label: 'No', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-decision-shipping', source: 'decision', target: 'shipping', label: 'Yes', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-shipping-payment', source: 'shipping', target: 'payment', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-payment-confirm', source: 'payment', target: 'confirm', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-continue-fork', source: 'continue', target: 'fork', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-confirm-fork', source: 'confirm', target: 'fork', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-fork-mail', source: 'fork', target: 'mail', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
  { id: 'e-mail-end', source: 'mail', target: 'end', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#64748b', strokeWidth: 1.8 } },
]

export function DiagramEditorMock() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-400 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" id="diagram-editor">
      <EditorTopbar />
      <EditorCommandBar />
      <div className="grid min-h-180 grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        <ComponentPalette />
        <DiagramCanvas />
        <PropertiesPanel />
      </div>
    </section>
  )
}

function EditorTopbar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <button className={iconButton} type="button" aria-label="Toggle menu"><Menu size={20} /></button>
        <div>
          <h2 className="font-bold text-slate-950">Diagram Editor</h2>
          <nav className="mt-1 flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
            <a className="hover:text-brand-600" href="#projects">Projects</a>
            <ChevronDown size={14} />
            <a className="hover:text-brand-600" href="#project-workspace">E-Commerce System</a>
            <ChevronDown size={14} />
            <a className="hover:text-brand-600" href="#diagram-editor">Diagrams</a>
            <ChevronDown size={14} />
            <span>Checkout Process</span>
          </nav>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
        <label className="flex min-w-60 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:max-w-90">
          <Search size={18} />
          <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search projects, docs, diagrams..." />
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">Ctrl + K</kbd>
        </label>
        <button className="relative grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" type="button" aria-label="Notifications"><Bell size={19} /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">2</span></button>
        <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-brand-100 text-brand-700"><User size={20} /></span><div className="hidden sm:grid"><strong className="text-sm text-slate-900">Mahin Rahman</strong><small className="text-xs text-slate-500">Owner</small></div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  )
}

function EditorCommandBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
      <div className="flex items-center gap-2"><strong className="text-sm text-slate-950">Checkout Process</strong><span className="rounded bg-white px-1.5 py-0.5 text-xs font-bold text-slate-500">v1.2</span><small className="text-xs font-semibold text-emerald-600">Saved</small><button className="grid size-7 place-items-center rounded text-slate-500 hover:bg-white" type="button" aria-label="Favorite"><Star size={18} /></button>
      </div>
      <div className="flex flex-wrap items-center gap-1" aria-label="Diagram tools">
        <ToolButton icon={Undo2} label="Undo" />
        <ToolButton icon={Redo2} label="Redo" muted />
        <ToolButton icon={ZoomOut} label="Zoom Out" />
        <button className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white" type="button">100% <ChevronDown size={14} /></button>
        <ToolButton icon={ZoomIn} label="Zoom In" />
        <ToolButton icon={Maximize} label="Fit" />
        <ToolButton icon={Grid3X3} label="Grid" />
        <ToolButton icon={Settings2} label="Snap" />
        <button className="flex items-center gap-1.5 rounded bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700" type="button"><Sparkles size={18} />AI Generate</button>
        <ToolButton icon={Share2} label="Share" />
        <ToolButton icon={Download} label="Export" />
        <button className="flex items-center gap-1.5 rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700" type="button"><Save size={18} />Save</button>
        <button className={iconButton} type="button" aria-label="More options"><ChevronDown size={18} /></button>
      </div>
    </div>
  )
}

function ComponentPalette() {
  return (
    <aside className="relative grid content-start gap-4 border-r border-slate-200 bg-slate-50 p-3" aria-label="Diagram components">
      <div className="grid grid-cols-2 rounded-lg bg-slate-200 p-1"><button className="rounded-md bg-white px-2 py-1.5 text-sm font-bold text-brand-700 shadow-sm" type="button">Components</button><button className="rounded-md px-2 py-1.5 text-sm font-semibold text-slate-500" type="button">Outline</button>
      </div>
      <label><select className={fieldClass} defaultValue="activity">
          <option value="activity">Activity Diagram</option>
          <option value="sequence">Sequence Diagram</option>
          <option value="use-case">Use Case Diagram</option>
          <option value="class">Class Diagram</option>
        </select>
      </label>
      <PaletteGroup title="Actions" items={paletteActions} />
      <PaletteGroup title="Control Nodes" items={controlNodes} />
      <button className="absolute -right-3 top-3 z-10 grid size-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm" type="button" aria-label="Collapse palette"><PanelLeftClose size={16} /></button>
    </aside>
  )
}

function PaletteGroup({ title, items }: { title: string; items: PaletteItem[] }) {
  return (
    <section className="grid gap-2"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3><div className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-white" type="button" key={item.label}>
              <span className={paletteIconClass(item.tone)}><Icon size={18} /></span>
              {item.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function DiagramCanvas() {
  return (
    <main className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-slate-100"><div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 pt-2" role="tablist" aria-label="Diagram type tabs"><button className="shrink-0 border-b-2 border-brand-600 px-3 py-2 text-sm font-bold text-brand-700" type="button">Activity Diagram</button><button className="shrink-0 px-3 py-2 text-sm font-semibold text-slate-500" type="button">Sequence Diagram</button><button className="shrink-0 px-3 py-2 text-sm font-semibold text-slate-500" type="button">Use Case Diagram</button><button className="shrink-0 px-3 py-2 text-sm font-semibold text-slate-500" type="button">Class Diagram</button>
      </div>
      <div className="relative min-h-145">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          minZoom={0.45}
          maxZoom={1.7}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1.35} color="#d7deea" />
          <MiniMap className="rounded-lg! border! border-slate-200!" pannable zoomable nodeStrokeWidth={3} />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>
        <div className="absolute bottom-4 right-4 z-10 grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-label="Canvas mode"><button className="grid size-9 place-items-center bg-brand-50 text-brand-700" type="button" aria-label="Select"><MousePointer2 size={18} /></button><button className="grid size-9 place-items-center text-slate-500 hover:bg-slate-50" type="button" aria-label="Pan"><Hand size={18} /></button><button className="grid size-9 place-items-center text-slate-500 hover:bg-slate-50" type="button" aria-label="Components"><Grid3X3 size={18} /></button><button className="grid size-9 place-items-center text-slate-500 hover:bg-slate-50" type="button" aria-label="Comments"><Bot size={18} /></button>
        </div>
      </div>
    </main>
  )
}

function PropertiesPanel() {
  return (
    <aside className="grid content-start gap-4 border-l border-slate-200 bg-white p-3" aria-label="Element properties">
      <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1"><button className="rounded-md bg-white px-2 py-1.5 text-sm font-bold text-brand-700 shadow-sm" type="button">Properties</button><button className="rounded-md px-2 py-1.5 text-sm font-semibold text-slate-500" type="button">Style</button>
      </div>
      <section className="grid gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-slate-900">Element Type</h3><span className="rounded bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700">Action</span>
        </div>
        {propertyFields.map((field) => (
          <label className="grid gap-1.5" key={field.label}><span className="text-xs font-semibold text-slate-600">{field.label}</span>{field.multiline ? <textarea className={`${fieldClass} resize-y`} defaultValue={field.value} rows={3} /> : <input className={fieldClass} defaultValue={field.value} />}
          </label>
        ))}
      </section>
      <section className="grid gap-1 border-b border-slate-100 pb-4"><h3 className="mb-2 text-sm font-bold text-slate-900">Behavior</h3>
        <ToggleRow label="Is Concurrent" />
        <ToggleRow label="Is Interruptible" />
      </section>
      <section className="grid gap-2 border-b border-slate-100 pb-4"><h3 className="text-sm font-bold text-slate-900">Notes</h3><button className="w-fit text-sm font-bold text-brand-600 hover:text-brand-700" type="button">+ Add Note</button>
      </section>
      <section className="grid gap-2 border-b border-slate-100 pb-4"><h3 className="text-sm font-bold text-slate-900">Metadata</h3><dl className="grid gap-2 text-xs"><div className="flex justify-between gap-2"><dt className="text-slate-500">Created</dt><dd className="text-right text-slate-700">Jun 29, 2025, 10:24 AM</dd></div><div className="flex justify-between gap-2"><dt className="text-slate-500">Updated</dt><dd className="text-right text-slate-700">Jun 29, 2025, 11:08 AM</dd></div><div className="flex justify-between gap-2"><dt className="text-slate-500">Created by</dt><dd className="flex items-center gap-1 text-right text-slate-700"><span><User size={14} /></span>Mahin Rahman</dd></div>
        </dl>
      </section>
      <button className="flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50" type="button"><Trash2 size={16} />Delete Element</button>
    </aside>
  )
}

function ToggleRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1"><span className="text-sm text-slate-700">{label}</span><button className="relative h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white" type="button" aria-label={label}><i /></button>
    </div>
  )
}

function ToolButton({ icon: Icon, label, muted = false }: { icon: typeof Undo2; label: string; muted?: boolean }) {
  return (
    <button className={muted ? 'grid size-8 place-items-center rounded text-slate-300' : 'grid size-8 place-items-center rounded text-slate-600 hover:bg-white'} type="button" aria-label={label}>
      <Icon size={18} />
    </button>
  )
}

const iconButton = 'grid size-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100'
const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-100'
function paletteIconClass(tone: PaletteItem['tone']) { return tone === 'green' ? 'grid size-8 place-items-center rounded bg-emerald-100 text-emerald-700' : tone === 'purple' ? 'grid size-8 place-items-center rounded bg-brand-100 text-brand-700' : 'grid size-8 place-items-center rounded bg-slate-200 text-slate-700' }

