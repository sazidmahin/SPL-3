import { useMemo, useState } from 'react'
import { CheckCircle2, Clock3, RotateCw, WandSparkles, XCircle } from 'lucide-react'
import type { GenerationJob } from '../../domains/srs/types'
import type { Project } from '../../domains/project/types'
import { Card, Chip, DataTable, EmptyState, PageHeader, ProgressBar, StatTile, cn } from '../../shared/ui'
import type { Tone } from '../../shared/ui'

type AiGenerationJobsProps = {
  generationJobs: GenerationJob[]
  projects: Project[]
}

const STATUS_TABS = ['all', 'running', 'completed', 'failed', 'pending'] as const
type StatusTab = (typeof STATUS_TABS)[number]

const statusTone: Record<string, Tone> = {
  completed: 'active',
  running: 'sky',
  pending: 'ai',
  partially_completed: 'pending',
  failed: 'danger',
}

export function AiGenerationJobs({ generationJobs, projects }: AiGenerationJobsProps) {
  const [tab, setTab] = useState<StatusTab>('all')
  const projectName = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects])

  const counts = {
    all: generationJobs.length,
    running: generationJobs.filter((job) => job.status === 'running').length,
    completed: generationJobs.filter((job) => job.status === 'completed').length,
    failed: generationJobs.filter((job) => job.status === 'failed').length,
    pending: generationJobs.filter((job) => job.status === 'pending').length,
  }

  const visible =
    tab === 'all' ? generationJobs : generationJobs.filter((job) => job.status === tab || (tab === 'failed' && job.status === 'partially_completed'))

  return (
    <section className="grid gap-6" id="ai-jobs">
      <PageHeader title="AI Generation Jobs" description="Track and manage AI-generated SRS and diagram jobs." />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total jobs" value={counts.all} icon={WandSparkles} />
        <StatTile label="Completed" value={counts.completed} icon={CheckCircle2} />
        <StatTile label="Running" value={counts.running} icon={RotateCw} />
        <StatTile label="Failed" value={counts.failed} icon={XCircle} />
      </div>

      <Card>
        <div className="flex flex-wrap gap-1 border-b border-border p-3">
          {STATUS_TABS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-[13px] font-semibold capitalize transition',
                tab === value ? 'bg-accent/15 text-accent' : 'text-fg-3 hover:bg-surface-2 hover:text-fg',
              )}
            >
              {value} ({counts[value]})
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            className="m-5"
            icon={Clock3}
            title="No jobs to show"
            description="Generation jobs appear here once you run the SRS pipeline."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Job</th>
                <th>Project</th>
                <th>Type</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((job) => (
                <tr key={job.id}>
                  <td className="font-mono text-[12px] text-fg">{job.id.slice(0, 8)}</td>
                  <td>{projectName.get(job.project_id) ?? '—'}</td>
                  <td className="capitalize">{job.job_type.replaceAll('_', ' ')}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ProgressBar className="w-20" value={job.progress_percent} />
                      <span className="text-xs text-fg-3">{job.progress_percent}%</span>
                    </div>
                  </td>
                  <td>
                    <Chip tone={statusTone[job.status] ?? 'muted'} className="capitalize">
                      {job.status.replaceAll('_', ' ')}
                    </Chip>
                  </td>
                  <td className="whitespace-nowrap">{new Date(job.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </section>
  )
}
