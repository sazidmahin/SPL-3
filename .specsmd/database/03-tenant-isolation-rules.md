# Tenant Isolation Rules

The system uses workspace_id as the tenant isolation key.

Every sensitive business query must be scoped by workspace_id.

## Required workspace_id Tables

- projects
- requirement_inputs
- generation_jobs
- srs_documents
- extracted_requirements
- diagrams
- diagram_versions
- diagram_requirement_links
- subscriptions
- usage_counters
- llm_calls
- payment_customers
- invoices

## Wrong Query

```sql
SELECT *
FROM projects
WHERE id = :project_id;
```


## Correct Query

<pre class="overflow-visible! px-0!" data-start="21673" data-end="21763"><div class="relative w-full mt-4 mb-1"><div class=""><div class="contents"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="relative h-full w-full border-radius-3xl bg-token-bg-elevated-secondary corner-superellipse/1.1 overflow-clip rounded-3xl lxnfua_clipPathFallback"><div class="pointer-events-none absolute inset-x-4 top-12 bottom-4"><div class="pointer-events-none sticky z-40 shrink-0 z-1!"><div class="sticky bg-token-border-light"></div></div></div><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class=""><div class="relative"><div class=""><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼs ͼ16"><div class="cm-scroller"><pre class="cm-content q9tKkq_readonly m-0"><code><span class="ͼv">SELECT</span><span></span><span class="ͼv">*</span><br/><span class="ͼv">FROM</span><span> projects</span><br/><span class="ͼv">WHERE</span><span> id </span><span class="ͼv">=</span><span> :project_id</span><br/><span class="ͼv">AND</span><span> workspace_id </span><span class="ͼv">=</span><span> :workspace_id;</span></code></pre></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></div></div></div></pre>

## Access Control Flow

## API request

## JWT authentication

## Resolve current user

## Resolve workspace_id

## Check workspace_members

## Check role

## Check subscription if feature is paid
