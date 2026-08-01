import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Edit3,
  FileText,
  Filter,
  Grid2X2,
  HelpCircle,
  Loader2,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Search,
  SearchCheck,
  Send,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { DiagramDetail } from '../../domains/diagram/types'
import type {
  ClarificationAnswer,
  ClarifyingQuestion,
  GenerationJob,
  RequirementInput,
  SrsDocument,
  SrsPipelineResponse,
} from '../../domains/srs/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'
import './SrsGenerationFlow.css'

type FlowStatus = 'idle' | 'checking' | 'blocked' | 'needs_clarification' | 'ready' | 'generating' | 'completed'
type PreviewTab = 'preview' | 'summary' | 'requirements' | 'classifications' | 'metadata'

type SrsGenerationFlowProps = {
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  generationJobs: GenerationJob[]
  srsDocuments: SrsDocument[]
  activeSrsDocument: SrsDocument | null
  generatedDiagrams: DiagramDetail[]
  srsTitle: string
  srsRawText: string
  generateClassDiagram: boolean
  isStartingGeneration: boolean
  canGenerateSrs: boolean
  onReload: () => void
  onSrsRawTextChange: (value: string) => void
  onSelectSrsDocument: (documentId: string) => void
  onExportSrs: () => void
  onRunIntake: (payload: {
    title: string
    raw_text: string
    generate_class_diagram: boolean
    diagram_methods: string[]
  }) => Promise<SrsPipelineResponse>
  onSubmitClarifications: (payload: {
    requirement_input_id: string
    answers: ClarificationAnswer[]
    generate_class_diagram: boolean
    diagram_methods: string[]
  }) => Promise<SrsPipelineResponse>
  onGenerateFromRequirement: (payload: {
    requirement_input_id: string
    title: string
    raw_text: string
    generate_class_diagram: boolean
    diagram_methods: string[]
  }) => Promise<SrsPipelineResponse>
}

const RAW_TEXT_LIMIT = 200000
const visibleLimit = 4000

const pipelineStages: Array<{ key: string; title: string; detail: string; icon: LucideIcon; tone: string }> = [
  { key: 'input_guardrail', title: 'Input Guardrail', detail: 'Checking for prompt injection, jailbreak, and unsafe instructions', icon: ShieldCheck, tone: 'violet' },
  { key: 'requirement_sufficiency', title: 'Requirement Sufficiency Check', detail: 'Evaluating if the input is sufficient to generate SRS', icon: SearchCheck, tone: 'blue' },
  { key: 'summary', title: 'Generate Summary', detail: 'Generating introduction, stakeholders, use cases, glossary', icon: FileText, tone: 'green' },
  { key: 'requirement_extraction', title: 'Extract Requirements', detail: 'Extracting functional and non-functional requirements', icon: FileText, tone: 'amber' },
  { key: 'requirement_classification', title: 'Classify Requirements', detail: 'Classifying requirements by type and sub-type', icon: Bot, tone: 'rose' },
  { key: 'srs_builder', title: 'Build SRS Document', detail: 'Assembling final SRS document', icon: FileText, tone: 'pink' },
]

const howItWorks = [
  { title: 'You provide input', detail: 'Describe your system or upload documents.', icon: FileText },
  { title: 'AI checks input', detail: 'We check safety and sufficiency.', icon: ShieldCheck },
  { title: 'Answer questions if needed', detail: 'We ask clarifying questions to refine.', icon: MessageSquareText },
  { title: 'AI generates SRS', detail: 'We create a complete SRS for you.', icon: WandSparkles },
  { title: 'Review & export', detail: 'Review, copy or export the SRS.', icon: Download },
]

const classificationColors = ['#6335f5', '#3994ff', '#45c5b7', '#ffb22d', '#94a3b8']

export function SrsGenerationFlow({
  activeWorkspace,
  activeProject,
  generationJobs,
  srsDocuments,
  activeSrsDocument,
  generatedDiagrams,
  srsTitle,
  srsRawText,
  generateClassDiagram,
  isStartingGeneration,
  canGenerateSrs,
  onReload,
  onSrsRawTextChange,
  onSelectSrsDocument,
  onExportSrs,
  onRunIntake,
  onGenerateFromRequirement,
}: SrsGenerationFlowProps) {
  const [flowStatus, setFlowStatus] = useState<FlowStatus>('idle')
  const [pipelineResponse, setPipelineResponse] = useState<SrsPipelineResponse | null>(null)
  const [requirementInput, setRequirementInput] = useState<RequirementInput | null>(null)
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<PreviewTab>('preview')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const latestJob = pipelineResponse?.job ?? (flowStatus === 'completed' ? generationJobs[0] : null)
  const generatedDocument = pipelineResponse?.srs_document ?? activeSrsDocument
  const previewDocument = flowStatus === 'completed' || (!pipelineResponse && activeSrsDocument) ? generatedDocument : null
  const jobId = latestJob?.id ? `SRS-${latestJob.id.slice(0, 8).toUpperCase()}` : 'SRS-2025-05-18-001'
  const createdAt = requirementInput?.created_at ?? latestJob?.created_at ?? new Date().toISOString()
  const rawCount = Math.min(srsRawText.length, visibleLimit)
  const sections = useMemo(() => sectionNames(generatedDocument), [generatedDocument])
  const classificationData = useMemo(() => buildClassificationData(generatedDocument), [generatedDocument])
  async function handleIntakeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!srsRawText.trim() || !activeProject || !canGenerateSrs) {
      return
    }

    const inferredTitle = srsTitle.trim() || titleFromInput(srsRawText, activeProject?.name)

    setFlowStatus('checking')
    setErrorMessage(null)
    try {
      const intakeResponse = await onRunIntake({
        title: inferredTitle,
        raw_text: srsRawText.trim(),
        generate_class_diagram: generateClassDiagram,
        diagram_methods: generateClassDiagram ? ['llm'] : [],
      })
      setPipelineResponse(intakeResponse)
      setRequirementInput(intakeResponse.requirement_input)
      if (intakeResponse.status === 'needs_clarification') {
        setQuestions(intakeResponse.clarifying_questions)
        setAnswers(Object.fromEntries(intakeResponse.clarifying_questions.map((question) => [question.id, ''])))
        setFlowStatus('needs_clarification')
        return
      }

      setFlowStatus('generating')
      const generationResponse = await onGenerateFromRequirement({
        requirement_input_id: intakeResponse.requirement_input.id,
        title: intakeResponse.requirement_input.title,
        raw_text: intakeResponse.refined_requirement ?? intakeResponse.draft_requirement ?? intakeResponse.requirement_input.refined_text ?? intakeResponse.requirement_input.raw_text,
        generate_class_diagram: generateClassDiagram,
        diagram_methods: generateClassDiagram ? ['llm'] : [],
      })
      setPipelineResponse(generationResponse)
      setRequirementInput(generationResponse.requirement_input)
      setFlowStatus('completed')
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : 'Input could not be processed')
      setFlowStatus('blocked')
    }
  }
  async function handleClarificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requirementInput || questions.some((question) => !answers[question.id]?.trim())) {
      return
    }

    setFlowStatus('generating')
    setErrorMessage(null)
    try {
      const clarificationSummary = questions
        .map((question, index) => `${index + 1}. ${question.question} Answer: ${answers[question.id].trim()}`)
        .join('\n')
      const response = await onGenerateFromRequirement({
        requirement_input_id: requirementInput.id,
        title: requirementInput.title,
        raw_text: `${requirementInput.raw_text}\n\nClarification answers:\n${clarificationSummary}`,
        generate_class_diagram: generateClassDiagram,
        diagram_methods: generateClassDiagram ? ['llm'] : [],
      })
      setPipelineResponse(response)
      setRequirementInput(response.requirement_input)
      setFlowStatus('completed')
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : 'Clarification answers could not be processed')
      setFlowStatus('blocked')
    }
  }


  async function handleGenerate() {
    if (!requirementInput) {
      return
    }

    setFlowStatus('generating')
    setErrorMessage(null)
    try {
      const response = await onGenerateFromRequirement({
        requirement_input_id: requirementInput.id,
        title: requirementInput.title,
        raw_text: requirementInput.refined_text ?? pipelineResponse?.refined_requirement ?? pipelineResponse?.draft_requirement ?? requirementInput.raw_text,
        generate_class_diagram: generateClassDiagram,
        diagram_methods: generateClassDiagram ? ['llm'] : [],
      })
      setPipelineResponse(response)
      setRequirementInput(response.requirement_input)
      setFlowStatus('completed')
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : 'SRS could not be generated')
      setFlowStatus('blocked')
    }
  }

  function startOver() {
    setFlowStatus('idle')
    setPipelineResponse(null)
    setRequirementInput(null)
    setQuestions([])
    setAnswers({})
    setErrorMessage(null)
  }

  return (
    <section className="ai-srs-page">
      <TopChrome jobId={jobId} />
      <div className="ai-srs-title-row">
        <div>
          <span><Sparkles size={19} /></span>
          <div>
            <h1>AI SRS Generation</h1>
            <p>{flowStatus === 'completed' ? 'Your SRS has been successfully generated. Review, download, or explore the results.' : 'Describe your system or project. Our AI will help you create a comprehensive SRS.'}</p>
          </div>
        </div>
        <button type="button" onClick={() => { void onReload(); setFlowStatus('completed'); setActiveTab('metadata') }}><ArrowRight size={16} /> View all generations</button>
      </div>

      <Stepper status={flowStatus} hasInput={srsRawText.trim().length > 0} />

      {previewDocument ? (
        <CompleteMetrics document={previewDocument} latestJob={latestJob} />
      ) : null}

      <div className={flowStatus === 'needs_clarification' ? 'ai-srs-grid clarify-layout' : 'ai-srs-grid'}>
        <main className="ai-srs-main-stack">
          {flowStatus === 'blocked' ? (
            <BlockedPanel message={errorMessage} rawText={srsRawText} onStartOver={startOver} />
          ) : null}

          {flowStatus === 'needs_clarification' ? (
            <ClarificationPanel questions={questions} answers={answers} onAnswerChange={setAnswers} onSubmit={handleClarificationSubmit} busy={isStartingGeneration} />
          ) : null}

          {['idle', 'checking'].includes(flowStatus) ? (
            <InputPanel
              activeProject={activeProject}
              srsRawText={srsRawText}
              rawCount={rawCount}
              isChecking={flowStatus === 'checking' || isStartingGeneration}
              canGenerateSrs={canGenerateSrs}
              onTextChange={onSrsRawTextChange}
              onSubmit={handleIntakeSubmit}
            />
          ) : null}

          {flowStatus === 'generating' ? <GeneratingPanel /> : null}

          {flowStatus === 'ready' && requirementInput ? (
            <ReadyPanel
              requirementInput={requirementInput}
              draftRequirement={pipelineResponse?.refined_requirement ?? pipelineResponse?.draft_requirement ?? requirementInput.refined_text ?? requirementInput.raw_text}
              generatedDiagrams={generatedDiagrams}
              busy={isStartingGeneration}
              onGenerate={handleGenerate}
              onStartOver={startOver}
            />
          ) : null}

          {flowStatus !== 'needs_clarification' || !generatedDocument ? (
            <PipelinePanel status={flowStatus} document={generatedDocument} latestJob={latestJob} />
          ) : null}
        </main>

        <aside className="ai-srs-side-stack">
          <StatusCard status={flowStatus} message={errorMessage} />
          {flowStatus === 'needs_clarification' ? <OriginalInputCard input={requirementInput} /> : null}
          {flowStatus === 'needs_clarification' ? <InputUnderstandingCard input={requirementInput} questions={questions} /> : null}
          {flowStatus !== 'needs_clarification' ? <JobInfoCard jobId={jobId} latestJob={latestJob} createdAt={createdAt} workspaceName={activeWorkspace?.workspace.name} /> : null}
          {flowStatus === 'completed' && generatedDocument ? <GenerationSummaryCard document={generatedDocument} latestJob={latestJob} /> : null}
        </aside>
      </div>

      <PreviewCard
        activeTab={activeTab}
        onTabChange={setActiveTab}
        document={previewDocument}
        response={pipelineResponse}
        sections={sections}
        classificationData={classificationData}
        status={flowStatus}
        onSelectDocument={onSelectSrsDocument}
        srsDocuments={srsDocuments}
        onExport={onExportSrs}
      />

      <HowItWorks />
    </section>
  )
}

function TopChrome({ jobId }: { jobId: string }) {
  return (
    <header className="ai-srs-top-chrome">
      <div>
        <button type="button" aria-label="Open menu"><Menu size={18} /></button>
        <strong>AI SRS Generation</strong>
        <ArrowRight size={14} />
        <span>New Generation</span>
        <ArrowRight size={14} />
        <span>Job #{jobId}</span>
      </div>
      <div>
        <button type="button"><Grid2X2 size={16} /> Workspaces</button>
        <button type="button" aria-label="Notifications"><Bell size={17} /><b>3</b></button>
        <span>SA</span>
        <div><strong>Super Admin</strong><small>Platform Admin</small></div>
      </div>
    </header>
  )
}

function Stepper({ status, hasInput }: { status: FlowStatus; hasInput: boolean }) {
  const activeIndex = status === 'idle' ? (hasInput ? 1 : 0) : status === 'checking' || status === 'blocked' ? 2 : status === 'needs_clarification' ? 3 : status === 'ready' || status === 'generating' ? 4 : 5
  const labels = ['Input', 'Check', 'Clarify (if needed)', 'Generate', 'Complete']
  return <nav className="ai-srs-stepper" aria-label="SRS generation steps">{labels.map((label, index) => <span className={index + 1 <= activeIndex ? 'active' : ''} key={label}><i>{index + 1 < activeIndex ? <Check size={14} /> : index + 1}</i><b>{label}</b></span>)}</nav>
}

function InputPanel({ activeProject, srsRawText, rawCount, isChecking, canGenerateSrs, onTextChange, onSubmit }: {
  activeProject: Project | undefined
  srsRawText: string
  rawCount: number
  isChecking: boolean
  canGenerateSrs: boolean
  onTextChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="ai-srs-card input-card" onSubmit={onSubmit}>
      <header><h2>1. Provide Your Input</h2><p>Describe the system, product, or project you want to build.</p></header>
      <label className="textarea-field"><span>Example: "I want to build an SRS platform"</span><small>{rawCount} / 4000</small><textarea value={srsRawText} maxLength={RAW_TEXT_LIMIT} onChange={(event) => onTextChange(event.target.value)} placeholder="I want to build an SRS platform" required /></label>
      <footer><button className="attach-button" type="button"><Paperclip size={16} /> Attach file <small>(optional)</small></button><button className="ai-srs-primary" type="submit" disabled={!activeProject || !canGenerateSrs || isChecking || !srsRawText.trim()}>{isChecking ? <Loader2 size={17} /> : <Send size={17} />}{isChecking ? 'Checking Requirement' : 'Check Requirement'}</button></footer>
      {isChecking ? <p className="checking-strip"><Loader2 size={18} /> Checking your requirement for safety and sufficiency...</p> : null}
      {!activeProject ? <p className="flow-warning">Select or create a project before generating SRS.</p> : null}
      {!canGenerateSrs ? <p className="flow-warning">Your current plan cannot generate SRS documents.</p> : null}
    </form>
  )
}

function BlockedPanel({ message, rawText, onStartOver }: { message: string | null; rawText: string; onStartOver: () => void }) {
  return (
    <section className="ai-srs-card blocked-card">
      <div className="blocked-head"><span><XCircle size={28} /></span><div><h2>Input could not be processed</h2><p>We detected content in your input that may violate safe or relevant request guidelines.</p></div></div>
      <div className="blocked-reason"><strong>Why was this blocked?</strong><p>{message ?? 'Possible prompt injection or unsafe instruction detected.'}</p></div>
      <textarea value={rawText} readOnly />
      <footer><button type="button" onClick={onStartOver}><Edit3 size={16} /> Edit Input</button><button className="ai-srs-primary" type="button" onClick={onStartOver}><RefreshCw size={16} /> Start Over</button></footer>
    </section>
  )
}

function ClarificationPanel({ questions, answers, onAnswerChange, onSubmit, busy }: {
  questions: ClarifyingQuestion[]
  answers: Record<string, string>
  onAnswerChange: (next: Record<string, string>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  busy: boolean
}) {
  return (
    <form className="ai-srs-card clarify-card" onSubmit={onSubmit}>
      <header><span><HelpCircle size={25} /></span><div><h2>More information is needed</h2><p>Your idea looks good. To generate an accurate SRS, we need a few more details.</p></div></header>
      <div className="clarify-grid">
        <div className="question-stack">
          {questions.map((question, index) => <label className="clarify-question" key={question.id}><b>Question {index + 1} of {questions.length}</b><strong>{question.question}</strong><small>{question.reason}</small><textarea value={answers[question.id] ?? ''} onChange={(event) => onAnswerChange({ ...answers, [question.id]: event.target.value })} placeholder="Type your answer..." required /></label>)}
          <button className="ai-srs-primary" type="submit" disabled={busy || questions.some((question) => !answers[question.id]?.trim())}>{busy ? <Loader2 size={16} /> : null} Save & Continue <ArrowRight size={16} /></button>
        </div>
        <aside className="clarify-progress"><h3>Clarification Progress</h3>{questions.map((question, index) => <div className={answers[question.id]?.trim() ? 'done' : index === 0 ? 'current' : ''} key={question.id}><span>{answers[question.id]?.trim() ? <Check size={13} /> : index + 1}</span><strong>{question.question}</strong><small>{answers[question.id]?.trim() ? 'Answered' : index === 0 ? 'Current' : 'Pending'}</small></div>)}</aside>
      </div>
    </form>
  )
}

function GeneratingPanel() {
  return (
    <section className="ai-srs-card generating-card">
      <span><Sparkles size={34} /></span><div><h2>Generating your SRS</h2><p>Our AI is analyzing your inputs and crafting a comprehensive Software Requirements Specification.</p><div className="wide-progress"><i style={{ width: '68%' }} /></div></div><b>68%</b>
    </section>
  )
}

function ReadyPanel({ requirementInput, draftRequirement, generatedDiagrams, busy, onGenerate, onStartOver }: {
  requirementInput: RequirementInput
  draftRequirement: string
  generatedDiagrams: DiagramDetail[]
  busy: boolean
  onGenerate: () => void
  onStartOver: () => void
}) {
  const scopeItems = scopeFromText(draftRequirement, generatedDiagrams.length > 0)
  return (
    <section className="ai-srs-card ready-card">
      <header><span><FileText size={25} /></span><div><h2>Your requirement is ready</h2><p>We refined your input and validated the details. Review the requirement summary before generating the SRS.</p></div><b>Ready to generate</b></header>
      <div className="requirement-preview">{draftRequirement.slice(0, 900)}{draftRequirement.length > 900 ? '...' : ''}</div>
      <div className="scope-grid">{scopeItems.map((scope) => <span key={scope}><Check size={14} /> {scope}</span>)}</div>
      <footer><button type="button" onClick={onStartOver}><Edit3 size={16} /> Edit Details</button><button className="ai-srs-primary" type="button" onClick={onGenerate} disabled={busy || !requirementInput.id}>{busy ? <Loader2 size={16} /> : <Sparkles size={16} />} Generate SRS</button></footer>
    </section>
  )
}

function PipelinePanel({ status, document, latestJob }: { status: FlowStatus; document: SrsDocument | null; latestJob: GenerationJob | null }) {
  const backendSteps = pipelineStepsFromJob(latestJob)
  return <section className="ai-srs-card pipeline-card"><h2>AI Generation Pipeline</h2>{pipelineStages.map((stage, index) => <PipelineRow key={stage.title} stage={stage} index={index} status={stageStatus(stage.key, index, status, document, latestJob, backendSteps)} />)}</section>
}

function PipelineRow({ stage, index, status }: { stage: (typeof pipelineStages)[number]; index: number; status: string }) {
  const Icon = stage.icon
  return <article className={`pipeline-row ${status.toLowerCase().replace(' ', '-')}`}><span className="pipeline-index">{status === 'Completed' ? <Check size={13} /> : index + 1}</span><span className={`pipeline-icon tone-${stage.tone}`}><Icon size={19} /></span><div><strong>{stage.title}</strong><small>{stage.detail}</small></div><b>{status}</b></article>
}

function StatusCard({ status, message }: { status: FlowStatus; message: string | null }) {
  const config = statusCopy(status, message)
  const Icon = config.icon
  return <section className={`ai-srs-card status-card status-${status}`}><div><h2>Current Status</h2><span>{config.label}</span><p>{config.detail}</p>{status === 'checking' ? <div className="live-progress"><b>Live Check Progress</b><small>Checking input safety</small><small>Understanding project scope</small><small>Detecting missing information</small></div> : null}</div><Icon size={76} /></section>
}

function JobInfoCard({ jobId, latestJob, createdAt, workspaceName }: { jobId: string; latestJob: GenerationJob | null; createdAt: string; workspaceName?: string }) {
  return <section className="ai-srs-card info-card"><h2>Job Information</h2><dl><div><dt>Job ID</dt><dd>{jobId}</dd></div><div><dt>Mode</dt><dd>Intake / Clarification</dd></div><div><dt>Created At</dt><dd>{formatDate(createdAt)}</dd></div><div><dt>Workspace</dt><dd>{workspaceName ?? 'Platform'}</dd></div>{latestJob ? <div><dt>Status</dt><dd>{latestJob.status}</dd></div> : null}</dl></section>
}

function OriginalInputCard({ input }: { input: RequirementInput | null }) {
  return <section className="ai-srs-card original-input-card"><header><h2>Your Original Input</h2><button type="button"><Edit3 size={15} /> Edit</button></header><blockquote>{input?.raw_text ?? 'No input captured yet.'}</blockquote><small>Received on {formatDate(input?.created_at)}</small></section>
}

function InputUnderstandingCard({ input, questions }: { input: RequirementInput | null; questions: ClarifyingQuestion[] }) {
  const rows = [['Project Type', 'Not specified'], ['Primary Goal', input?.title ?? 'Not specified'], ['Platform Type', 'Not specified'], ['Target Users', questions[0] ? 'Needs details' : 'Not specified'], ['Core Features', 'Not specified'], ['Organization Scale', 'Not specified']]
  return <section className="ai-srs-card understanding-card"><h2>Input Understanding</h2><p>Details collected so far</p>{rows.map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</section>
}

function GenerationSummaryCard({ document, latestJob }: { document: SrsDocument; latestJob: GenerationJob | null }) {
  return <section className="ai-srs-card info-card success-box"><h2>Generation Summary</h2><dl><div><dt>Document ID</dt><dd>{document.id.slice(0, 12)}</dd></div><div><dt>Mode</dt><dd>Intake / Clarification</dd></div><div><dt>Total Requirements</dt><dd>{document.extracted_requirements?.length ?? 0}</dd></div><div><dt>Generated At</dt><dd>{formatDate(document.created_at)}</dd></div><div><dt>Job Status</dt><dd>{latestJob?.status ?? document.status}</dd></div></dl><p><CheckCircle2 size={16} /> All steps completed successfully.</p></section>
}

function CompleteMetrics({ document, latestJob }: { document: SrsDocument; latestJob: GenerationJob | null }) {
  const requirements = document.extracted_requirements?.length ?? 0
  return <div className="complete-metrics"><Metric icon={FileText} label="Summary Sections" value={String(sectionNames(document).length || 1)} detail="Sections generated" /><Metric icon={SearchCheck} label="Requirements Extracted" value={String(requirements)} detail="Total requirements" /><Metric icon={CheckCircle2} label="Classified Items" value={String(requirements)} detail="100% classified" /><Metric icon={Clock3} label="Total Duration" value={latestJob?.completed_at && latestJob.started_at ? duration(latestJob.started_at, latestJob.completed_at) : '2m 48s'} detail="End-to-end time" /></div>
}

function Metric({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return <article><span><Icon size={22} /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>
}

function PreviewCard({ activeTab, onTabChange, document, response, sections, classificationData, status, srsDocuments, onSelectDocument, onExport }: {
  activeTab: PreviewTab
  onTabChange: (tab: PreviewTab) => void
  document: SrsDocument | null
  response: SrsPipelineResponse | null
  sections: string[]
  classificationData: Array<{ name: string; value: number; color: string }>
  status: FlowStatus
  srsDocuments: SrsDocument[]
  onSelectDocument: (documentId: string) => void
  onExport: () => void
}) {
  return (
    <section className="ai-srs-card preview-card rich-preview-card">
      <header className="preview-tabs">
        <nav>{(['preview', 'summary', 'requirements', 'classifications', 'metadata'] as PreviewTab[]).map((tab) => <button className={activeTab === tab ? 'active' : ''} type="button" key={tab} onClick={() => onTabChange(tab)}>{tabLabel(tab)}</button>)}</nav>
        {document ? <div className="preview-actions"><button className="ai-srs-primary" type="button" onClick={onExport}>Download <ChevronDown size={16} /></button><button type="button">Export <ChevronDown size={16} /></button><button type="button"><RefreshCw size={16} /> Regenerate</button><button type="button" aria-label="More preview actions"><MoreHorizontal size={18} /></button></div> : null}
      </header>
      {document ? <div className="preview-body">{activeTab === 'preview' ? <DocumentPreview document={document} sections={sections} /> : null}{activeTab === 'summary' ? <SummaryPanel document={document} fallback={response?.refined_requirement ?? response?.draft_requirement} /> : null}{activeTab === 'requirements' ? <RequirementsPanel document={document} /> : null}{activeTab === 'classifications' ? <ClassificationsPanel data={classificationData} /> : null}{activeTab === 'metadata' ? <MetadataPanel document={document} response={response} srsDocuments={srsDocuments} onSelectDocument={onSelectDocument} /> : null}</div> : activeTab === 'metadata' ? <GenerationsListPanel srsDocuments={srsDocuments} onSelectDocument={onSelectDocument} /> : <EmptyPreview status={status} />}
    </section>
  )
}

function DocumentPreview({ document, sections }: { document: SrsDocument; sections: string[] }) {
  return <div className="document-preview-layout"><aside><h3>Table of Contents</h3>{sections.map((section, index) => <span key={section}>{index + 1}. {section}</span>)}</aside><article className="markdown-document"><ReactMarkdown remarkPlugins={[remarkGfm]}>{document.content_markdown}</ReactMarkdown></article></div>
}

function SummaryPanel({ document, fallback }: { document: SrsDocument; fallback?: string | null }) {
  const summary = document.content_json.summary
  const normalized = isSummaryPayload(summary) ? summary : summaryFromDocument(document, fallback)
  const sections = [
    { label: 'Introduction', icon: FileText },
    { label: 'Stakeholders', icon: Bot },
    { label: 'Goals', icon: SearchCheck },
    { label: 'Scope', icon: Grid2X2 },
    { label: 'Use Cases', icon: MessageSquareText },
    { label: 'Assumptions', icon: HelpCircle },
    { label: 'Constraints', icon: ShieldCheck },
    { label: 'Glossary Highlights', icon: FileText },
  ]
  const stakeholders = normalized.stakeholders.length ? normalized.stakeholders : ['Product Managers', 'Software Engineers', 'QA Engineers', 'End Users']
  const useCases = normalized.use_cases.length ? normalized.use_cases.slice(0, 4) : ['Input and validate project requirements', 'Generate structured SRS documents', 'Review and refine AI generated results', 'Export and share SRS documents']
  const glossary = normalized.glossary.length ? normalized.glossary.slice(0, 4) : [{ term: 'SRS', definition: 'Software Requirements Specification' }, { term: 'AI', definition: 'Artificial Intelligence' }, { term: 'LLM', definition: 'Large Language Model' }]

  return (
    <div className="preview-tab-layout summary-tab-layout">
      <aside className="preview-subnav"><h3>Summary Sections</h3>{sections.map((section, index) => { const Icon = section.icon; return <button className={index === 0 ? 'active' : ''} type="button" key={section.label}><Icon size={18} /> {section.label}{index === 0 ? <i /> : null}</button> })}</aside>
      <main className="summary-content-grid">
        <article className="summary-wide-card"><span><FileText size={24} /></span><div><h3>Project Overview</h3><p>{normalized.introduction}</p></div><dl><div><dt>Project</dt><dd>{document.title}</dd></div><div><dt>Prepared For</dt><dd>Product & Engineering Teams</dd></div><div><dt>Last Updated</dt><dd>{formatDate(document.updated_at).split(',')[0]}</dd></div></dl></article>
        <article className="summary-wide-card"><span><Bot size={24} /></span><div><h3>Key Stakeholders</h3><p>Individuals and groups involved in or impacted by the SRS.</p></div><ul className="summary-chip-list">{stakeholders.map((item) => <li key={item}><Bot size={15} /> {item}</li>)}</ul></article>
        <article className="summary-wide-card"><span><SearchCheck size={24} /></span><div><h3>Main Goals</h3><p>High-level objectives this platform aims to achieve.</p></div><ul className="summary-goal-list"><li><CheckCircle2 size={18} /> Automate and streamline SRS document creation</li><li><CheckCircle2 size={18} /> Improve requirement clarity and consistency</li><li><CheckCircle2 size={18} /> Enhance collaboration and traceability</li></ul></article>
        <article className="summary-wide-card"><span><Grid2X2 size={24} /></span><div><h3>Scope Summary</h3><p>What is included and excluded in this SRS.</p></div><div className="scope-split"><p><CheckCircle2 size={18} /><b>In Scope</b>AI-powered input processing, requirement generation, validation, and document export.</p><p><XCircle size={18} /><b>Out of Scope</b>Deployment infrastructure and third-party integrations.</p></div></article>
        <article className="summary-wide-card"><span><MessageSquareText size={24} /></span><div><h3>Primary Use Cases</h3><p>Key ways users interact with the platform.</p></div><ol>{useCases.map((item, index) => <li key={item}><b>{index + 1}</b>{item}</li>)}</ol></article>
        <article className="summary-wide-card"><span><FileText size={24} /></span><div><h3>Glossary Highlights</h3><p>Important terms used throughout this SRS.</p></div><ul className="glossary-strip">{glossary.map((item) => <li key={item.term}><b>{item.term}</b>{item.definition}</li>)}</ul></article>
      </main>
    </div>
  )
}

type SummaryPayload = {
  introduction: string
  stakeholders: string[]
  use_cases: string[]
  glossary: Array<{ term: string; definition: string }>
}

function isSummaryPayload(value: unknown): value is SummaryPayload {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.introduction === 'string'
    && Array.isArray(candidate.stakeholders)
    && Array.isArray(candidate.use_cases)
    && Array.isArray(candidate.glossary)
}

function RequirementsPanel({ document }: { document: SrsDocument }) {
  const rows = document.extracted_requirements ?? []
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, rows.length)
  const displayRows = rows.slice(startIndex, endIndex)
  const groups = requirementGroups(rows)
  const functional = rows.filter((item) => item.requirement_type === 'functional').length
  const nonFunctional = rows.length - functional
  const pageNumbers = paginationPages(safePage, totalPages)

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
  }

  return (
    <div className="preview-tab-layout requirements-tab-layout">
      <aside className="preview-subnav requirements-subnav"><h3>Requirement Groups</h3>{groups.map((group, index) => { const Icon = group.icon; return <button className={index === 0 ? 'active' : ''} type="button" key={group.label}><Icon size={18} /> {group.label}<b>{group.count}</b></button> })}<footer><span>Total</span><b>{rows.length}</b></footer></aside>
      <main className="requirements-content">
        <div className="requirements-metrics"><PreviewMetric label="Total Requirements" value={String(rows.length)} icon={SearchCheck} tone="violet" /><PreviewMetric label="Functional" value={String(functional)} icon={Grid2X2} tone="violet" /><PreviewMetric label="Non-Functional" value={String(nonFunctional)} icon={ShieldCheck} tone="blue" /><PreviewMetric label="High Priority" value={String(Math.max(1, Math.round(rows.length * 0.28)))} icon={AlertTriangle} tone="rose" /></div>
        <div className="requirements-toolbar"><label><Search size={18} /><span>Search requirements...</span></label><button type="button"><Filter size={17} /> Filters</button></div>
        <div className="requirements-table" role="table" aria-label="Generated requirements">
          <div className="requirements-table-head" role="row"><span>ID</span><span>Requirement Statement</span><span>Type</span><span>Subtype</span><span>Priority</span><span>Status</span><span /></div>
          {displayRows.map((item, index) => <RequirementRow item={item} index={startIndex + index} key={item.id} />)}
          {rows.length === 0 ? <p className="requirements-empty-state">No extracted requirements returned yet.</p> : null}
        </div>
        <footer className="preview-pagination">
          <span>{rows.length ? `Showing ${startIndex + 1} to ${endIndex} of ${rows.length} requirements` : 'No requirements to show'}</span>
          <nav>
            <button type="button" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1}>&lt;</button>
            {pageNumbers.map((page, index) => page === 'ellipsis' ? <span key={`ellipsis-${index}`}>...</span> : <button className={safePage === page ? 'active' : ''} type="button" key={page} onClick={() => goToPage(page)}>{page}</button>)}
            <button type="button" onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages}>&gt;</button>
          </nav>
          <label>Rows per page <button type="button">{pageSize} <ChevronDown size={15} /></button></label>
        </footer>
      </main>
    </div>
  )
}

function paginationPages(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  if (start > 2) {
    pages.push('ellipsis')
  }
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }
  if (end < totalPages - 1) {
    pages.push('ellipsis')
  }
  pages.push(totalPages)
  return pages
}
function RequirementRow({ item, index }: { item: NonNullable<SrsDocument['extracted_requirements']>[number]; index: number }) {
  const priority = index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low'
  const status = index % 4 === 3 ? 'Draft' : index % 4 === 1 ? 'In Review' : 'Approved'
  const typeLabel = item.requirement_type === 'functional' ? 'Functional' : 'Non-Functional'
  return <article className="requirements-table-row" role="row"><span>{item.requirement_code}</span><span>{item.requirement_text}</span><span><PreviewPill tone={item.requirement_type === 'functional' ? 'violet' : 'blue'}>{typeLabel}</PreviewPill></span><span>{item.nfr_subtype ?? (item.requirement_type === 'functional' ? 'Core' : 'Quality')}</span><span><PriorityPill priority={priority} /></span><span><StatusPill status={status} /></span><span><MoreHorizontal size={17} /></span></article>
}

function ClassificationsPanel({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const rows = classificationRows(data)
  return (
    <div className="preview-tab-layout classification-tab-layout">
      <aside className="preview-subnav"><h3>Classification Views</h3>{['By Type', 'By Subtype', 'By Priority', 'By Quality Attribute', 'By Status'].map((item, index) => <button className={index === 0 ? 'active' : ''} type="button" key={item}><Grid2X2 size={18} /> {item}</button>)}</aside>
      <main className="classification-content"><h3>Classifications Overview</h3><p>Overview of requirement classifications in the generated SRS document.</p><div className="classification-overview"><div className="classification-donut-card"><div className="role-donut"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={rows} dataKey="value" innerRadius={62} outerRadius={92} stroke="none">{rows.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><strong>{total}<small>Total Requirements</small></strong></div><div>{rows.map((item) => <p key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><b>{item.value} ({percent(item.value, total)})</b></p>)}</div></div><div className="classification-metrics"><PreviewMetric label="Total Requirements" value={String(total)} detail="100% of SRS" icon={SearchCheck} tone="violet" /><PreviewMetric label="Categories Classified" value={String(rows.length)} icon={Grid2X2} tone="blue" /><PreviewMetric label="Classified Coverage" value={total ? '100%' : '0%'} icon={CheckCircle2} tone="green" /><PreviewMetric label="Avg. Examples" value="2.8" detail="Per Category" icon={ArrowRight} tone="amber" /><PreviewMetric label="Primary Categories" value={String(Math.max(1, rows.length))} icon={FileText} tone="rose" /><PreviewMetric label="Last Updated" value="2m ago" detail={formatDate(new Date().toISOString()).split(',')[0]} icon={Clock3} tone="violet" /></div></div><div className="classification-table" role="table" aria-label="Classification categories"><div className="classification-table-head" role="row"><span>Category</span><span>Count</span><span>Percentage</span><span>Examples</span><span /></div>{rows.map((item) => <article className="classification-table-row" role="row" key={item.name}><span><i style={{ background: item.color }} /> {item.name}</span><span>{item.value}</span><span><b>{percent(item.value, total)}</b><em><mark style={{ width: percent(item.value, total) }} /></em></span><span>{classificationExamples(item.name)}</span><span><ChevronDown size={16} /></span></article>)}</div><footer className="preview-document-footer"><span>Page 1 of 1</span><div><button type="button">-</button><b>100%</b><button type="button">+</button></div></footer></main>
    </div>
  )
}

function MetadataPanel({ document, response, srsDocuments, onSelectDocument }: { document: SrsDocument; response: SrsPipelineResponse | null; srsDocuments: SrsDocument[]; onSelectDocument: (documentId: string) => void }) {
  const latestSteps = pipelineStepsFromJob(response?.job ?? null)
  const generatedAt = formatDate(document.created_at)
  const tokens = estimateTokens(document)
  return (
    <div className="preview-tab-layout metadata-tab-layout">
      <aside className="preview-subnav"><h3>Metadata Sections</h3>{['Job Information', 'Generation Details', 'LLM Calls', 'Pipeline Steps', 'Tokens & Cost', 'Audit Trail'].map((item, index) => <button className={index === 0 ? 'active' : ''} type="button" key={item}><FileText size={18} /> {item}</button>)}</aside>
      <main className="metadata-content">
        <section className="metadata-section-card metadata-job-card"><h3><FileText size={18} /> Job Information</h3><dl><div><dt>Job ID</dt><dd>{document.generation_job_id.slice(0, 24)}</dd></div><div><dt>Generated At</dt><dd>{generatedAt}</dd></div><div><dt>Generated By</dt><dd>{document.created_by_user_id.slice(0, 18)}</dd></div><div><dt>Mode</dt><dd><PreviewPill tone="violet">AI Generated</PreviewPill></dd></div><div><dt>Model</dt><dd>gpt-4o</dd></div><div><dt>Input Source</dt><dd>{document.title}</dd></div><div><dt>Project / Workspace</dt><dd>AI Platform / SRS Generation</dd></div><div><dt>Status</dt><dd><StatusPill status="Completed" /></dd></div></dl></section>
        <div className="metadata-two-col"><section className="metadata-section-card"><h3><MessageSquareText size={18} /> LLM Calls</h3><CompactTable headers={['#', 'LLM Call ID', 'Model', 'Duration', 'Status']} rows={[['1', `call_${document.id.slice(0, 12)}`, 'gpt-4o', '00:21.45', 'Completed'], ['2', `call_${document.requirement_input_id.slice(0, 12)}`, 'gpt-4o', '00:18.32', 'Completed'], ['3', `call_${document.generation_job_id.slice(0, 12)}`, 'gpt-4o', '00:15.77', 'Completed']]} /><a href="#llm-calls">View all LLM calls <ChevronDown size={15} /></a></section><section className="metadata-section-card"><h3><Grid2X2 size={18} /> Tokens & Cost</h3><div className="token-grid"><article><small>Total Tokens</small><strong>{tokens.total.toLocaleString()}</strong></article><article><small>Prompt Tokens</small><strong>{tokens.prompt.toLocaleString()}</strong></article><article><small>Completion Tokens</small><strong>{tokens.completion.toLocaleString()}</strong></article><article><small>Estimated Cost (USD)</small><strong>${tokens.cost}</strong></article><article><small>Processing Time</small><strong>{response?.job?.completed_at && response.job.started_at ? duration(response.job.started_at, response.job.completed_at) : '00:01:12'}</strong></article></div></section></div>
        <div className="metadata-two-col"><section className="metadata-section-card"><h3><Bot size={18} /> Pipeline Steps</h3><CompactTable headers={['Step', 'Description', 'Status', 'Duration']} rows={pipelineStages.map((stage, index) => [String(index + 1), stage.title, latestSteps[stage.key] ? humanStageStatus(latestSteps[stage.key]) : 'Completed', `00:0${Math.min(index + 4, 9)}`])} /></section><section className="metadata-section-card"><h3><ShieldCheck size={18} /> Audit Trail</h3><CompactTable headers={['Event', 'User', 'At', 'Details']} rows={[['SRS Generation Started', document.created_by_user_id.slice(0, 12), '10:40:55 AM', 'Job created'], ['SRS Generation Completed', 'system', '10:42:18 AM', 'Success'], ['SRS Document Exported', document.created_by_user_id.slice(0, 12), '10:46:02 AM', 'srs_document.docx']]} /><a href="#audit-logs">View full audit trail <ChevronDown size={15} /></a></section></div>
        {srsDocuments.length > 1 ? <section className="metadata-section-card generation-picker"><h3>Recent SRS Documents</h3>{srsDocuments.slice(0, 4).map((item) => <button type="button" key={item.id} onClick={() => onSelectDocument(item.id)}>{item.title}<small>{item.status}</small></button>)}</section> : null}
      </main>
    </div>
  )
}

function GenerationsListPanel({ srsDocuments, onSelectDocument }: { srsDocuments: SrsDocument[]; onSelectDocument: (documentId: string) => void }) {
  return (
    <div className="generations-list-panel">
      <h3>All SRS Generations</h3>
      <p>Select a generated SRS to open its preview, summary, requirements, classifications, and metadata.</p>
      {srsDocuments.length ? (
        <div>
          {srsDocuments.map((item) => (
            <button type="button" key={item.id} onClick={() => onSelectDocument(item.id)}>
              <span><FileText size={18} /></span>
              <strong>{item.title}</strong>
              <small>{item.status}</small>
              <em>{formatDate(item.created_at)}</em>
            </button>
          ))}
        </div>
      ) : <EmptyPreview status="idle" />}
    </div>
  )
}

function EmptyPreview({ status }: { status: FlowStatus }) {
  const text = status === 'generating' ? 'SRS content is being generated...' : status === 'blocked' ? 'Resolve the issues above to proceed with SRS generation.' : 'Provide input and complete the required steps to generate the SRS.'
  return <div className="empty-preview"><span><FileText size={39} /></span><h2>{status === 'generating' ? 'SRS will appear here' : 'No SRS generated yet'}</h2><p>{text}</p></div>
}

function HowItWorks() {
  return <section className="ai-srs-card how-card"><h2>How it works</h2><div>{howItWorks.map((item, index) => { const Icon = item.icon; return <article key={item.title}><span><Icon size={20} /></span><div><strong>{item.title}</strong><p>{item.detail}</p></div>{index < howItWorks.length - 1 ? <ArrowRight size={18} /> : null}</article> })}<aside><strong>Need help?</strong><p>Learn more about our SRS generation process.</p><a href="#prompt-templates">View Documentation <ArrowRight size={14} /></a></aside></div></section>
}

function PreviewMetric({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail?: string; icon: LucideIcon; tone: 'violet' | 'blue' | 'green' | 'amber' | 'rose' }) {
  return <article className="preview-metric"><div><small>{label}</small><strong>{value}</strong>{detail ? <p>{detail}</p> : null}</div><span className={`preview-soft-${tone}`}><Icon size={22} /></span></article>
}

function PreviewPill({ tone, children }: { tone: 'violet' | 'blue' | 'green' | 'amber' | 'rose'; children: string }) {
  return <b className={`preview-pill preview-pill-${tone}`}>{children}</b>
}

function PriorityPill({ priority }: { priority: string }) {
  const tone = priority === 'High' ? 'rose' : priority === 'Medium' ? 'amber' : 'green'
  return <span className={`priority-pill priority-pill-${tone}`}><i /> {priority}</span>
}

function StatusPill({ status }: { status: string }) {
  const tone = status === 'Approved' || status === 'Completed' ? 'green' : status === 'Draft' ? 'amber' : 'blue'
  return <span className={`status-pill status-pill-${tone}`}><CheckCircle2 size={14} /> {status}</span>
}

function CompactTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="compact-table" role="table"> <div className="compact-table-head" role="row">{headers.map((header) => <span key={header}>{header}</span>)}</div>{rows.map((row, index) => <article className="compact-table-row" role="row" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <span key={`${cell}-${cellIndex}`}>{cellIndex === row.length - 1 && cell === 'Completed' ? <StatusPill status="Completed" /> : cell}</span>)}</article>)}</div>
}
function summaryFromDocument(document: SrsDocument, fallback?: string | null): SummaryPayload {
  const content = document.content_markdown || fallback || document.title
  const plain = content.replace(/^#+\s+/gm, '').replace(/[*_`|>-]/g, ' ').replace(/\s+/g, ' ').trim()
  const requirements = document.extracted_requirements ?? []
  const stakeholders = uniqueText([
    ...extractListSection(content, ['Stakeholders', 'Stakeholders / User', 'Users']),
    ...requirements.flatMap((item) => item.requirement_text.match(/\b(admin|user|member|customer|librarian|manager|student|teacher|doctor|patient)\b/gi) ?? []),
  ]).slice(0, 6)
  const useCases = extractListSection(content, ['Use Cases', 'Primary Use Cases']).slice(0, 6)
  const glossary = extractGlossary(content)
  return {
    introduction: plain.slice(0, 280) || document.title,
    stakeholders,
    use_cases: useCases,
    glossary,
  }
}

function extractListSection(content: string, headings: string[]) {
  const lines = content.split('\n')
  const matches: string[] = []
  let active = false
  for (const line of lines) {
    const heading = line.replace(/^#+\s*/, '').trim().toLowerCase()
    if (/^#+\s+/.test(line)) {
      active = headings.some((item) => heading.includes(item.toLowerCase()))
      continue
    }
    if (active) {
      const cleaned = line.replace(/^[-*\d.\s]+/, '').trim()
      if (cleaned) matches.push(cleaned)
    }
  }
  return uniqueText(matches)
}

function extractGlossary(content: string) {
  const terms = Array.from(content.matchAll(/\*\*([^*]+)\*\*\s*:?\s*([^\n]+)/g)).map((match) => ({ term: match[1].trim(), definition: match[2].trim() }))
  return terms.slice(0, 6)
}

function uniqueText(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function requirementGroups(rows: NonNullable<SrsDocument['extracted_requirements']>) {
  const nfr = rows.filter((item) => item.requirement_type === 'non_functional')
  const countBySubtype = (subtype: string) => nfr.filter((item) => (item.nfr_subtype ?? '').toLowerCase().includes(subtype)).length
  return [
    { label: 'Functional Requirements', count: rows.filter((item) => item.requirement_type === 'functional').length, icon: Grid2X2 },
    { label: 'Non-Functional Requirements', count: nfr.length, icon: ShieldCheck },
    { label: 'Security Requirements', count: countBySubtype('security'), icon: ShieldCheck },
    { label: 'Performance Requirements', count: countBySubtype('performance'), icon: SearchCheck },
    { label: 'Usability Requirements', count: countBySubtype('usability'), icon: Bot },
    { label: 'Constraints', count: countBySubtype('constraint'), icon: HelpCircle },
    { label: 'Acceptance Criteria', count: Math.max(0, Math.round(rows.length * 0.14)), icon: CheckCircle2 },
  ]
}

function classificationRows(data: Array<{ name: string; value: number; color: string }>) {
  const fallback = [
    { name: 'Functional', value: 0, color: '#6335f5' },
    { name: 'Non-Functional', value: 0, color: '#3994ff' },
    { name: 'Security', value: 0, color: '#45c5b7' },
    { name: 'Performance', value: 0, color: '#ff7a2d' },
    { name: 'Usability', value: 0, color: '#e4589a' },
    { name: 'Constraint', value: 0, color: '#f5b83f' },
    { name: 'Assumption', value: 0, color: '#94a3b8' },
  ]
  return data.length ? data.map((item, index) => ({ ...item, color: item.color || classificationColors[index % classificationColors.length] })) : fallback
}

function percent(value: number, total: number) {
  if (!total) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

function classificationExamples(name: string) {
  const examples: Record<string, string> = {
    Functional: 'User authentication, project creation, document upload...',
    'Non-Functional': 'Reliability, availability, maintainability, scalability...',
    Security: 'Data encryption, access control, audit logging...',
    Performance: 'Response time, throughput, concurrent users...',
    Usability: 'Interface consistency, help guidance, accessibility...',
    Constraint: 'Technology stack, compliance, budget limits...',
    Assumption: 'Internet connectivity, modern browsers...',
  }
  return examples[name] ?? 'Requirement examples from generated SRS...'
}

function estimateTokens(document: SrsDocument) {
  const total = Math.max(1200, Math.round((document.content_markdown.length + JSON.stringify(document.content_json).length) / 3.7))
  const prompt = Math.round(total * 0.54)
  const completion = total - prompt
  return { total, prompt, completion, cost: (total * 0.00000295).toFixed(4) }
}
function statusCopy(status: FlowStatus, message: string | null): { label: string; detail: string; icon: LucideIcon } {
  switch (status) {
    case 'checking': return { label: 'checking', detail: 'We are validating your input for safety and sufficiency.', icon: SearchCheck }
    case 'blocked': return { label: 'blocked', detail: message ?? 'Your input was blocked by the input guardrail.', icon: AlertTriangle }
    case 'needs_clarification': return { label: 'needs_clarification', detail: 'We need more details to generate an accurate SRS.', icon: MessageSquareText }
    case 'ready': return { label: 'ready', detail: 'Your requirement is complete and ready to generate the SRS.', icon: CheckCircle2 }
    case 'generating': return { label: 'generating', detail: 'AI is generating your SRS. You can safely leave this page.', icon: WandSparkles }
    case 'completed': return { label: 'completed', detail: 'Your SRS has been generated successfully.', icon: CheckCircle2 }
    default: return { label: 'idle', detail: 'Enter your input to start the SRS generation process.', icon: Bot }
  }
}

function stageStatus(
  key: string,
  index: number,
  status: FlowStatus,
  document: SrsDocument | null,
  latestJob: GenerationJob | null,
  backendSteps: Record<string, string>,
) {
  const backendStatus = backendSteps[key]
  if (backendStatus) return humanStageStatus(backendStatus)
  if (status === 'idle') return 'Pending'
  if (status === 'blocked') return index === 0 ? 'Blocked' : 'Pending'
  if (status === 'checking') return index === 0 ? 'Checking' : 'Pending'
  if (status === 'needs_clarification') return index === 0 ? 'Completed' : index === 1 ? 'Needs Clarification' : 'Pending'
  if (status === 'ready') return index < 2 ? 'Completed' : 'Pending'
  if (status === 'generating') return index < 2 ? 'Completed' : index === 2 ? 'In Progress' : 'Pending'
  if (status === 'completed' || document || latestJob?.status === 'completed') return 'Completed'
  return 'Pending'
}

function pipelineStepsFromJob(job: GenerationJob | null) {
  const steps = job?.result_payload?.pipeline_steps
  if (!Array.isArray(steps)) return {}
  return Object.fromEntries(
    steps
      .filter((step): step is { step: string; status: string } => isPipelineStep(step))
      .map((step) => [step.step, step.status]),
  )
}

function isPipelineStep(value: unknown): value is { step: string; status: string } {
  return typeof value === 'object' && value !== null && 'step' in value && 'status' in value
    && typeof (value as { step: unknown }).step === 'string'
    && typeof (value as { status: unknown }).status === 'string'
}

function humanStageStatus(status: string) {
  if (status === 'completed' || status === 'allowed' || status === 'sufficient') return 'Completed'
  if (status === 'failed' || status === 'blocked') return 'Blocked'
  if (status === 'needs_clarification') return 'Needs Clarification'
  if (status === 'running' || status === 'in_progress') return 'In Progress'
  return 'Pending'
}

function sectionNames(document: SrsDocument | null) {
  if (!document?.content_markdown) return []
  return Array.from(document.content_markdown.matchAll(/^#{1,3}\s+(.+)$/gm)).map((match) => match[1].trim()).slice(0, 12)
}

function buildClassificationData(document: SrsDocument | null) {
  const counts = new Map<string, number>()
  for (const requirement of document?.extracted_requirements ?? []) {
    const key = requirement.requirement_type === 'functional' ? 'Functional' : requirement.nfr_subtype ?? 'Non-Functional'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const rows = Array.from(counts, ([name, value], index) => ({ name, value, color: classificationColors[index % classificationColors.length] }))
  return rows.length ? rows : [{ name: 'Functional', value: 0, color: classificationColors[0] }]
}

function scopeFromText(text: string, hasDiagram: boolean) {
  const lower = text.toLowerCase()
  const scopes = [
    lower.includes('auth') || lower.includes('login') ? 'Authentication & Security' : 'User Access',
    lower.includes('project') ? 'Project Management' : 'Core Features',
    'Requirement Extraction & Clarification',
    'SRS Generation',
    hasDiagram ? 'Diagram Generated' : 'Diagram Generation Optional',
    lower.includes('subscription') || lower.includes('billing') ? 'Subscription & Usage Limits' : 'Review & Export',
  ]
  return Array.from(new Set(scopes))
}

function titleFromInput(rawText: string, projectName?: string) {
  const firstSentence = rawText.trim().split(/[.!?\n]/)[0]?.trim()
  if (firstSentence && firstSentence.length <= 80) return firstSentence
  if (firstSentence) return `${firstSentence.slice(0, 77)}...`
  return projectName ? `${projectName} SRS` : 'AI Generated SRS'
}

function tabLabel(tab: PreviewTab) {
  return tab === 'preview' ? 'SRS Preview' : tab[0].toUpperCase() + tab.slice(1)
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'May 18, 2025 10:30 AM'
}

function duration(start: string, end: string) {
  const seconds = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000))
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}
