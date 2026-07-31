import type { FormEvent } from 'react'
import './SrsPanel.css'
import type { ClassDiagramMethod, DiagramDetail } from '../../domains/diagram/types'
import type { GenerationJob, SrsDocument } from '../../domains/srs/types'
import type { Project } from '../../domains/project/types'
import type { WorkspaceMembership } from '../../domains/workspace/types'

const SRS_RAW_TEXT_LIMIT = 200000
const formatCount = new Intl.NumberFormat('en-US')

type SrsPanelProps = {
  activeWorkspace: WorkspaceMembership | undefined
  activeProject: Project | undefined
  generationJobs: GenerationJob[]
  srsDocuments: SrsDocument[]
  activeSrsDocument: SrsDocument | null
  generatedDiagrams: DiagramDetail[]
  srsTitle: string
  srsRawText: string
  generateClassDiagram: boolean
  isLoadingGenerationJobs: boolean
  isLoadingSrsDocuments: boolean
  isStartingGeneration: boolean
  isGeneratingClassDiagram: boolean
  canGenerateSrs: boolean
  canGenerateAiDiagrams: boolean
  canExportSrs: boolean
  onReload: () => void
  onSrsTitleChange: (value: string) => void
  onSrsRawTextChange: (value: string) => void
  onGenerateClassDiagramChange: (value: boolean) => void
  onStartGeneration: (event: FormEvent<HTMLFormElement>) => void
  onSelectSrsDocument: (documentId: string) => void
  onGenerateClassDiagram: (methods: ClassDiagramMethod[]) => void
  onExportSrs: () => void
  onOpenGeneratedDiagram: (diagram: DiagramDetail) => void
}

export function SrsPanel({
  activeWorkspace,
  activeProject,
  generationJobs,
  srsDocuments,
  activeSrsDocument,
  generatedDiagrams,
  srsTitle,
  srsRawText,
  generateClassDiagram,
  isLoadingGenerationJobs,
  isLoadingSrsDocuments,
  isStartingGeneration,
  isGeneratingClassDiagram,
  canGenerateSrs,
  canGenerateAiDiagrams,
  canExportSrs,
  onReload,
  onSrsTitleChange,
  onSrsRawTextChange,
  onGenerateClassDiagramChange,
  onStartGeneration,
  onSelectSrsDocument,
  onGenerateClassDiagram,
  onExportSrs,
  onOpenGeneratedDiagram,
}: SrsPanelProps) {
  const latestGenerationJob = generationJobs[0]
  const rawTextCount = formatCount.format(srsRawText.length)
  const rawTextLimit = formatCount.format(SRS_RAW_TEXT_LIMIT)

  return (
    <article className="panel srs-panel">
      <div className="panel-heading">
        <span className="panel-label">SRS generation</span>
        <button
          className="text-button"
          type="button"
          onClick={onReload}
          disabled={!activeWorkspace || !activeProject || isLoadingGenerationJobs || isLoadingSrsDocuments}
        >
          {isLoadingGenerationJobs || isLoadingSrsDocuments ? 'Loading' : 'Reload'}
        </button>
      </div>

      <div className="srs-layout">
        <form className="srs-form" onSubmit={onStartGeneration}>
          <label>
            Title
            <input value={srsTitle} onChange={(event) => onSrsTitleChange(event.target.value)} required />
          </label>
          <label>
            Requirements
            <textarea
              value={srsRawText}
              maxLength={SRS_RAW_TEXT_LIMIT}
              onChange={(event) => onSrsRawTextChange(event.target.value)}
              rows={10}
              required
            />
            <small className="srs-input-meter">
              {rawTextCount} / {rawTextLimit} characters
            </small>
          </label>
          <label className="inline-toggle">
            <input
              checked={generateClassDiagram}
              type="checkbox"
              disabled={!canGenerateAiDiagrams}
              onChange={(event) => onGenerateClassDiagramChange(event.target.checked)}
            />
            Class diagram
          </label>
          {!canGenerateSrs ? <p className="upgrade-prompt">Upgrade to generate SRS documents.</p> : null}
          <button
            className="primary-button"
            type="submit"
            disabled={!activeProject || isStartingGeneration || !canGenerateSrs}
          >
            {isStartingGeneration ? 'Starting' : generateClassDiagram ? 'Generate SRS + diagram' : 'Start generation'}
          </button>
        </form>

        <div className="generation-status">
          <span className="panel-label">Latest status</span>
          <h2>{latestGenerationJob?.status ?? 'No jobs yet'}</h2>
          {latestGenerationJob ? (
            <p>
              {latestGenerationJob.job_type} / {latestGenerationJob.progress_percent}% /{' '}
              {new Date(latestGenerationJob.created_at).toLocaleString()}
            </p>
          ) : (
            <p>Submit requirements to create a generation job.</p>
          )}
          <div className="generation-list" aria-label="Generation jobs">
            {generationJobs.map((job) => (
              <button className="generation-option" key={job.id} type="button">
                <span>{job.status}</span>
                <small>
                  {job.job_type} / {new Date(job.created_at).toLocaleDateString()}
                </small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeSrsDocument ? (
        <div className="srs-review">
          <div className="panel-heading">
            <span className="panel-label">Generated SRS</span>
            <span>{new Date(activeSrsDocument.created_at).toLocaleString()}</span>
          </div>
          <div className="srs-document-list" aria-label="SRS documents">
            {srsDocuments.map((document) => (
              <button
                className={document.id === activeSrsDocument.id ? 'generation-option active' : 'generation-option'}
                key={document.id}
                type="button"
                onClick={() => onSelectSrsDocument(document.id)}
              >
                <span>{document.title}</span>
                <small>{document.status}</small>
              </button>
            ))}
          </div>
          <div className="diagram-actions">
            <button className="secondary-button" type="button" onClick={onExportSrs} disabled={!canExportSrs}>
              Export SRS
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => onGenerateClassDiagram(['rule_based'])}
              disabled={isGeneratingClassDiagram || !canGenerateAiDiagrams}
            >
              {isGeneratingClassDiagram ? 'Generating' : 'Rule-based diagram'}
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() => onGenerateClassDiagram(['llm'])}
              disabled={isGeneratingClassDiagram || !canGenerateAiDiagrams}
            >
              {isGeneratingClassDiagram ? 'Generating' : 'LLM diagram'}
            </button>
          </div>
          {!canExportSrs ? <p className="upgrade-prompt">Upgrade to export SRS documents.</p> : null}
          {!canGenerateAiDiagrams ? <p className="upgrade-prompt">Upgrade to generate AI diagrams.</p> : null}

          {generatedDiagrams.length > 0 ? (
            <div className="artifact-review" aria-label="Generated diagram artifacts">
              {generatedDiagrams.map((diagram) => (
                <article className="artifact-item" key={diagram.id}>
                  <div>
                    <strong>{diagram.title}</strong>
                    <small>
                      {diagram.diagram_type} / v{diagram.current.version_number}
                    </small>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => onOpenGeneratedDiagram(diagram)}>
                    Open diagram
                  </button>
                  <div className="traceability-list" aria-label="Traceability links">
                    {diagram.requirement_links.map((link) => (
                      <span key={link.id}>
                        {link.requirement_code} {'->'} {link.diagram_element_label}
                      </span>
                    ))}
                    {diagram.requirement_links.length === 0 ? <span>No traceability links.</span> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <pre className="srs-markdown">{activeSrsDocument.content_markdown}</pre>
          <div className="requirement-review" aria-label="Extracted requirements">
            {activeSrsDocument.extracted_requirements?.map((requirement) => (
              <article className="requirement-item" key={requirement.id}>
                <strong>{requirement.requirement_code}</strong>
                <span>{requirement.requirement_type}</span>
                {requirement.nfr_subtype ? <small>{requirement.nfr_subtype}</small> : null}
                <p>{requirement.requirement_text}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}
