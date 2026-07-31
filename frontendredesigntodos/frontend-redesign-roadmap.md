# Frontend Redesign Roadmap

## Design Audit Summary

- Visual direction: dark left navigation rail, light grey workspace canvas, white content surfaces, compact enterprise dashboard density.
- Core palette inferred from design screenshots: deep navy `#071120` / `#0b1220`, near-white `#f8fafc`, cool grey `#e5e7eb`, slate text `#111827`, muted slate `#64748b`, teal/green action accents, amber/purple status accents.
- Layout language: persistent sidebar, top workspace header, metric tiles, action cards, data tables/lists, role-aware dashboard panels, compact controls.
- UI details: 8px-or-less card radius, subtle borders, restrained shadows, uppercase section labels, clear role/status chips, scan-friendly dense grids.
- Product structure from role-based designs: Super Admin, Organization Admin, Organization Member, project workspace, billing/settings, members/roles, audit/LLM logs.
- Full 60-image inspection is documented in rontend-design-audit.md.

## Implementation Todos

1. Foundation and tokens
   - Replace broad legacy theme tokens with a reusable SPL design token set.
   - Add shared UI primitives for cards, chips, buttons, section headers, stat tiles, empty states, and compact lists.
   - Keep API/domain hooks unchanged so backend integration stays stable.

2. App shell
   - Introduce a role-aware dashboard shell with sidebar, topbar, workspace context, and quick actions.
   - Move current panels into a more structured overview/workbench layout.
   - Add mock-friendly summary metrics where backend fields do not exist yet.

3. Dashboard views
   - Build first dashboard view for the current signed-in user: workspace summary, billing usage, projects, generation jobs, documents, and diagrams.
   - Preserve all existing create/reload/select/generate/export actions.
   - Add responsive mobile behavior for sidebar and stacked content.

4. Auth experience
   - Restyle login/register to match the new product language.
   - Add product trust/feature panels using static copy only, no backend dependency.

5. Role-specific expansion
   - Add Super Admin dashboard placeholders: tenants, subscriptions, audit events, LLM usage.
   - Add Organization Admin placeholders: members, roles, billing, workspace settings.
   - Add Organization Member project workspace: SRS generation, diagrams, traceability, recent activity.

6. Backend integration follow-up
   - Replace mock-only metrics with real endpoints when available.
   - Add route-level separation if role-specific backend permissions require it.
   - Add loading/empty/error states per module after API contracts settle.

## Completed First Slice

- Implement design tokens and shared primitives.
- Replace the authenticated page shell with a structured dashboard/workbench layout.
- Keep current functional panels mounted and wired to existing controller props.
- Use derived/mock UI summaries only where backend data is absent.

This slice is a foundation only. It does not yet fully match all screens in FrontendDesign/.

## Corrective Next Slice

- Replace the single long workbench with role/flow-aware section navigation.
- Build the individual/member dashboard and project workspace first.
- Move SRS, requirements, diagrams, and AI jobs toward table/detail-drawer layouts.
- Keep backend-connected actions, but introduce isolated mock adapters for missing data such as tasks, deadlines, comments, audit logs, and LLM cost logs.
