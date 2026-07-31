export type MockTask = {
  id: string
  title: string
  project: string
  due: string
  status: 'todo' | 'review' | 'blocked' | 'done'
}

export type MockDeadline = {
  id: string
  title: string
  date: string
  tone: 'warning' | 'danger' | 'info'
}

export type MockActivity = {
  id: string
  title: string
  meta: string
  kind: 'srs' | 'diagram' | 'requirement' | 'comment'
}

export type MockRequirement = {
  id: string
  code: string
  text: string
  priority: 'high' | 'medium' | 'low'
  status: 'approved' | 'draft' | 'review'
}

export const mockTasks: MockTask[] = [
  { id: 'task-1', title: 'Review checkout requirements', project: 'E-Commerce Platform', due: 'Today', status: 'review' },
  { id: 'task-2', title: 'Validate generated class diagram', project: 'Retail POS System', due: 'Tomorrow', status: 'todo' },
  { id: 'task-3', title: 'Resolve SRS ambiguity notes', project: 'Healthcare Portal', due: 'May 18', status: 'blocked' },
]

export const mockDeadlines: MockDeadline[] = [
  { id: 'deadline-1', title: 'Retail POS SRS review', date: 'May 21', tone: 'warning' },
  { id: 'deadline-2', title: 'Diagram export handoff', date: 'May 23', tone: 'info' },
  { id: 'deadline-3', title: 'Billing seat renewal', date: 'May 30', tone: 'danger' },
]

export const mockActivities: MockActivity[] = [
  { id: 'activity-1', title: 'New requirements imported', meta: 'E-Commerce Platform / 12 min ago', kind: 'requirement' },
  { id: 'activity-2', title: 'SRS document approved', meta: 'Retail POS System / 1 hr ago', kind: 'srs' },
  { id: 'activity-3', title: 'Class diagram updated', meta: 'Healthcare Portal / 3 hrs ago', kind: 'diagram' },
  { id: 'activity-4', title: 'Comment added on checkout flow', meta: 'Priya / yesterday', kind: 'comment' },
]

export const mockRequirements: MockRequirement[] = [
  { id: 'req-1', code: 'REQ-014', text: 'User shall register using email and password.', priority: 'high', status: 'approved' },
  { id: 'req-2', code: 'REQ-021', text: 'System shall generate SRS from raw business input.', priority: 'high', status: 'review' },
  { id: 'req-3', code: 'NFR-006', text: 'Document export should complete within 30 seconds.', priority: 'medium', status: 'draft' },
  { id: 'req-4', code: 'REQ-037', text: 'Diagram elements should link back to source requirements.', priority: 'high', status: 'approved' },
]
