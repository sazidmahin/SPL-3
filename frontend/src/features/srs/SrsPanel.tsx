import type { FormEvent } from 'react'
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
    <article className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">SRS generation</span>
        <button
          className="text-sm font-semibold text-brand-600 transition hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={onReload}
          disabled={!activeWorkspace || !activeProject || isLoadingGenerationJobs || isLoadingSrsDocuments}
        >
          {isLoadingGenerationJobs || isLoadingSrsDocuments ? 'Loading' : 'Reload'}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,1fr)]">
        <form className="grid gap-4" onSubmit={onStartGeneration}>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Title
            <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-100" value={srsTitle} onChange={(event) => onSrsTitleChange(event.target.value)} required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Requirements
            <textarea
              className="min-h-52 resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-100"
              value={srsRawText}
              maxLength={SRS_RAW_TEXT_LIMIT}
              onChange={(event) => onSrsRawTextChange(event.target.value)}
              rows={10}
              required
            />
            <small className="text-right text-xs font-medium text-slate-500">
              {rawTextCount} / {rawTextLimit} characters
            </small>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              checked={generateClassDiagram}
              type="checkbox"
              disabled={!canGenerateAiDiagrams}
              onChange={(event) => onGenerateClassDiagramChange(event.target.checked)}
            />
            Class diagram
          </label>
          {!canGenerateSrs ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Upgrade to generate SRS documents.</p> : null}
          <button
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={!activeProject || isStartingGeneration || !canGenerateSrs}
          >
            {isStartingGeneration ? 'Starting' : generateClassDiagram ? 'Generate SRS + diagram' : 'Start generation'}
          </button>
        </form>

        <div className="grid content-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">Latest status</span>
          <h2 className="text-xl font-bold text-slate-900">{latestGenerationJob?.status ?? 'No jobs yet'}</h2>
          {latestGenerationJob ? (
            <p className="text-sm text-slate-600">
              {latestGenerationJob.job_type} / {latestGenerationJob.progress_percent}% /{' '}
              {new Date(latestGenerationJob.created_at).toLocaleString()}
            </p>
          ) : (
            <p className="text-sm text-slate-600">Submit requirements to create a generation job.</p>
          )}
          <div className="grid gap-2" aria-label="Generation jobs">
            {generationJobs.map((job) => (
              <button className="grid gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:border-brand-300 hover:bg-brand-50" key={job.id} type="button">
                <span>{job.status}</span>
                <small className="text-xs font-medium text-slate-500">
                  {job.job_type} / {new Date(job.created_at).toLocaleDateString()}
                </small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeSrsDocument ? (
        <div className="grid gap-4 border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">Generated SRS</span>
            <span className="text-sm text-slate-500">{new Date(activeSrsDocument.created_at).toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="SRS documents">
            {srsDocuments.map((document) => (
              <button
                className={document.id === activeSrsDocument.id ? 'grid gap-0.5 rounded-lg border border-brand-500 bg-brand-50 px-3 py-2 text-left text-sm font-semibold text-brand-800' : 'grid gap-0.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-300'}
                key={document.id}
                type="button"
                onClick={() => onSelectSrsDocument(document.id)}
              >
                <span>{document.title}</span>
                <small className="text-xs font-medium opacity-75">{document.status}</small>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={onExportSrs} disabled={!canExportSrs}>
              Export SRS
            </button>
            <button
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={() => onGenerateClassDiagram(['rule_based'])}
              disabled={isGeneratingClassDiagram || !canGenerateAiDiagrams}
            >
              {isGeneratingClassDiagram ? 'Generating' : 'Rule-based diagram'}
            </button>
            <button
              className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={() => onGenerateClassDiagram(['llm'])}
              disabled={isGeneratingClassDiagram || !canGenerateAiDiagrams}
            >
              {isGeneratingClassDiagram ? 'Generating' : 'LLM diagram'}
            </button>
          </div>
          {!canExportSrs ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Upgrade to export SRS documents.</p> : null}
          {!canGenerateAiDiagrams ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Upgrade to generate AI diagrams.</p> : null}

          {generatedDiagrams.length > 0 ? (
            <div className="grid gap-3" aria-label="Generated diagram artifacts">
              {generatedDiagrams.map((diagram) => (
                <article className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto]" key={diagram.id}>
                  <div className="grid gap-1">
                    <strong>{diagram.title}</strong>
                    <small className="text-xs text-slate-500">
                      {diagram.diagram_type} / v{diagram.current.version_number}
                    </small>
                  </div>
                  <button className="h-fit rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50" type="button" onClick={() => onOpenGeneratedDiagram(diagram)}>
                    Open diagram
                  </button>
                  <div className="flex flex-wrap gap-1.5 text-xs font-medium text-slate-600 sm:col-span-2" aria-label="Traceability links">
                    {diagram.requirement_links.map((link) => (
                      <span className="rounded bg-white px-2 py-1" key={link.id}>
                        {link.requirement_code} {'->'} {link.diagram_element_label}
                      </span>
                    ))}
                    {diagram.requirement_links.length === 0 ? <span className="rounded bg-white px-2 py-1">No traceability links.</span> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <pre className="max-h-140 overflow-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100 whitespace-pre-wrap">{activeSrsDocument.content_markdown}</pre>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Extracted requirements">
            {activeSrsDocument.extracted_requirements?.map((requirement) => (
              <article className="grid gap-1 rounded-xl border border-slate-200 bg-white p-3" key={requirement.id}>
                <strong className="text-sm text-brand-700">{requirement.requirement_code}</strong>
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{requirement.requirement_type}</span>
                {requirement.nfr_subtype ? <small className="text-xs text-slate-500">{requirement.nfr_subtype}</small> : null}
                <p className="text-sm leading-6 text-slate-700">{requirement.requirement_text}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}
