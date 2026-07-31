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
import './DiagramEditor.css'

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
  { id: 'start', type: 'input', position: { x: 492, y: 20 }, data: { label: '' }, className: 'flow-node start-dot', selectable: false, draggable: false },
  { id: 'add-items', position: { x: 430, y: 88 }, data: { label: 'User adds items to cart' }, className: 'flow-node action-node', draggable: false },
  { id: 'review', position: { x: 430, y: 178 }, data: { label: 'Review cart' }, className: 'flow-node action-node', draggable: false },
  { id: 'decision', position: { x: 461, y: 270 }, data: { label: <span className="decision-label">Proceed to checkout?</span> }, className: 'flow-node decision-node', draggable: false },
  { id: 'continue', position: { x: 280, y: 350 }, data: { label: 'Continue shopping' }, className: 'flow-node action-node small-action', draggable: false },
  { id: 'shipping', position: { x: 590, y: 350 }, data: { label: 'Enter shipping information' }, className: 'flow-node action-node small-action', draggable: false },
  { id: 'payment', position: { x: 590, y: 442 }, data: { label: 'Select payment method' }, className: 'flow-node action-node small-action', draggable: false },
  { id: 'confirm', position: { x: 590, y: 534 }, data: { label: 'Confirm order' }, className: 'flow-node action-node small-action selected-action', draggable: false },
  { id: 'fork', position: { x: 390, y: 636 }, data: { label: '' }, className: 'flow-node fork-node', selectable: false, draggable: false },
  { id: 'mail', position: { x: 385, y: 706 }, data: { label: <span className="mail-node-label"><Mail size={20} />Send order confirmation</span> }, className: 'flow-node signal-node', draggable: false },
  { id: 'end', type: 'output', position: { x: 492, y: 825 }, data: { label: '' }, className: 'flow-node end-dot', selectable: false, draggable: false },
]

const edges: Edge[] = [
  { id: 'e-start-add', source: 'start', target: 'add-items', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge' },
  { id: 'e-add-review', source: 'add-items', target: 'review', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge' },
  { id: 'e-review-decision', source: 'review', target: 'decision', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge' },
  { id: 'e-decision-continue', source: 'decision', target: 'continue', label: 'No', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge labelled-edge' },
  { id: 'e-decision-shipping', source: 'decision', target: 'shipping', label: 'Yes', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge labelled-edge' },
  { id: 'e-shipping-payment', source: 'shipping', target: 'payment', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge' },
  { id: 'e-payment-confirm', source: 'payment', target: 'confirm', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge' },
  { id: 'e-continue-fork', source: 'continue', target: 'fork', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge' },
  { id: 'e-confirm-fork', source: 'confirm', target: 'fork', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge' },
  { id: 'e-fork-mail', source: 'fork', target: 'mail', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge' },
  { id: 'e-mail-end', source: 'mail', target: 'end', markerEnd: { type: MarkerType.ArrowClosed }, className: 'flow-edge' },
]

export function DiagramEditorMock() {
  return (
    <section className="diagram-editor-shell" id="diagram-editor">
      <EditorTopbar />
      <EditorCommandBar />
      <div className="diagram-editor-body">
        <ComponentPalette />
        <DiagramCanvas />
        <PropertiesPanel />
      </div>
    </section>
  )
}

function EditorTopbar() {
  return (
    <header className="editor-topbar">
      <div className="editor-title-group">
        <button className="icon-frame" type="button" aria-label="Toggle menu"><Menu size={20} /></button>
        <div>
          <h2>Diagram Editor</h2>
          <nav aria-label="Breadcrumb">
            <a href="#projects">Projects</a>
            <ChevronDown size={14} />
            <a href="#project-workspace">E-Commerce System</a>
            <ChevronDown size={14} />
            <a href="#diagram-editor">Diagrams</a>
            <ChevronDown size={14} />
            <span>Checkout Process</span>
          </nav>
        </div>
      </div>

      <div className="editor-top-actions">
        <label className="editor-search">
          <Search size={18} />
          <input placeholder="Search projects, docs, diagrams..." />
          <kbd>Ctrl + K</kbd>
        </label>
        <button className="icon-frame has-badge" type="button" aria-label="Notifications"><Bell size={19} /><span>2</span></button>
        <div className="editor-user-chip">
          <span><User size={20} /></span>
          <div><strong>Mahin Rahman</strong><small>Owner</small></div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  )
}

function EditorCommandBar() {
  return (
    <div className="editor-command-bar">
      <div className="diagram-name-row">
        <strong>Checkout Process</strong>
        <span>v1.2</span>
        <small>Saved</small>
        <button className="icon-plain" type="button" aria-label="Favorite"><Star size={18} /></button>
      </div>
      <div className="editor-tools" aria-label="Diagram tools">
        <ToolButton icon={Undo2} label="Undo" />
        <ToolButton icon={Redo2} label="Redo" muted />
        <ToolButton icon={ZoomOut} label="Zoom Out" />
        <button className="zoom-select" type="button">100% <ChevronDown size={14} /></button>
        <ToolButton icon={ZoomIn} label="Zoom In" />
        <ToolButton icon={Maximize} label="Fit" />
        <ToolButton icon={Grid3X3} label="Grid" />
        <ToolButton icon={Settings2} label="Snap" />
        <button className="ai-generate-button" type="button"><Sparkles size={18} />AI Generate</button>
        <ToolButton icon={Share2} label="Share" />
        <ToolButton icon={Download} label="Export" />
        <button className="save-diagram-button" type="button"><Save size={18} />Save</button>
        <button className="icon-frame" type="button" aria-label="More options"><ChevronDown size={18} /></button>
      </div>
    </div>
  )
}

function ComponentPalette() {
  return (
    <aside className="component-palette" aria-label="Diagram components">
      <div className="palette-tabs">
        <button className="active" type="button">Components</button>
        <button type="button">Outline</button>
      </div>
      <label className="diagram-type-select">
        <select defaultValue="activity">
          <option value="activity">Activity Diagram</option>
          <option value="sequence">Sequence Diagram</option>
          <option value="use-case">Use Case Diagram</option>
          <option value="class">Class Diagram</option>
        </select>
      </label>
      <PaletteGroup title="Actions" items={paletteActions} />
      <PaletteGroup title="Control Nodes" items={controlNodes} />
      <button className="collapse-palette" type="button" aria-label="Collapse palette"><PanelLeftClose size={18} /></button>
    </aside>
  )
}

function PaletteGroup({ title, items }: { title: string; items: PaletteItem[] }) {
  return (
    <section className="palette-group">
      <h3>{title}</h3>
      <div>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button className="palette-item" type="button" key={item.label}>
              <span className={`palette-icon tone-${item.tone}`}><Icon size={18} /></span>
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
    <main className="diagram-canvas-panel">
      <div className="diagram-tabs" role="tablist" aria-label="Diagram type tabs">
        <button className="active" type="button">Activity Diagram</button>
        <button type="button">Sequence Diagram</button>
        <button type="button">Use Case Diagram</button>
        <button type="button">Class Diagram</button>
      </div>
      <div className="flow-stage">
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
          <MiniMap className="checkout-minimap" pannable zoomable nodeStrokeWidth={3} />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>
        <div className="canvas-mode-switcher" aria-label="Canvas mode">
          <button className="active" type="button" aria-label="Select"><MousePointer2 size={18} /></button>
          <button type="button" aria-label="Pan"><Hand size={18} /></button>
          <button type="button" aria-label="Components"><Grid3X3 size={18} /></button>
          <button type="button" aria-label="Comments"><Bot size={18} /></button>
        </div>
      </div>
    </main>
  )
}

function PropertiesPanel() {
  return (
    <aside className="properties-panel" aria-label="Element properties">
      <div className="properties-tabs">
        <button className="active" type="button">Properties</button>
        <button type="button">Style</button>
      </div>
      <section className="property-section">
        <div className="property-heading-row">
          <h3>Element Type</h3>
          <span>Action</span>
        </div>
        {propertyFields.map((field) => (
          <label className="property-field" key={field.label}>
            <span>{field.label}</span>
            {field.multiline ? <textarea defaultValue={field.value} rows={3} /> : <input defaultValue={field.value} />}
          </label>
        ))}
      </section>
      <section className="property-section">
        <h3>Behavior</h3>
        <ToggleRow label="Is Concurrent" />
        <ToggleRow label="Is Interruptible" />
      </section>
      <section className="property-section">
        <h3>Notes</h3>
        <button className="add-note-button" type="button">+ Add Note</button>
      </section>
      <section className="property-section metadata-section">
        <h3>Metadata</h3>
        <dl>
          <div><dt>Created</dt><dd>Jun 29, 2025, 10:24 AM</dd></div>
          <div><dt>Updated</dt><dd>Jun 29, 2025, 11:08 AM</dd></div>
          <div><dt>Created by</dt><dd><span><User size={16} /></span>Mahin Rahman</dd></div>
        </dl>
      </section>
      <button className="delete-element-button" type="button"><Trash2 size={16} />Delete Element</button>
    </aside>
  )
}

function ToggleRow({ label }: { label: string }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button type="button" aria-label={label}><i /></button>
    </div>
  )
}

function ToolButton({ icon: Icon, label, muted = false }: { icon: typeof Undo2; label: string; muted?: boolean }) {
  return (
    <button className={muted ? 'editor-tool muted' : 'editor-tool'} type="button">
      <Icon size={18} />
      <span>{label}</span>
    </button>
  )
}

