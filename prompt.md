# UI Design Prompt for Claude Web
> Give this entire file as a single prompt to Claude Web (claude.ai). It will produce HTML+CSS mockups for every screen.

---

## ROLE & GOAL

You are a senior product designer and frontend engineer. Your task is to design a complete, production-quality UI for an AI-powered **SRS (Software Requirements Specification) and UML Class Diagram Generation platform** called **SRS Generator**.

Produce **self-contained HTML files** with **embedded Tailwind CSS (CDN v3)** for every screen listed below. Each file must look like a real, polished SaaS app — not a wireframe. Use realistic placeholder data throughout.

---

## EXISTING DESIGN SYSTEM (MUST FOLLOW EXACTLY)

The existing codebase has an established design language. All new designs must match it perfectly.

### Colors
```
Brand / Primary:   Teal  →  #0f766e (teal-700), #115e59 (teal-800), #0d9488 (teal-600)
Brand light:       #ccfbf1 (teal-100), #99f6e4 (teal-200)
Brand accent:      Violet/Purple for AI-related actions (#7c3aed, #6d28d9)
Success:           Emerald  →  #10b981, #d1fae5
Warning:           Amber    →  #f59e0b, #fef3c7
Danger:            Rose/Red →  #f43f5e, #ffe4e6
Info:              Sky/Blue →  #0ea5e9, #e0f2fe
Neutral:           Full Slate scale (slate-50 through slate-950)

Page background:   #f8fafc  (slate-50)
Panel/Card:        #ffffff  with  border: 1px solid #e2e8f0  shadow-sm rounded-xl
Text primary:      #0f172a  (slate-950)
Text secondary:    #475569  (slate-500/600)
Text muted:        #94a3b8  (slate-400)
```

### Typography
```
Font family:  Inter, system-ui, sans-serif  (load from Google Fonts)
Base size:    15px
Line height:  1.45
Weights used: 400 (body), 500 (label), 600 (subheading), 700 (heading/button), 800 (display)
Monospace:    SFMono, "Liberation Mono", monospace
```

### Spacing & Shape
```
Border radius:  cards=12px  buttons=8px  inputs=8px  chips=99px
Shadows:        shadow-sm = 0 1px 2px rgba(0,0,0,0.05)
                shadow-md = 0 4px 6px rgba(0,0,0,0.07)
Padding:        cards = 20-24px  sections = 32px  page = 24-32px
Gap:            grid items = 16px  form fields = 14px
```

### Button Variants
```
Primary:    bg-teal-700  text-white  hover:bg-teal-800   px-4 py-2.5  font-semibold
Secondary:  bg-white  border border-slate-200  text-slate-700  hover:bg-slate-50
Danger:     bg-rose-600  text-white  hover:bg-rose-700
Ghost:      text-slate-600  hover:bg-slate-100  no border
AI/Magic:   gradient from violet-600 to teal-600, text-white (for AI-triggered actions)
```

### Status Chips / Badges
```
active/completed:  bg-emerald-50  text-emerald-700  border-emerald-200
pending/running:   bg-amber-50    text-amber-700    border-amber-200
failed/error:      bg-rose-50     text-rose-700     border-rose-200
draft:             bg-slate-100   text-slate-600    border-slate-200
rule-based:        bg-slate-100   text-slate-700    border-slate-300
ai-powered:        bg-violet-50   text-violet-700   border-violet-200
local-model:       bg-sky-50      text-sky-700      border-sky-200
```

### Layout Pattern (used on ALL authenticated pages)
```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR: logo | breadcrumb | search | notifications | avatar │
├──────────┬───────────────────────────────────────────────────┤
│ SIDEBAR  │  PAGE CONTENT AREA (scrollable)                   │
│ 240px    │                                                    │
│ fixed    │  ┌─────────────────────────────────────────────┐  │
│          │  │  Page Header: title + subtitle + actions     │  │
│ Nav:     │  └─────────────────────────────────────────────┘  │
│ • icon   │                                                    │
│   label  │  [ content grid / panels ]                        │
│          │                                                    │
│ Active:  │                                                    │
│ teal-50  │                                                    │
│ bg       │                                                    │
└──────────┴───────────────────────────────────────────────────┘
```

### Sidebar Navigation Items
```
USER sidebar:
  Dashboard          (LayoutDashboard icon)
  Projects           (FolderOpen icon)
  SRS Generation     (FileText icon)
  Diagrams           (Network icon)
  AI Jobs            (Cpu icon)
  Compare Results    (GitCompare icon)  ← NEW
  Settings           (Settings icon)

ADMIN sidebar (indigo accent instead of teal):
  Platform Overview  (BarChart2 icon)
  User Management    (Users icon)
  Workspaces         (Building2 icon)
  AI Configuration   (Sliders icon)
  Plans & Billing    (CreditCard icon)
  Audit Logs         (Shield icon)
  System Health      (Activity icon)
```

### Existing Components to Reuse
The app already has these — replicate them identically in new pages:
- **StatTile**: metric card with label, large value, trend arrow, muted meta text
- **StatusChip**: pill badge with tone-based color
- **CompactList**: list with icon, title, meta, optional badge
- **SectionHeader**: page/section title with optional description + right-side action button

---

## SYSTEM CONTEXT (important for realistic placeholder data)

### What the platform does
1. User writes plain-English software requirements
2. System generates a formal **SRS document** (Introduction, Stakeholders, Use Cases, Functional Requirements FR-001…, Non-Functional Requirements NFR-001…, Business Rules BR-001…)
3. System generates a **UML Class Diagram** in draw.io XML format

### Three generation modes (CORE FEATURE)
| Mode | Label | Cost | Key needed | Speed |
|---|---|---|---|---|
| **Rule-Based** | Rule Engine | Free | None | Instant |
| **Local AI Model** | Local AI (Qwen) | Free | None (runs on server) | ~30s |
| **OpenAI GPT-4o** | OpenAI API | User pays | OpenAI API key | ~15s |
| **Claude (Anthropic)** | Claude API | User pays | Anthropic API key | ~15s |
| **Gemini** | Gemini API | User pays | Google API key | ~20s |

### Requirement types
- `FR-NNN` — Functional Requirement
- `NFR-NNN` — Non-Functional (subtypes: Performance, Security, Availability, Usability, Reliability, Maintainability)
- `BR-NNN` — Business Rule

### UML relationship types
association, composition, aggregation, inheritance, dependency, realization

### Multi-tenant structure
Platform → Workspaces → Projects → [SRS Documents + Diagrams]

---

## FILES TO PRODUCE

Produce exactly these files (one page per file):

```
01-auth.html
02-user-dashboard.html
03-projects.html
04-srs-step1-input.html
05-srs-step2-clarifications.html
06-srs-step3-progress.html
07-srs-step4-results.html
08-srs-compare.html            ← NEW: side-by-side comparison
09-diagram-editor.html
10-user-settings.html
11-admin-dashboard.html
12-admin-users.html
13-admin-workspaces.html
14-admin-ai-config.html
15-admin-billing.html
```

---

## PAGE SPECIFICATIONS

---

### 01-auth.html — Login / Register

**Layout**: Two-column (50/50). Left = form area. Right = brand panel.

**Left side (form)**:
- SRS Generator logo top-left (teal square icon + "SRS Generator" wordmark + "by IIT, University of Dhaka" tiny tagline)
- Tab switcher: `Login` | `Register` (pill style, teal active state)
- **Login form**:
  - Email input
  - Password input with show/hide toggle eye icon
  - "Remember me" checkbox + "Forgot password?" link (right-aligned)
  - Primary button: "Sign In" (full width)
  - Divider: "or continue with"
  - Google + Microsoft SSO buttons (outline style, icons)
- **Register form** (same tab):
  - Full Name input
  - Work Email input
  - Password input + requirements indicator (4 dots, turn green as requirements met)
  - Confirm Password input
  - Checkbox: agree to Terms
  - Primary button: "Create Account"
- Bottom: "Already have an account? Sign in"

**Right side (brand panel)**:
- Dark teal-to-slate-900 gradient background
- Large heading: "Turn requirements into specifications, instantly."
- Subtext: brief description
- 3 feature cards (glass morphism, subtle white border):
  - "Rule-Based Analysis" — FileCheck icon — "Deterministic, free, no API key needed"
  - "AI-Powered Generation" — Sparkles icon — "OpenAI, Claude, Gemini or local model"
  - "UML Class Diagrams" — Network icon — "Auto-generated draw.io diagrams"
- Bottom: "Used at IIT, University of Dhaka"

---

### 02-user-dashboard.html — User Dashboard

Use the standard sidebar + topbar layout.

**Topbar**:
- Logo left
- Breadcrumb: "Acme Corp ▸ Dashboard"
- Global search input (Cmd+K placeholder)
- Bell icon with red dot badge (3)
- User avatar (circle initials "RA") + dropdown chevron

**Sidebar** (active: Dashboard):
- Workspace selector at top: "Acme Corp" + dropdown arrow + plan badge "Pro"
- Nav items with icons (as listed above)
- Bottom: "New Project" button (teal, full width)
- Bottom-most: user avatar + name + "Settings" link

**Page content**:

Row 1 — 5 stat tiles:
```
Projects:        12  ↑2 this month
SRS Documents:   34  ↑8 this month
Diagrams:        21  ↑5 this month
AI Jobs:         47  ↑12 this month
Usage:           67%  [progress bar]  6,700 / 10,000 credits
```

Row 2 — 3 columns:
- **Recent Projects** (col-span-2): Table with 5 rows: icon + name + description, tags, status chip, "FR:12 NFR:4" artifact count, "3 days ago". "View All Projects →" footer link.
- **Generation Modes Used** (col-span-1): Small pie/donut chart showing distribution: Rule-Based 45%, Local AI 20%, OpenAI 25%, Claude 10%. Legend below.

Row 3 — 3 columns:
- **Recent SRS Documents** (col-span-1): CompactList, 4 items, each with document icon, title, "FR:8 NFR:3", "AI • 2h ago"
- **Recent Activity** (col-span-1): Activity feed, 5 items, icons (FileText, Network, Cpu, User), action text, time
- **Subscription Card** (col-span-1):
  - Deep violet gradient background
  - "Pro Plan" large + "Active" emerald badge
  - Renewal: "Sep 30, 2026"
  - 3 bullet features
  - "Manage Subscription" button (white text, secondary style on dark bg)
  - Subtle crown watermark icon

---

### 03-projects.html — Project List

**Page header**: "Projects" title + "12 projects" muted count + "New Project" primary button right

**Filter bar**:
- Search input (magnifier icon, "Search projects…")
- Status dropdown (All / Active / Archived)
- Sort dropdown (Last Updated / Name / Created)
- View toggle: table icon | grid icon (pill switcher)

**Grid view** (3 columns, each card):
```
┌─────────────────────────────────────────┐
│ 🗂  E-Commerce Platform            [···] │ ← project icon + title + 3-dot menu
│     Inventory & order management        │ ← description
│                                         │
│  [web] [backend] [api]                  │ ← tag chips
│                                         │
│  FR: 24   NFR: 8   Diagrams: 3         │ ← artifact counts (small with icons)
│  ────────────────────────────────────── │
│  ● Active          Updated 2 days ago   │ ← status + timestamp
└─────────────────────────────────────────┘
```

**Create Project side panel** (slides from right, full-height overlay):
- Panel title "New Project" + X close button
- Name input (character counter 0/100)
- Description textarea (0/500)
- Domain/Category: suggested chips ("E-Commerce", "Healthcare", "Finance", "EdTech", "SaaS", "+ Custom")
- Tags input (comma separated)
- Cancel / "Create Project" buttons
- Background: dimmed overlay blur

---

### 04-srs-step1-input.html — SRS Generation: Step 1 Input

**Step progress bar** (horizontal, top of content area, 4 steps):
```
●─────────────────────────────
1. Input   2. Clarify   3. Generating   4. Results
(filled)   (empty)      (empty)         (empty)
```

**Page header**: "New SRS Generation" + "Step 1 of 4: Describe your requirements"

**Form (two-column on large screens)**:

**Left column — Input fields**:
- **Title** input: "E-Commerce Platform Requirements"
- **Requirements text** (large textarea, min-height 280px):
  - Placeholder: "Describe your system requirements in plain English. Example: Users can browse products, add them to cart, and checkout. Admins can manage inventory…"
  - Character counter bottom-right: "1,247 / 200,000"
  - Resize handle

**Right column — Generation Options panel** (card with border):

  **Generation Mode** section header:
  - 5 radio-card options (each full-width card with left radio, icon, text, right badge):

  ```
  ○  ⚙️  Rule-Based Engine
        Deterministic analysis, always free
        [FREE] [INSTANT]

  ○  🤖  Local AI Model (Qwen)
        Runs on our server, no API key needed
        [FREE] [~30s]

  ○  ◉  OpenAI GPT-4o                        ← SELECTED state: teal border
        Uses your OpenAI API key
        [API KEY REQUIRED] [~15s]
        └── [input field: sk-... ] [✓ Saved]

  ○  🟣  Claude (Anthropic)
        Uses your Anthropic API key
        [API KEY REQUIRED] [~15s]
        └── [collapsed, click to expand key input]

  ○  💎  Gemini (Google)
        Uses your Google AI API key
        [API KEY REQUIRED] [~20s]
        └── [collapsed]
  ```

  **Additional Options** section (below mode selector):
  - Toggle: "Generate Class Diagram" (ON by default)
    - Sub-option (shows when toggle ON): Diagram generation method
      - [ ] Rule-Based    [ ] AI-Powered    [✓] Both
  - Toggle: "Enable Clarification Step" (tooltip: "System will ask clarifying questions before generating")

  **Submit button** (full width, large): "Analyze Requirements →"
  - Below: "Your requirements are processed securely and never shared."

---

### 05-srs-step2-clarifications.html — Step 2: Clarifications

**Step progress bar**: Step 2 active.

**Page header**: "Clarifying Questions" + subtitle: "The rule engine identified some ambiguities. Answer these to improve output quality."

**Info banner** (amber, with warning icon):
> "8 clarifying questions generated from your requirements. You can skip individual questions or skip all and proceed with generation."

**Question list** (accordion-style, all expanded by default):

Each question card:
```
┌───────────────────────────────────────────────────────────────┐
│  Q3  Missing Actor                                    [Skip]  │
│  ─────────────────────────────────────────────────────────── │
│  "Who can view the order history?"                           │
│                                                               │
│  Source clause: "...view the order history of all users..."  │
│  (pale yellow highlight box with quote icon)                 │
│                                                               │
│  Your answer: [input: "Registered users and admin staff"   ] │
└───────────────────────────────────────────────────────────────┘
```

Question type badges:
- `Missing Actor` → amber
- `Missing Object` → orange
- `Vague Metric` → rose
- `Unknown Action` → slate

Show 8 questions. Some pre-filled as if user is mid-way.

**Bottom action bar** (sticky):
- Left: "8 questions • 5 answered"
- Right: "Skip All & Generate" (ghost button) | "Submit Answers & Generate" (primary)

---

### 06-srs-step3-progress.html — Step 3: Generation in Progress

**Step progress bar**: Step 3 active, animated pulse.

**Center-focused layout** (narrow column, max-w-2xl centered):

**Large animated spinner** (teal ring, 64px):
- Below: "Generating SRS Document…"
- Mode badge: "Using OpenAI GPT-4o"

**Pipeline steps** (vertical list, icon + label + status):
```
✅  Input Guardrail Check        Passed  (green checkmark)
✅  Requirement Sufficiency      Passed
✅  Summary Extraction           Complete
⟳  Requirement Extraction        In progress…  (spinning icon, teal)
○   Requirement Classification   Waiting
○   Document Building            Waiting
○   Class Diagram Generation     Waiting
```

**Progress bar** (below steps):
```
[████████████░░░░░░░░░░░░░░] 42%
```

**Stats strip** (3 numbers appearing as steps complete):
```
Requirements found so far:   18
Functional:                  14
Non-Functional:               4
```

**Cancel button** (ghost, danger color, bottom): "Cancel Generation"

**Log panel** (collapsible, monospace, dark bg):
- Small "View detailed log ▾" toggle
- Expandable terminal-style log:
  ```
  [14:23:01] Input validation: PASSED
  [14:23:02] Sufficiency score: 0.87
  [14:23:03] Extracting requirements from 1,247 chars...
  [14:23:07] Found 18 candidate requirements...
  ```

---

### 07-srs-step4-results.html — Step 4: Results

**Step progress bar**: Step 4 active, all green.

**Success banner** (emerald):
> "✅ SRS Generated Successfully — OpenAI GPT-4o — 23 requirements • 2 diagrams — 14.2s"

**Export action bar** (right-aligned):
- "Download SRS (Markdown)" (secondary button with download icon)
- "Download Requirements (JSON)" (secondary)
- "Share" (secondary with link icon)
- "Start New" (primary)

**Main content — 3-column layout**:

**Left 1/3 — Requirements Panel**:

Filter tabs: `All (23)` | `FR (16)` | `NFR (5)` | `BR (2)`

Scrollable list of requirement cards:
```
FR-001  [Functional]
The system shall allow registered users to
browse the product catalog.
Source: "Users can browse products…"
Confidence: ████████░░ 92%
[View source ↗]

FR-002  [Functional]
The system shall allow users to add products
to a shopping cart.
…
```

NFR cards have subtype chip: `[Performance]` `[Security]` etc.

**Center 1/3 — SRS Document Preview**:

Tabbed: `Rendered` | `Raw Markdown`

Rendered tab (styled markdown):
```
# E-Commerce Platform SRS

## 1. Introduction
This document describes the software requirements
for the E-Commerce Platform, covering…

## 2. Stakeholders
- End Users (Shoppers)
- Platform Administrators
- Inventory Managers

## 3. Functional Requirements

### FR-001 — Product Browsing
**Statement**: The system shall allow registered
users to browse the product catalog.
**Priority**: High | **Status**: Draft

### FR-002 — Shopping Cart
…
```

**Right 1/3 — Class Diagram Panel**:

Tab switcher: `AI-Generated` | `Rule-Based`

For each tab:
- Diagram info chip: "14 classes • 18 relationships"
- Drawio XML preview (monospace textarea, 200px, scrollable)
- "Open in draw.io ↗" button (teal)
- "View Traceability" expandable section:
  - Table: Class → Source Requirements
  - e.g. `User → FR-001, FR-002, FR-005`

Below diagrams, collapsible "Requirement-to-Diagram Links" table:
| Req Code | Element | Confidence | Reason |
|---|---|---|---|
| FR-001 | User class | 94% | Actor in requirement |

---

### 08-srs-compare.html — SRS Comparison View ⭐ NEW PAGE

**This is the most important new page. Make it excellent.**

**Page header**: "Compare SRS Outputs" + subtitle: "Compare results from different generation modes side-by-side for the same requirements"

**Comparison toolbar** (card, full width):
- Left selector: "Compare:" dropdown → select first generation (e.g. "AI • OpenAI GPT-4o • Jun 15, 14:23")
- VS divider (pill badge)
- Right selector: dropdown → select second generation (e.g. "Rule-Based • Jun 15, 14:25")
- "Compare" button (primary)
- Then: toggle group: `Requirements` | `SRS Document` | `Class Diagram`

**Active tab: Requirements Comparison (default)**

Split 50/50 layout with synchronized scrolling:

**Top summary row** (before split):
```
┌──────────────────────────────┬──────────────────────────────┐
│  🤖 OpenAI GPT-4o            │  ⚙️ Rule-Based Engine        │
│  23 requirements              │  18 requirements              │
│  FR: 16 · NFR: 5 · BR: 2    │  FR: 13 · NFR: 4 · BR: 1    │
│  Generated 14.2s              │  Generated 0.8s               │
│  [AI-POWERED]                 │  [RULE-BASED] [FREE]         │
└──────────────────────────────┴──────────────────────────────┘
```

**Side-by-side requirements list**:
- 3 difference states per requirement (color coded):
  - 🟢 **Matched** (same or very similar in both): white background
  - 🟡 **Different** (exists in both but phrasing differs): amber-50 background, "~" badge
  - 🔵 **Only in Left** / 🔴 **Only in Right**: sky-50 or rose-50 background with badge

```
┌────────────────────────────┬────────────────────────────────┐
│ FR-001  [Functional] ✓     │ FR-001  [Functional] ✓        │
│ The system shall allow     │ The system shall allow         │
│ registered users to browse │ users to browse the product   │
│ the product catalog.       │ catalog.                       │
│                            │                                │
│ Confidence: 92%            │ (rule-based, no confidence)   │
├────────────────────────────┼────────────────────────────────┤
│ FR-002  [Functional] 🟡    │ FR-002  [Functional] 🟡       │
│ The system shall allow     │ The system shall enable        │
│ users to add products      │ users to add items to          │ ← amber bg
│ to a shopping cart.        │ shopping cart.                 │
├────────────────────────────┼────────────────────────────────┤
│ FR-007  [Functional] 🔵    │ (not found in rule-based)     │
│ The system shall send      │                               │ ← sky bg left,
│ order confirmation email   │                               │   slate-100 right
│ to users after purchase.   │                               │
├────────────────────────────┼────────────────────────────────┤
│ (not found in AI output)   │ BR-001  [Business Rule] 🔴    │
│                            │ Only admins can modify        │ ← rose bg right
│                            │ product pricing.              │
└────────────────────────────┴────────────────────────────────┘
```

**Diff summary card** (below the split list, full width):
```
┌─────────────────────────────────────────────────────────────┐
│  Comparison Summary                                          │
│                                                              │
│  ✅ Matched:        14 requirements (common to both)        │
│  ～ Different:       4 requirements (similar, different text) │
│  🔵 Only in AI:     5 requirements (AI found more detail)   │
│  🔴 Only in Rule:   1 requirement  (rule found unique BR)   │
│                                                              │
│  💡 Recommendation: AI output found 5 additional edge-case  │
│  requirements. Consider reviewing them for completeness.    │
│                                                              │
│  [Export Comparison Report]  [Use AI Output]  [Use Rule Output]  [Merge]│
└─────────────────────────────────────────────────────────────┘
```

**Active tab: SRS Document Comparison**

Same 50/50 split, but showing rendered markdown side by side.
- Lines that differ: highlighted in amber in the differing column
- Synchronized scroll

**Active tab: Class Diagram Comparison**

50/50 split:
- Left: AI-generated class diagram stats (14 classes, 18 relationships) + class list
- Right: Rule-based class diagram stats (11 classes, 14 relationships) + class list
- Classes present in both: white row
- Classes only in one: highlighted row with colored badge "Only AI" / "Only Rule"
- Summary: "3 extra classes detected by AI (OrderTracking, PaymentGateway, NotificationService)"
- "Open AI Diagram in draw.io ↗" and "Open Rule Diagram in draw.io ↗" buttons

---

### 09-diagram-editor.html — Diagram Editor

**Full-height page** (no vertical scroll on outer layout).

**Topbar**: breadcrumb "Acme Corp ▸ E-Commerce Platform ▸ Class Diagram v3" | Search | Bell | Avatar

**Command bar** (below topbar):
- Diagram title editable inline: "E-Commerce Platform Class Diagram"
- Version badge: "v3 — Saved 2 min ago" (green dot + "Saved")
- Divider
- Tools: Undo ↩ | Redo ↪ | Zoom Out − | 100% | Zoom In + | Fit ⊞ | Grid ⊟
- Right: "AI Regenerate" button (gradient AI style) | "Export XML" | "Save Version"

**3-pane layout** (sidebar | canvas | properties):

**Left pane** (200px, collapsible):
- Tab: "Layers" | "Requirements"
- Requirements tab: scrollable list, each line: req code chip + truncated text
  - Click highlights linked diagram element
- "FR-001" "FR-002" etc., with colored left border by type

**Center pane** (flex-grow, dark gray background):
- draw.io iframe placeholder (white dashed border, 100% height)
- Centered placeholder content: "draw.io Diagram Editor"
  - With mock UML class boxes:
    - User class box: {- email: String \n - password: String \n + login(): void}
    - Order class box: {- id: UUID \n - total: Decimal \n + place(): void}
    - Arrow from User to Order (1 to 0..*)

**Right pane** (260px, collapsible):
- Tab: "Properties" | "Versions"
- Properties tab:
  - Selected element: "User" class chip
  - Fields: Name, Stereotype, Abstract toggle
  - Attributes table: visibility | name | type | Add row button
  - Methods table: visibility | name | params | return | Add row button
- Versions tab:
  - v3 (current) — "Aug 29, 14:23" — "AI Regenerated" — [Load]
  - v2 — "Aug 28, 10:15" — "Manual edit" — [Load]
  - v1 — "Aug 27, 09:00" — "Rule-based" — [Load]

**Bottom panel** (collapsible, 140px):
- Tab: "Requirement Links" | "Validation"
- Requirement Links: table of current class → linked requirements
- Validation: green "✅ Class model valid — 14 classes, 18 relationships, no cycles"

---

### 10-user-settings.html — User Settings

**Page header**: "Settings"

**2-column layout**: left 200px nav | right content

**Left nav** (sticky):
- Profile
- Account
- Notifications
- Appearance
- AI API Keys ← important
- Export Preferences
- Security

**Right content — AI API Keys section** (this is most important):

**API Keys Management** panel:

```
┌─────────────────────────────────────────────────────────────┐
│  AI Provider Keys                                            │
│  Configure your own API keys for AI-powered generation.      │
│  Keys are encrypted and stored securely.                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🟢  OpenAI                     ✅ Key Saved          │   │
│  │     Model: gpt-4o ▾                                  │   │
│  │     [sk-proj-••••••••••••••••••]  [Show] [Clear]     │   │
│  │     [Test Connection]  [Use as Default]               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🟣  Anthropic Claude           ⚠️ Not Configured    │   │
│  │     [Enter API key…           ] [Save]               │   │
│  │     Models: claude-3-5-sonnet, claude-3-haiku        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💎  Google Gemini              ❌ Invalid Key        │   │
│  │     [AIza••••••••••••••••     ] [Show] [Clear]       │   │
│  │     Last tested: Failed — Invalid API key            │   │
│  │     [Test Again]                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  🤖  Local AI Model (Qwen 1.5-1.8B)       ● Online        │
│  Runs on the platform server. No key needed.               │
│  Model: Qwen/Qwen1.5-1.8B-Chat  |  Mode: CPU (4-bit)       │
│                                                              │
│  ⚙️  Rule-Based Engine                    ● Always On      │
│  Free, deterministic, no configuration needed.             │
└─────────────────────────────────────────────────────────────┘
```

**Default Generation Mode** selector (below keys):
- Dropdown: "OpenAI GPT-4o (your key)" selected

**Profile section** (also show):
- Avatar circle (initials) + "Change photo" button
- Name, email, role, timezone fields in grid
- Save button

---

### 11-admin-dashboard.html — Admin Platform Dashboard

**Sidebar**: Admin nav (indigo accent color: #4f46e5 instead of teal)

**Page header**: "Platform Overview" + "Last updated 2 min ago" + Refresh button

**7 stat tiles** (responsive grid, 4 cols → 2 on mobile):
```
Total Users:              1,847    ↑ 23 this week
Active Workspaces:          312    ↑ 8 this week
SRS Generated Today:         94    ↑ 12% vs yesterday
AI Jobs Running Now:          7    live count
Failed Jobs (24h):           12    ↑ 3 vs yesterday
Avg Generation Time:       14.2s   ↓ improving
Platform Uptime:          99.98%   last 30d
```

**Row 2 — 2 charts side by side**:

**Daily SRS Generations** (line chart, last 30 days):
- 3 lines: Rule-Based (slate), Local AI (sky), External API (violet)
- X axis: dates, Y axis: count

**Generation Mode Distribution** (donut chart):
- Segments: Rule-Based 42%, Local AI 18%, OpenAI 28%, Claude 9%, Gemini 3%
- Center: "4,721 total this month"
- Legend below

**Row 3 — 3 columns**:
- **Recent Activity Feed**: admin actions log with icons + descriptions + timestamps
- **Top Workspaces by Usage** (table): workspace name | plan | SRS this month | AI calls | Members
- **System Alerts** (stack of alert cards):
  - 🔴 "Local AI model: high memory usage (87%)" — "View logs"
  - 🟡 "12 failed jobs in past 24h — above threshold" — "Investigate"
  - 🟢 "All API keys validated successfully"

---

### 12-admin-users.html — User Management

**Page header**: "User Management" + "1,847 users" + "Export Users" button

**Filter / search bar**:
- Search input (name or email)
- Status filter: All | Active | Inactive | Unverified
- Role filter: All | Platform Admin | Regular User
- Date range (joined)

**Users table**:
```
[ ] | Name & Email           | Workspaces | Status     | Joined       | Last Active | Actions
────|────────────────────────|────────────|────────────|──────────────|─────────────|─────────
[ ] | RA  Rahul Ahmed        | 3          | ● Active   | Jun 1, 2026  | 2h ago      | [···]
    |     rahul@example.com  |            | ✉ Verified |              |             |
────|────────────────────────|────────────|────────────|──────────────|─────────────|─────────
[ ] | SK  Sara Khan          | 1          | ● Active   | Jul 15, 2026 | 1d ago      | [···]
    |     sara@company.com   |            | ✉ Verified |              |             |
────|────────────────────────|────────────|────────────|──────────────|─────────────|─────────
[ ] | AB  Ayan Biswas        | 0          | ○ Inactive | Aug 1, 2026  | 14d ago     | [···]
    |     ayan@test.com      |            | ⚠ Unverified|             |             |
```

Actions dropdown (3-dot menu): View Profile | Deactivate | Resend Verification | Make Admin | Delete

**User Detail Slide-over Panel** (right, 400px):
- Large avatar circle + name + email
- Account status + email status chips
- Workspaces list (with role in each)
- Usage stats: SRS generated, AI calls, diagrams
- Admin actions buttons
- Audit log for this user (last 10 actions)

**Bulk action bar** (shows when rows checked):
- "3 selected" | "Deactivate Selected" | "Export Selected" | "Clear"

---

### 13-admin-workspaces.html — Workspace Management

**Page header**: "Workspaces" + "312 workspaces" + filters

**Table** (similar pattern to users):
```
Workspace Name    | Owner          | Plan   | Members | SRS/month | Diagrams | Status  | Actions
──────────────────|────────────────|────────|─────────|───────────|──────────|─────────|────────
Acme Corp         | rahul@...      | Pro    | 12      | 48        | 23       | Active  | [···]
University of DH  | admin@du.ac.bd | Free   | 3       | 7         | 2        | Active  | [···]
Tech Startup XYZ  | founder@...    | Free   | 1       | 0         | 0        | Inactive| [···]
```

Clicking a row opens **Workspace Detail Panel** (right slide-over):
- Workspace name + slug + type + owner
- Plan + billing info
- Usage this month (progress bars for SRS, AI diagrams, manual saves)
- Members list (name + role + joined)
- Recent projects (last 5)
- Admin actions: Change Plan | Deactivate | Delete | Impersonate Owner

---

### 14-admin-ai-config.html — Platform AI Configuration

**Page header**: "AI Configuration" + "Platform-wide generation settings"

**Section 1 — Local AI Model Status** (large card):
```
┌─────────────────────────────────────────────────────────────┐
│  🤖  Local AI Model                    ● Online             │
│  ─────────────────────────────────────────────────────────  │
│  Model:      Qwen/Qwen1.5-1.8B-Chat                        │
│  Mode:       CPU inference (4-bit quantization)             │
│  Max tokens: 2,048                                          │
│  Artifacts:  model_artifacts/srsgen-qwen1.5                 │
│                                                              │
│  Memory:   [████████████░░░░░░░] 2.1 GB / 4 GB             │
│  Queue:    3 jobs waiting                                    │
│                                                              │
│  [Reload Model]  [View Logs]  [Disable Local Model]         │
└─────────────────────────────────────────────────────────────┘
```

**Section 2 — Platform API Keys** (fallback keys used when user has none):
- Same card-per-provider layout as user settings, but labeled "Platform Default Keys"
- OpenAI: configured (masked)
- Anthropic: not configured
- Gemini: not configured
- Note: "These are used as fallback only if user hasn't provided their own key."

**Section 3 — Generation Mode Controls**:

Toggle grid (each row: icon + label + description + toggle):
```
⚙️  Rule-Based Engine        Always available, cannot disable          [Always ON]
🤖  Local AI Model           Allow users to use Qwen on server         [ON  ●]
🔑  User-Provided API Keys   Allow users to add their own AI keys      [ON  ●]
🔐  Platform Fallback Keys   Use platform keys when user has none      [OFF ○]
```

**Default Generation Mode** for new users: dropdown selector

**Section 4 — Rate Limits** (table):
```
Mode              | Per User/hr | Per Workspace/hr | Platform/hr
──────────────────|─────────────|──────────────────|────────────
Rule-Based        | Unlimited   | Unlimited        | Unlimited
Local AI (Qwen)   | 10          | 30               | 200
OpenAI (Platform) | 5           | 20               | 100
Claude (Platform) | 5           | 20               | 100
```
All values editable inline.

---

### 15-admin-billing.html — Plans & Billing Management

**Page header**: "Plans & Billing" + "Manage subscription plans and workspace billing"

**Section 1 — Plan Editor** (3 plan cards side by side):

Each plan card (editable):
```
┌────────────────────────────┐
│  Free Plan          [Edit] │
│  ───────────────────────── │
│  Price: $0/month           │
│                            │
│  Limits (click to edit):   │
│  Projects:          5      │
│  Members:           2      │
│  SRS/month:        10      │
│  AI Diagrams/month: 3      │
│  Manual Saves/month:20     │
│                            │
│  Features:                 │
│  ✅ Rule-Based SRS         │
│  ✅ Local AI SRS           │
│  ❌ External AI SRS        │
│  ❌ Export SRS             │
│  ❌ AI Diagrams            │
│                            │
│  Active workspaces: 245    │
└────────────────────────────┘

[Pro Plan — $29/mo]  [Enterprise — $99/mo]
```

**Section 2 — Platform Revenue Overview** (stats):
- MRR: $8,934 | Total Subscribers: 67 | Free Users: 245 | Churn Rate: 2.1%

**Section 3 — Workspace Billing Table** (searchable):
```
Workspace         | Plan  | Status     | Amount  | Next Renewal | Actions
──────────────────|────────|────────────|─────────|──────────────|────────
Acme Corp         | Pro   | ● Active   | $29/mo  | Sep 30, 2026 | [Change Plan]
Tech Co.          | Pro   | ● Active   | $29/mo  | Oct 15, 2026 | [Change Plan]
StartupXYZ        | Free  | ○ Free     | $0      | —            | [Upgrade]
Big Corp Ltd      | Enter | ● Active   | $99/mo  | Nov 1, 2026  | [Manage]
```

---

## TECHNICAL REQUIREMENTS FOR EVERY HTML FILE

1. **Include in `<head>`**:
   ```html
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <script src="https://cdn.tailwindcss.com"></script>
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
   <script>
     tailwind.config = {
       theme: {
         extend: {
           fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
           colors: {
             brand: { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a' }
           }
         }
       }
     }
   </script>
   <style>
     body { font-family: 'Inter', system-ui, sans-serif; font-size: 15px; line-height: 1.45; }
     /* Add any custom CSS here */
   </style>
   ```

2. **Use realistic placeholder data** — not "Lorem ipsum". Use actual:
   - Project names: "E-Commerce Platform", "Hospital Management System", "University ERP"
   - Requirement codes: FR-001 through FR-016, NFR-001 through NFR-005
   - User names: "Rahul Ahmed", "Sara Khan", "Admin User"
   - Timestamps: relative ("2h ago", "3 days ago") and absolute ("Aug 29, 2026")

3. **Every interactive element** must have hover states (Tailwind hover: classes)

4. **All icons** use inline SVG or Lucide CDN:
   ```html
   <script src="https://unpkg.com/lucide@latest"></script>
   <!-- Usage: <i data-lucide="file-text" class="w-4 h-4"></i> -->
   <script>lucide.createIcons();</script>
   ```

5. **Sidebar and topbar** must be copy-paste identical across all authenticated pages (02 through 15)

6. **Active nav item** in sidebar must correctly highlight the current page's nav item

7. **Responsive**: all pages must work at 1280px minimum width. Sidebar collapses to icons only below 1024px.

8. **The comparison page (08-srs-compare.html)** must include working tab switching between Requirements, SRS Document, and Class Diagram tabs using vanilla JS (no frameworks needed).

9. **The generation progress page (06-srs-step3-progress.html)** must have a CSS animation simulating the progress bar filling up (use @keyframes or CSS transitions).

---

## OUTPUT FORMAT

Produce each file one at a time. Start with `01-auth.html`, then proceed in order.

For each file:
1. State the filename as a markdown heading: `## 01-auth.html`
2. Provide the complete HTML in a single code block
3. Brief note on what placeholder interactivity was added (tabs, toggles, etc.)

Do not abbreviate or truncate any HTML file. Every file must be complete and self-contained.

---

*Context: This UI will be implemented as React + TypeScript + Tailwind CSS v4 components connected to a FastAPI backend. The HTML designs will be converted to React components. Keep component structure clean and logical to ease conversion.*
