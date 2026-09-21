# Frontend Design Audit

Audit source: `FrontendDesign/`

## Image Inventory

- Total images inspected: 60
- `FrontendDesign/`: 12 concept and concrete page screens
- `FrontendDesign/Whole/`: 5 whole-product boards
- `FrontendDesign/User/`: 9 individual user flow boards
- `FrontendDesign/srs_role_based_ui_designs/`: 24 mixed role boards
- `FrontendDesign/srs_role_based_ui_designs/super_admin/`: 3 curated super-admin screens
- `FrontendDesign/srs_role_based_ui_designs/organization_admin/`: 4 curated organization-admin screens
- `FrontendDesign/srs_role_based_ui_designs/organization_member/`: 3 curated organization-member screens

Contact sheets generated for inspection:

- `00-root-concepts.jpg`
- `01-whole.jpg`
- `02-user.jpg`
- `03-role-root.jpg`
- `04-super-admin.jpg`
- `05-organization-admin.jpg`
- `06-organization-member.jpg`

## Global Design Language

- Shell: persistent dark navy left sidebar, light application canvas, white content surfaces.
- Accent: vivid purple is the primary action/selection color; green is success; red is danger; amber/yellow is warning; blue/purple variants identify documents, diagrams, jobs, and role states.
- Density: enterprise dashboard density, not landing-page spacing. Screens use compact stat tiles, tables, right-side detail drawers, and small cards.
- Corners: mostly 6px to 8px radius, with pill chips for status only.
- Navigation: sidebar items are role-aware and page-specific. Active item uses purple fill/highlight.
- Header: workspace selector/breadcrumb on the left, global search centered or left, notification/help/avatar controls on the right.
- Surfaces: large content panels are not deeply nested cards; tables and sections are bounded by subtle borders.
- Data patterns: metric cards, tabbed tables, filters, status chips, right detail panels, preview panes, charts, and progress rings.

## Auth And Onboarding Flow

Screens show:

- Login page with dark illustrated product panel on the left and white login form on the right.
- Register/create account page with form fields plus value-prop/product preview panel.
- Email verification page.
- Forgot password and reset password pages.
- Workspace type selection and individual/personal workspace onboarding.

Implementation requirement:

- Auth cannot remain a plain two-column text/form page.
- Add illustrated/dark product panel, form card, secondary OAuth buttons, verification/reset states as separate components.
- Keep backend auth hooks intact, but add mock-only visual states for reset/verification until backend endpoints are connected.

## Individual User Flow

Screens show:

- Personal dashboard with metric cards: projects, SRS documents, diagrams, AI jobs, credit/usage.
- Projects list with filters, create project, project table, and project status chips.
- Project workspace with requirements, SRS documents, diagrams, activity stream, team/member sidebar, tasks, timeline, and comments.
- Requirements table with right detail drawer.
- SRS document list and SRS review/editor preview pane.
- AI generation jobs table with job details drawer and output artifacts.
- Subscription/usage/billing screen with credit usage chart, invoices, payment method.
- Settings/profile page with account, profile information, notifications, security, export preferences.

Implementation requirement:

- Build a proper member dashboard and project workspace rather than one long mixed panel list.
- Add tabs/sections for Overview, Requirements, SRS Documents, Diagrams, AI Jobs, Activity.
- Use right-side detail drawers for selected requirement/SRS/job/diagram.
- Keep mock data acceptable where backend does not expose tasks/comments/timeline yet.

## Organization Admin Flow

Screens show:

- Organization admin flow/access map.
- Organization admin dashboard with team members, active projects, SRS docs, diagrams, AI jobs, seat usage, subscription overview, quick actions.
- Members and roles screen with member table, pending invites, role overview, role permission matrix, invite side panel.
- Billing and workspace settings screen with subscription, credit usage, payment method, invoice history, org profile, security preferences, member access policy.

Implementation requirement:

- Add admin dashboard area separate from individual/member experience.
- Add members/roles UI with invite drawer and permission matrix.
- Add workspace settings and billing page matching the two-column management layout.
- Use current workspace role to decide which admin surfaces are visible.

## Organization Member Flow

Screens show:

- Organization member flow/access map with allowed and restricted actions.
- Member dashboard with assigned projects, tasks, documents updated, workspace usage, recent SRS documents, diagrams, deadlines, contributions.
- Project workspace for organization member with requirements, SRS documents, diagrams, activity/comments, and action restrictions.

Implementation requirement:

- Member UI should emphasize assigned work, recent documents, deadlines, and restricted admin/billing actions.
- Keep create/admin actions hidden or disabled based on role.

## Super Admin Flow

Screens show:

- Super-admin flow/access map for platform owner.
- Platform dashboard with users, workspaces, active subscriptions, monthly revenue, platform usage overview, health/status, top workspaces, recent activity, quick actions.
- Platform controls/admin audit and LLM/API cost logs with tabbed tables and audit detail cards.

Implementation requirement:

- Super admin needs a separate platform shell section.
- Add mock platform metrics until backend endpoints exist.
- Include audit logs, LLM/API cost logs, plans/subscriptions, platform settings, security events.

## Current Implementation Gap

The first implemented slice only covers:

- Global visual tokens
- Dark sidebar
- Top dashboard overview
- Existing backend-connected panels mounted in a new shell

It does not yet cover:

- Full auth/onboarding visual flow
- Separate member/admin/super-admin screens
- Proper project workspace screen
- Requirements table/detail drawer
- SRS document review layout matching designs
- AI jobs table/detail drawer
- Members/roles/invite flow
- Billing/settings page depth
- Role-based navigation and permissions visibility

## Corrected Implementation Order

1. Rework app shell navigation so it can switch between product sections instead of dumping all panels on one page.
2. Build member dashboard and project workspace with mock-friendly section data.
3. Redesign auth/onboarding flow.
4. Build SRS documents, requirements, diagrams, and AI jobs as table/detail-drawer modules.
5. Add organization admin dashboard, members/roles, billing/settings.
6. Add super-admin platform dashboard and audit/LLM logs.
7. Integrate backend endpoints where available and keep mock adapters isolated.
