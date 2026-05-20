# Takorin Design System
## AI Coding Agent Reference — v2.0 · May 2026

This document is the single source of truth for the Takorin design system.
Read this before writing any UI code. Every decision here is intentional.

---

## 1. What Takorin Is

An operational intelligence platform for food manufacturing. Not a dashboard —
an agent that tells plant directors what to do before it's too late.

**Primary user:** Plant director. Overseeing 2–6 lines across multiple facilities.
Reading at a desk, sometimes on a tablet. High stakes. Low tolerance for noise.

**Mental model:** A precision instrument on a dark surface. Like SCADA readouts,
aviation glass cockpits, or a Bloomberg terminal. Warm bone text on dark graphite.
Not cold enterprise blue — dark and material, but still warm.

---

## 2. Color System

The platform is **dark mode**. All colors must work on dark graphite surfaces.

### Surface scale (dark graphite — cool-neutral)
```
stone:    #0B0F18  — primary page background (bg-stone)
stone-2:  #131A26  — secondary surface, section headers
stone-3:  #1B2538  — hover state, alternate row
stone-4:  #263042  — elevated card, active state
```

### Text scale (warm bone)
```
ink:      #EDE4CB  — primary text
ink-2:    #9B9070  — secondary text, subdued labels
muted:    #7A8EA8  — metadata, labels, ghost text (cool blue-gray)
```

### Borders
```
rule:     #263042  — structural border (matching stone-4)
rule-2:   #1A2335  — subtle border
```

### Primary accent — steel blue (interactive, structural)
```
ochre:        #4B9CE4  — primary CTA, active states, nav indicator
ochre-dim:    #0D1E38  — tinted background
ochre-dark:   #2A6AAD  — pressed state
ochre-light:  #7BBDEE  — softer highlight
```
> Note: The token is named `ochre` for legacy reasons. Its value is steel blue.
> NEVER think of it as orange/amber — the design has pivoted to blue.

### Narrative accent — clay (context, interpretation, insight)
```
context:      #C4844E  — human interpretation text, narrative voice
context-dim:  #2A1808  — tinted background
```
Use `context` color for narrative descriptions in `IntelCard` and `SceneHeader`
statements. This is the "warm interpretation" layer, distinct from data precision.

### Predictive accent — indigo (AI-derived, historical)
```
deep:      #7C86E8  — AI-predicted values, historical trends
deep-dim:  #141830  — tinted background
```

### Semantic (status only — never decoration)
```
ok:       #5FA877, ok-dim: #0D2518   — healthy, confirmed, resolved
warn:     #C98E2A, warn-dim: #2A1E08 — approaching threshold, attention
danger:   #DE6C4E, danger-dim: #2A100A — critical, blocked, overdue
```

### Sidebar (blue-black, distinct from page graphite)
```
sidebar:        #080D16
sidebar-2:      #0E1520
sidebar-3:      #152030
sidebar-border: #1C2A40
sidebar-ghost:  #6A88A8  — muted sidebar text
```

---

## 3. Typography

**Two typefaces. Two voices.**

- `font-body` → IBM Plex Mono. **System voice.** All data, labels, numbers, pills,
  evidence strings, timestamps, identifiers. Self-hosted via `@fontsource/ibm-plex-mono`.
- `font-display` → IBM Plex Sans. **Narrative voice.** Human-language statements,
  descriptions, section titles, action banners, interpretive copy.

Monospace = precision. Everything that came from a sensor, a database, or a
calculation uses `font-body`. Everything a human wrote or that explains context
uses `font-display`. This distinction is intentional and meaningful.

### Named type scale (from tailwind.config.js)
```
micro:    10px / 1.2  — nav section headers, timestamps, tracking labels
label:    11px / 1.2  — metadata, sidebar text, pills
body:     13px / 1.45 — standard body text
base:     15px / 1.4  — section headings, banner headlines
head:     18px / 1.3  — SPRow values, sub-headings
subhead:  20px / 1.2
title:    22px / 1.2
metric:   28px / 1.0  — StatCell values
page:     32px / 1.1  — PageHead titles
display:  40px / 1.0
score:    48px / 1.0
hero:     64px / 1.0
```

The SceneHeader large metric uses inline `fontSize: 80` (not a Tailwind class).

### Tracking convention
- Section labels: `tracking-widest` + uppercase
- Nav section headers: `tracking-widest`
- Metrics and scores: `tracking-tight`
- Normal copy: default tracking

---

## 4. Layout Structure

### Persistent sidebar
```
width:      240px (w-[240px])
background: #080D16 (bg-sidebar)
position:   fixed inset-y-0 left-0
border-r:   1px solid sidebar-border
z-index:    30
```

### Main content area
```
<div class="flex h-screen bg-stone overflow-hidden">
  <Sidebar />                         <!-- fixed, 240px -->
  <main class="flex-1 flex flex-col overflow-hidden ml-[240px]">
    <TrustStrip />                    <!-- slim persistent status bar -->
    {roleInfo && <RoleBanner />}      <!-- shown when viewing as non-director -->
    <Suspense>
      <Routes />
    </Suspense>
  </main>
</div>
```

### TrustStrip
A slim persistent bar above all content showing system confidence signal.
Always visible. Communicates data freshness / model trust level at a glance.

### Role banner
When `viewingRole !== 'director'`, a `bg-stone2 border-b border-rule` bar appears
showing who is being viewed as and an "Exit role view" button.

### Within each screen
Most screens follow:
```
SceneHeader (hero, flex-shrink-0)
[optional ActionBanner or tab row]
Layout (flex-1 min-h-0 overflow-hidden)
  ├── main column (flex-1 overflow-y-auto)
  └── RightRail (w-[260px] bg-stone-2 border-l border-rule overflow-y-auto)
```

### Right rail
```
width:      260px (w-[260px])
background: stone-2 (#131A26)
border-l:   1px solid rule
overflow-y: auto
```

---

## 5. Navigation & Roles

### Role-based navigation
The sidebar renders different nav based on `viewingRole` from AppState:

**Director** (default): Full graph
- Overview
- Operations: Shift, Suppliers, CAPA, Analytics, Agents, Outcomes
- Platform (collapsible): Batches, Compliance, Site, Knowledge, Execution,
  Records (pharma only), Value Chain (electronics/semi only), Equipment (non-pharma),
  Integrations, Readiness
- Activity: Notifications

**Supervisor**: ShiftIQ, Agents, Outcomes, Notifications

**Operator**: My Station only

### Plant switcher
Dropdown off the facility button at the top of the sidebar. Three active plants:
- Salina Campus (SL-04) — human workforce
- Wichita Plant (KS-09) — robotic workforce
- Denver Plant (CO-07) — hybrid workforce

Two sector demos: Södertälje (pharma), Amberg (electronics).
Switching plant also sets `workerMode`.

---

## 6. Routing

React Router v6. Lazy-loaded with `ErrorBoundary` wrappers.

```
/           → redirect to /overview
/overview   → PlantOverview
/shift      → ShiftIQ
/supplier   → SupplierIQ
/capa       → CAPAEngine
/readiness  → DataReadiness
/operator   → OperatorView
/analytics  → Analytics
/agents     → AgentControl
/batch      → BatchIntelligence
/compliance → CompliancePolicy
/hierarchy  → ProcessHierarchy
/knowledge  → KnowledgeVault
/execution  → ExecutionAuthority
/records    → RecordVault (pharma sector only)
/delivery   → ValueChain (electronics/semiconductor only)
/equipment  → EquipmentIntelligence
/integration → IntegrationHub
/outcomes   → ImpactLoop
/notifications → NotificationCenter
```

Legacy redirects: `/handoff → /shift`, `/network → /supplier`,
`/robots → /shift`, `/allocation → /shift`, `/digest → /analytics`,
`/plant → /overview`, `/command → /overview`.

---

## 7. Component Reference

### SceneHeader — V2 hero (use this, not ActionBanner + StatBar stacks)
```jsx
<SceneHeader
  module="SHIFT"
  context="Line 4 · AM Shift"
  live={true}
  timestamp="06:42"
  metric={54}
  metricColor="var(--color-danger)"
  metricLabel="Risk score"
  statement="Two open findings require intervention before end of shift."
  meta={[{ label: 'OEE', value: '67%' }, { label: 'Workers', value: '18' }]}
  tone="danger"
>
  {/* optional signal strip — <SignalChip> children */}
  <SignalChip label="Oven B sensor stale" healthy={false} />
  <SignalChip label="Staffing covered" healthy={true} />
</SceneHeader>
```
- `tone` drives the atmospheric glow behind the metric: `danger` | `warn` | `ok` | `muted`
- The `statement` renders in `font-display` with `color: var(--color-context)` — narrative voice
- `metric` renders at 80px in `font-body font-bold` with `letterSpacing: '-0.03em'`
- `meta` array renders as a small row of `label · value` pairs in `font-body text-micro`
- Children (signal strip) appear in a `border-t border-rule` footer row

### IntelCard — finding / recommendation card (replaces old CaseCard for primary findings)
```jsx
<IntelCard
  ordinal="I."
  title="Startup checklists overdue on 4 stations"
  description="Stations missed the 06:00 window — pattern matches 3 of last 5 high-risk shifts."
  evidence="STATION-09 · STATION-11 · STATION-14 · STATION-17 · Overdue 42 min"
  tone="danger"
  done={shiftActed['sf1']}
  consequenceMessage="Checklist marked complete — finding closed."
>
  <Btn variant="primary" onClick={...}>Mark complete</Btn>
</IntelCard>
```
- Left border color = `toneColor(tone)` (3px)
- `title` → `font-display font-semibold text-ink text-base`
- `description` → `font-display text-body` in `color: var(--color-context)`
- `evidence` → `font-body text-micro text-muted`
- `done` → fades card to 45% opacity, shows check + `consequenceMessage`
- Background: `stone-2`, outer border: `rule`

### StatCell — stat bar cell
```jsx
<StatCell label="OEE TODAY" value="67%" sub="Target: 82%" fill={67} tone="warn" />
```
- Top border stripe = `tone` color (2px, via `border-t-2 border-t-{tone}`)
- Value → `font-body font-bold text-metric text-ink tabular-nums`
- Label → `font-body text-micro text-muted tracking-widest`
- Fill bar: `h-[2px]` rule background with toned fill

### StatusPill — unified status chip
```jsx
<StatusPill tone="danger">Critical</StatusPill>
<StatusPill tone="warn">Watch</StatusPill>
<StatusPill tone="ok">Clear</StatusPill>
<StatusPill tone="alert">3</StatusPill>
<StatusPill status="complete" />   // auto-label + check icon
```

### SignalChip — inline status dot for hero signal strips
```jsx
<SignalChip label="Allergen changeover" healthy={false} />
<SignalChip label="All certs current" healthy={true} tone="warn" />
```

### ScoreRing — horizontal bar gauge (not SVG ring)
```jsx
<ScoreRing pct={87} size={32} />
<ScoreRing pct={54} size={64} color="var(--color-danger)" />
```
- `pct ≥ 75` → ok, `≥ 60` → warn, `< 60` → danger (auto, unless `color` passed)
- Renders a number + thin horizontal fill bar
- `size` controls width and number size

### ActionBanner — contextual alert strip
```jsx
<ActionBanner tone="danger" headline="Export blocked" body="CAPA-2604-006 missing evidence.">
  <Btn variant="secondary">Upload evidence</Btn>
</ActionBanner>
```
- `tone="muted"` → `bg-stone3 border-b border-rule2`
- Other tones → tonal background + bottom border

### Btn
```jsx
<Btn variant="primary" onClick={...}>Export</Btn>
<Btn variant="secondary" icon={Upload}>Upload</Btn>
<Btn disabled>Blocked</Btn>
```
- `primary` → `bg-ochre text-stone hover:bg-ochre-dark`
- `secondary` → `border border-rule bg-stone2 text-ink hover:bg-stone3`
- `rounded-btn` (2px) on all buttons
- `disabled` → `opacity-40 cursor-not-allowed`

### CaseCard — compact list item (CAPA, findings list)
```jsx
<CaseCard urgency="danger" num="1">
  <p className="font-body font-medium text-ink text-body">...</p>
  <p className="font-body text-muted text-label italic">...</p>
</CaseCard>
```
- Top color bar (3px) = `urgency` tone
- Left column: ordinal number in `tone` color
- `bg-stone border border-rule`

### PageHead — detail/settings page header
```jsx
<PageHead over="CAPA ENGINE" title="CAPA-2604-006" accent="var(--color-danger)">
  Evidence required
</PageHead>
```
- Left border accent (3px inline style)
- `bg-stone2` background

### SP / SPRow — side rail sections
```jsx
<SP title="Shift summary" sub="AM shift">
  <SPRow label="Risk score" value="54" valueColor="text-danger" />
  <SPRow label="Open findings" value="3" sub="2 overdue" />
</SP>
```
- `SP` wraps with labeled header and border
- `SPRow` → `flex justify-between px-5 py-3 border-b border-rule2`

### SectionHeader
```jsx
<SectionHeader tone="warn" label="WATCH" sub="3 items" />
<SectionHeader tone="ok" label="CLEARED" title="Certified operators" icon={Users} />
```

### Layout + RightRail
```jsx
<Layout side={<RightRailContent />}>
  <MainContent />
</Layout>
```
- `Layout` = `flex flex-1 min-h-0 overflow-hidden`
- Main = `flex-1 overflow-y-auto`
- `RightRail` = 260px right column

### FilterDropdown, SlidePanel
- `FilterDropdown` — dropdown with checkbox/radio filter options
- `SlidePanel` — right-edge slide-over (min(480px, 95vw)), `shadow-raise`, slide-in animation

### Dot — GitHub-style intensity square (CAPA pattern matrix)
```jsx
<Dot level="d4|d3|d2|d1|w4|w3|w2|w1|ok|empty" />
```
- `d1–d4`: danger intensity (d4 = solid danger)
- `w1–w4`: warn intensity
- `ok`: resolved green
- `empty`: 40% opacity rule-2
- Shape: `w-2 h-2 rounded-sm`

### PersonAvatar
```jsx
<PersonAvatar name="J. Crocker" size={28} />
```
- Uses BoringAvatar with the platform palette

### ConsequenceNotice
```jsx
<ConsequenceNotice show={acted}>
  CAPA-2604-006 closed — export unblocked.
</ConsequenceNotice>
```
- Slide-in animation when `show` becomes true
- `bg-ok/10 text-ok border-t border-ok/20`

---

## 8. Interaction Patterns

### Evidence gate
Buttons that depend on blocking items must render `disabled` (`opacity-40 cursor-not-allowed`).
Clicking the disabled button flashes danger briefly. Never allow false success.

### Consequence visibility
Every consequential action must surface what changed. Use `IntelCard`'s built-in
`done` + `consequenceMessage` props, or the standalone `ConsequenceNotice` component.
The metric that updated + what it means for the plant must be visible.

### SlidePanel (case detail)
Clicking a case/finding title opens a right-edge slide panel (not a modal).
Width: `min(480px, 95vw)`. Slide-in from right.
Closes: overlay click or X button.

### Data Readiness score reactivity
Resolving a naming conflict or context gap:
1. Updates score state in AppState
2. Increments `ScoreRing` via CSS transition on width
3. Shows `ConsequenceNotice` with new score value

### Role view
Switching roles via the user dropdown in the sidebar re-routes to the appropriate
start screen and scopes the nav to that role's access level.

### Plant switching
Selecting a different plant from the facility dropdown updates `currentPlant` in
AppState, which sets `workerMode` automatically and re-reads compliance state.
Sector-conditional nav items (Records, Value Chain) respond to the new sector.

---

## 9. State Architecture

All shared interactive state lives in `src/context/AppState.jsx`.

Key state slices:
```
viewingRole         — 'director' | 'supervisor' | 'operator-reyes' | 'operator-okonkwo'
currentPlant        — PLANTS.sl | .ks | .co | .se | .de
workerMode          — 'human' | 'robot' | 'hybrid'
shiftActed          — { [findingId]: boolean }
blockingEvidenceUploaded — boolean
allergenOverride    — null | { reason, by, at }
checklistSigned     — { [checklistId]: boolean }
closedCases         — string[]
readinessScore      — number
escalationStates    — { [findingId]: { state, owner, chain[] } }
agentActions        — action log entries
agentDecidedKeys    — Set<string>
commandAcknowledged — Set<string>
activityLog         — entries[]
```

Screened screens import `useAppState()` — never manage these locally.

---

## 10. Data Layer

Static data lives in `src/data/index.js`. Each screen imports its own slice.
Key exports:
```js
import { shiftData, line6Data, wichitaData, denverData, facility } from '../data'
import { handoffData }        from '../data'
import { supplierData }       from '../data'
import { capaData }           from '../data'
import { readinessData, systemConfidenceScore } from '../data'
import { commandData, agentConfigData }         from '../data'
import { interventionSummary, interventions }   from '../data/interventions'
```

To swap in real data: replace the named export with an API call. Component interfaces
do not need to change.

---

## 11. What Never To Do

- **No light surfaces.** This is a dark platform. `bg-white`, `bg-gray-*`,
  `bg-slate-*`, `bg-stone-*` (Tailwind built-ins) are wrong — use the custom tokens.
- **No border-radius beyond `rounded-btn` (2px for buttons) and `rounded-full` (avatars/dots).**
  No `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl` on panels, cards, chips.
- **No gradients** as decoration. The SceneHeader gradient (stone-2 → stone) is structural.
  Functional gradients (benchmark bars) are fine.
- **No drop shadows** on marks or wordmarks. `shadow-raise` only for floating overlays
  and `shadow-card` for card lift.
- **No tooltip-only urgency.** If something is wrong, it must be visible without hovering.
- **Never** allow an action to complete silently. Every action needs a consequence
  notice or a clear state change.
- **Never** use Tailwind's default blue (`blue-*`) for branding. `ochre` (steel blue)
  is the accent — use its token, not a hardcoded value.
- **Never** use `font-body italic` for display text. Italic is removed from the V2
  voice — `font-display` handles narrative, `font-body` handles data.
- **Do not** build `ActionBanner + StatBar` stacks as the primary screen hero.
  Use `SceneHeader` instead (it contains both).
- **Do not** hardcode colors as hex values. Always use CSS variables or Tailwind tokens.

---

## 12. CSS Variables & Utility Classes

Custom CSS utilities in `src/index.css`:

```css
/* Animation glow — driven by tone */
.atmo-glow-danger  { /* danger ambient pulse */ }
.atmo-glow-warn    { /* warn ambient pulse */ }
.atmo-glow-ok      { /* ok ambient pulse */ }

/* Animated live dot */
.live-dot          { animation: beat 2s ease-in-out infinite }

/* Dropdown slide-in */
.plant-drop-in     { }
.plant-drop-in-content { animation: ... }

/* Slide-in (slide panel, consequence notice) */
.slide-in          { }
```

Timing tokens in CSS:
```css
--dur-data:   300ms
--ease-enter: cubic-bezier(0.19, 0.91, 0.38, 1)
--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)
--ease-exit:  cubic-bezier(0.42, 0, 1, 1)
```

Tailwind custom `transitionTimingFunction` tokens: `ease-enter`, `ease-exit`,
`ease-spring`, `ease-inout`, `ease-standard`.

---

## 13. File Structure

```
src/
  App.jsx                   — routes + layout shell, no logic
  main.jsx                  — ReactDOM.createRoot
  index.css                 — Tailwind imports + custom utilities
  context/
    AppState.jsx            — all shared interactive state
  components/
    Sidebar.jsx             — persistent left nav (240px, dark)
    UI.jsx                  — all shared primitives
    TrustStrip.jsx          — persistent system confidence bar
    ConsequenceNotice.jsx   — slide-in action consequence panel
    FindingCard.jsx         — finding card variant
    ShiftHero.jsx           — ShiftIQ hero section
    PatternMatrix.jsx       — GitHub-style CAPA pattern matrix
    BenchmarkBlock.jsx      — benchmark comparison block
    AgentTimeline.jsx       — agent action log timeline
    ErrorBoundary.jsx       — screen-level error recovery
  screens/
    PlantOverview.jsx       — /overview  (default landing)
    ShiftIQ.jsx             — /shift
    SupplierIQ.jsx          — /supplier
    CapaEngine.jsx          — /capa
    DataReadiness.jsx       — /readiness
    OperatorView.jsx        — /operator
    Analytics.jsx           — /analytics
    AgentControl.jsx        — /agents
    NotificationCenter.jsx  — /notifications (also used inline)
    BatchIntelligence.jsx   — /batch
    CompliancePolicy.jsx    — /compliance
    ProcessHierarchy.jsx    — /hierarchy
    KnowledgeVault.jsx      — /knowledge
    ExecutionAuthority.jsx  — /execution
    RecordVault.jsx         — /records
    ValueChain.jsx          — /delivery
    EquipmentIntelligence.jsx — /equipment
    IntegrationHub.jsx      — /integration
    ImpactLoop.jsx          — /outcomes
  data/
    index.js                — all static fake data
    interventions.js        — intervention data
  lib/
    tokens.js               — raw color/token values for SVGs and inline styles
    utils.js                — riskColorClass, riskLabel, useFocusTrap, etc.
    styles.js               — toneStyle() utility
tailwind.config.js          — token definitions
design.md                   — this file
```

---

## 14. Running the Project

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

Navigate using the left sidebar. Default route is `/overview` (PlantOverview).
Switch roles via the user button at the bottom of the sidebar.
Switch plants via the facility button below the brand mark.
