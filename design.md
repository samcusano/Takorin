# Takorin Design System
## AI Coding Agent Reference — v3.0 · June 2026

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
stone:    #0B0F18  — primary page background      (bg-stone)
stone2:   #131A26  — secondary surface, section headers  (bg-stone2)
stone3:   #1B2538  — hover state, alternate row     (bg-stone3)
stone4:   #263042  — elevated card, active state    (bg-stone4)
```
> Note: Tailwind generates `bg-stone-2` with hyphen from the config, but the
> codebase uses `bg-stone2` (no hyphen). Explicit utility classes in `index.css`
> bridge this gap. **Always use the no-hyphen form: `bg-stone2`, `bg-stone3`, etc.**

### Text scale (warm bone)
```
ink:      #EDE4CB  — primary text         (text-ink)
ink-2:    #9B9070  — secondary/subdued    (text-ink2)
muted:    #7A8EA8  — metadata, labels, ghost text — cool blue-gray  (text-muted)
```

### Borders
```
rule:     #263042  — structural border    (border-rule)
rule2:    #1A2335  — subtle border        (border-rule2)
```
> `border-rule2` — no hyphen, matching the utility class pattern above.

### Primary accent — signal / steel blue (interactive, structural)
```
signal:        #4B9CE4  — primary CTA, active states, nav indicator  (bg-signal / text-signal)
signal-dim:    #0D1E38  — tinted background
signal-dark:   #2A6AAD  — pressed / hover state
signal-light:  #7BBDEE  — softer highlight
```
> This token was formerly named `ochre` in old versions of this doc.
> The name is now `signal`. Never use `ochre` — it does not exist in the config.

### Narrative accent — context / clay (interpretation, insight)
```
context:      #C4844E  — human interpretation text, narrative voice
context-dim:  #2A1808  — tinted background
```
Use `context` for interpretive statements in `SceneHeader` and narrative
descriptions. This is the "warm interpretation" layer, distinct from data precision.

### Predictive accent — deep / indigo (AI-derived, historical)
```
deep:      #7C86E8  — AI-predicted values, historical trends
deep-dim:  #141830  — tinted background
```

### Semantic (status only — never decoration)
```
ok:       #5FA877, ok-dim:    #0D2518  — healthy, confirmed, resolved
warn:     #C98E2A, warn-dim:  #2A1E08  — approaching threshold, attention
danger:   #DE6C4E, danger-dim: #2A100A — critical, blocked, overdue
```

### Sidebar (blue-black, distinct from page graphite)
```
sidebar:        #080D16
sidebar-2:      #0E1520   (bg-sidebar2)
sidebar-3:      #152030   (bg-sidebar3)
sidebar-border: #1C2A40
sidebar-ghost:  #6A88A8  — muted sidebar text
```

---

## 3. Typography

**Three typefaces. Two voices. One numeric family.**

- `font-display` → **Bricolage Grotesque**. Narrative/editorial voice. Section titles,
  hero statements, action headlines, interpretive descriptions, human-language copy.
- `font-body` → **Plus Jakarta Sans**. Operational voice. All data labels, metadata,
  pills, evidence strings, timestamps, identifiers, UI chrome, button text.
- `.display-num` (CSS utility class) → **JetBrains Mono**. Every quantitative
  output: risk scores, OEE%, metric values, confidence numbers. Apply as an
  *additional* class alongside `font-body` or standalone on number spans.

The core distinction: `font-display` frames meaning, `font-body` conveys facts,
`.display-num` presents measurements. `.display-num` is not a `font-*` Tailwind
class — it's a utility that sets JetBrains Mono with tabular-nums and tight tracking.

### Named type scale
```
micro:    10px / 1.2  — nav section labels, timestamps, tracking metadata
label:    11px / 1.2  — inline labels, badges, status pills
body:     13px / 1.45 — primary reading text
base:     15px / 1.4  — subheadings, banner headlines, panel titles
head:     18px / 1.3  — section titles, SPRow values, kpi labels
title:    22px / 1.2  — stat callout values, mid-size numerics
metric:   28px / 1.0  — StatCell values, kpi grid cells
score:    48px / 1.0  — hero risk / shift scores
hero:     64px / 1.0  — primary screen numerals
jumbo:    80px / 1.0  — highest-emphasis plant-level metrics
```
> There are no `subhead`, `page`, or `display` aliases. They have been removed.
> Use `head`, `metric`, and `score` respectively.

### Numeric display convention
All numbers shown as data — scores, percentages, counts, durations — use:
```
className="display-num text-{scale}"
```
For large hero metrics inside `SceneHeader`, the component handles this internally
using `display-num text-score`.

### Tracking convention
- Section labels: `tracking-wide` + uppercase (via `SectionLabel` component)
- Normal copy: default tracking

---

## 4. Layout Structure

### Persistent sidebar
```
width (expanded):  240px
width (collapsed): 48px (icon-only, spring transition)
background:        #080D16 (bg-sidebar)
position:          fixed inset-y-0 left-0
border-r:          1px solid sidebar-border
z-index:           30
transition:        width 200ms ease-spring
```

### Main content area
```jsx
<div className="flex h-screen bg-stone overflow-hidden">
  <Sidebar />                           {/* fixed, 240px or 48px collapsed */}
  <main className="flex-1 flex flex-col overflow-hidden ml-[240px]">
    <TrustStrip />                      {/* slim persistent status bar */}
    {roleInfo && <RoleBanner />}        {/* shown when viewing as non-director */}
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
Most screens with a SceneHeader follow:
```
SceneHeader (hero, flex-shrink-0)
[optional ActionBanner or Tabs row]
Layout (flex-1 min-h-0 overflow-hidden)
  ├── main column (flex-1 overflow-y-auto)
  └── RightRail (w-80 / 320px, bg-stone2, border-l border-rule2)
```
Some screens (ValueChain, SupplierIQ, BatchIntelligence) use custom
three-column layouts instead of Layout + RightRail.

### RightRail
```
width:      w-80 (320px)
background: stone2 (#131A26)
border-l:   1px solid rule2
overflow-y: auto
hidden on:  below lg breakpoint
```

---

## 5. Navigation & Roles

### Role-based navigation
The sidebar renders different nav based on `viewingRole` from AppState:

**Director** (default): Full intelligence graph
- Overview
- Operations: Shift, Suppliers, CAPA, Agents, Analytics, Outcomes
- Platform (collapsible): Batches, Equipment (non-pharma only), Compliance,
  Knowledge, Autonomy, Site, Records, Value Chain (electronics/semiconductor only),
  Integrations, Data Quality
- Activity: Notifications

**Supervisor**: Shift, Agents, Outcomes, Notifications

**Operator**: My Station only

### Plant switcher
Dropdown off the facility button at the top of the sidebar. Three active plants:
- Salina Campus (SL-04) — human workforce
- Wichita Plant (KS-09) — robotic workforce
- Denver Plant (CO-07) — hybrid workforce

Two sector demos: Södertälje (SE-pharma), Amberg (DE-electronics).
Switching plant also sets `workerMode` automatically.

---

## 6. Routing

React Router v6. Lazy-loaded with `ErrorBoundary` wrappers.

```
/              → redirect to /overview
/overview      → PlantOverview
/shift         → ShiftIQ
/supplier      → SupplierIQ
/capa          → CapaEngine
/readiness     → DataReadiness
/operator      → OperatorView
/analytics     → Analytics
/agents        → AgentControl
/batch         → BatchIntelligence
/compliance    → CompliancePolicy
/hierarchy     → ProcessHierarchy
/knowledge     → KnowledgeVault
/execution     → ExecutionAuthority
/records       → RecordVault
/delivery      → ValueChain
/equipment     → EquipmentIntelligence
/integration   → IntegrationHub
/outcomes      → ImpactLoop
/notifications → NotificationCenter (also used as inline overlay)
```

Legacy redirects: `/briefing → /overview`, `/plant → /overview`,
`/handoff → /shift`, `/robots → /shift`, `/allocation → /shift`,
`/digest → /analytics`, `/network → /supplier`, `/impact → /outcomes`.

---

## 7. Component Reference

All shared components live in `src/components/UI.jsx`.
Import by name: `import { SceneHeader, Btn, StatusPill, ... } from '../components/UI'`

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
  {/* optional signal strip — SignalChip children */}
</SceneHeader>
```
- `tone` drives the atmospheric glow behind the metric: `danger | warn | ok | muted`
- `statement` renders in `font-display text-ink text-base leading-relaxed`
- `metric` renders with `display-num text-score` (48px JetBrains Mono) in tone color
- `meta` array renders as `font-body text-micro` label · value pairs
- `metricColor` overrides tone color for the metric value
- Children appear in a `border-t border-rule2` footer strip

### StatusPill — unified status chip
```jsx
<StatusPill tone="danger">Critical</StatusPill>
<StatusPill tone="warn">Watch</StatusPill>
<StatusPill tone="ok">Clear</StatusPill>
<StatusPill tone="muted">Inactive</StatusPill>
<StatusPill tone="signal">Live</StatusPill>
<StatusPill status="complete" />   // auto-label + check icon
<StatusPill status="error" />      // auto-label + X icon
```

### StatCell — stat bar cell (StatBar component)
```jsx
<StatCell label="OEE TODAY" value="67%" sub="Target: 82%" fill={67} tone="warn" />
```
- Top border stripe (2px): `border-t-2 border-t-{tone}`
- Value: `font-body font-bold text-metric text-ink tabular-nums` (28px)
- Label: `font-body text-micro text-muted`
- Fill bar: `h-[2px]` rule background with toned fill, transition-[width]

### StatGrid — metric grid with gap borders
```jsx
<StatGrid cols={3}>
  <StatGrid.Cell label="On-time delivery" value="94%" tone="text-ok" />
  <StatGrid.Cell label="Avg lead time"    value="14d"  tone="text-warn" size="lg" />
</StatGrid>
```
- `cols`: number of equal-width columns (default 4)
- `noBorder`: removes bottom border (useful inside panels)
- `StatGrid.Cell` size: `sm` (text-base), `md` (text-title, default), `lg` (text-metric)
- Values render with `.display-num`

### SectionHeader — screen-level section bar
```jsx
{/* Compact bar — StatusPill + sub text + optional badge */}
<SectionHeader sub="Orders · 12" badge={<StatusPill tone="warn">3 late</StatusPill>} />

{/* Full bar — with title, optional tone pill + icon on left */}
<SectionHeader tone="warn" label="LATE" title="Blocked shipments" icon={AlertTriangle} />
```
Signature: `{ tone, label, sub, title, icon, accent, badge, className }`
- Without `title`: compact `bg-stone2` bar, `font-body text-muted text-label`
- With `title`: `font-display font-semibold text-ink text-base` title, badge right

### SectionLabel — in-panel section divider
```jsx
<SectionLabel label="Certification gaps" badge="4" badgeTone="warn" />
```
- Distinct from `SectionHeader` — lighter weight, for sub-sections inside panels
- Uppercase micro text: `font-body text-micro text-muted tracking-wide uppercase`
- `bg-stone2 border-b border-rule2`

### Btn — button variants
```jsx
<Btn variant="primary" onClick={...}>Export</Btn>
<Btn variant="secondary" icon={Upload}>Upload evidence</Btn>
<Btn variant="ghost">Cancel</Btn>
<Btn disabled>Blocked</Btn>
```
- `primary`:   `bg-signal text-white hover:bg-signal-dark hover:shadow-raise`
- `secondary`: `border border-rule bg-stone2 text-ink hover:bg-stone3`
- `ghost`:     `text-muted hover:text-ink`
- All: `rounded-btn` (2px), `font-body font-medium text-body`, min-h 40px
- `disabled`: `opacity-40 cursor-not-allowed` — enforced at element level

### HoldButton — hold-to-confirm destructive action
```jsx
<HoldButton
  label="Release lot"
  holdLabel="Keep holding…"
  doneLabel="Released"
  duration={1500}
  tone="danger"
  onConfirm={handleRelease}
/>
```
- `tone`: `ok | warn | danger`
- Fill bar sweeps left-to-right via rAF while held; springs back on release
- Fires `onConfirm` once full; irreversible until remount

### ActionBanner — contextual alert strip
```jsx
<ActionBanner tone="danger" headline="Export blocked" body="CAPA-2604-006 missing evidence.">
  <Btn variant="secondary">Upload evidence</Btn>
</ActionBanner>
```
- `tone="muted"` → `bg-stone3 border-b border-rule2`
- Other tones → tonal background + bottom border via `toneStyle()`
- `headline`: `font-display font-semibold text-ink text-base`
- `body`: `font-display text-muted text-body`

### CaseCard — compact finding/list item
```jsx
<CaseCard urgency="danger" num="1">
  <p className="font-body font-medium text-ink text-body">...</p>
  <p className="font-body text-muted text-label">...</p>
</CaseCard>
```
- Top color bar (3px) = urgency tone
- Left column: ordinal in tone color, `font-body font-bold text-base`
- `bg-stone border border-rule`

### SP / SPRow — right rail sections
```jsx
<SP title="Shift summary" sub="AM shift">
  <SPRow label="Risk score" value="54" valueColor="text-danger" />
  <SPRow label="Open findings" value="3" sub="2 overdue" />
</SP>
```
- `SP`: titled group wrapper with `font-display font-semibold text-ink text-base` header
- `SPRow`: `flex justify-between px-5 py-3 border-b border-rule2`
  - Value: `font-body font-bold text-head leading-none` + `valueColor`

### PageHead — detail/settings page header
```jsx
<PageHead over="CAPA ENGINE" title="CAPA-2604-006" accent="var(--color-danger)" meta={[...]}>
  Evidence required
</PageHead>
```
- 3px left accent border (inline style), `bg-stone2`
- `title`: `font-display font-bold text-metric text-ink`
- Inline child renders after title in accent color, `font-display font-normal`
- `meta`: `[{ role, val }]` pairs below the title

### AccentRow — border-left tone row
```jsx
<AccentRow tone="warn" bg={true}>
  {/* row content */}
</AccentRow>
```
- `tone`: `danger | warn | ok | signal | muted`
- `bg`: adds subtle tonal fill (e.g. `bg-danger/[0.03]`)
- `border-l-2` + `border-b border-rule2`

### MetricCard — KPI card with sparkline
```jsx
<MetricCard
  title="OEE · 7-day trend"
  value="72%"
  valueColor="text-warn"
  waveformData={[...]}
  waveformColor="var(--color-warn)"
  meta={{ label: 'Target', value: '82%' }}
/>
```
- Value: `font-body font-bold text-metric`
- Sparkline via `WaveformSparkline` (smooth bezier curve)

### Layout + RightRail
```jsx
<Layout side={<RightRailContent />}>
  <MainContent />
</Layout>
```
- `Layout`: `flex flex-1 min-h-0 overflow-hidden`
- Main: `flex-1 overflow-y-auto`
- `RightRail`: `w-80` (320px), `bg-stone2`, `border-l border-rule2`, hidden below lg

### MasterDetail — master list + detail panel
```jsx
<MasterDetail sidebarWidth={280}>
  <MasterDetail.Sidebar>
    {/* list */}
  </MasterDetail.Sidebar>
  <MasterDetail.Content>
    {/* detail */}
  </MasterDetail.Content>
</MasterDetail>
```
- `sidebarWidth`: 240 | 280 | 360 (px)

### Tabs — underline navigation tabs
```jsx
<Tabs
  tabs={[{ id: 'all', label: 'All' }, { id: 'open', label: 'Open', badge: 3 }]}
  active={tab}
  onChange={setTab}
/>
```
- Active: `border-b-signal text-ink`. Inactive: `text-muted`
- Tab item can have `badge` (count chip) or `dot` (danger pulse when inactive)

### SegmentedControl — raised toggle
```jsx
<SegmentedControl
  options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]}
  value={range}
  onChange={setRange}
/>
```
- Active segment: `bg-stone4 text-ink` on a `bg-stone3` tray

### SlidePanel — right-edge slide-over
```jsx
<SlidePanel
  title="Lot TS-8811"
  subtitle="COA Hold"
  accentColor="var(--color-danger)"
  onClose={() => setOpen(false)}
  footer={<Btn onClick={...}>Release</Btn>}
>
  {/* panel body */}
</SlidePanel>
```
- Default maxWidth: 400px (override with `maxWidth` prop)
- Background: `stone2` with `stone3` header
- Has focus trap, Escape key, spring slide-in/out animation
- **The component has no `open` prop. Callers must conditionally mount it:**
  ```jsx
  {open && <SlidePanel ... />}
  ```

### VaulDrawer — bottom sheet
```jsx
<VaulDrawer open={open} onClose={handleClose} title="Filter" badge={<StatusPill>3</StatusPill>}>
  {/* drawer content */}
</VaulDrawer>
```
- Slides up from bottom, backdrop, focus-trapped
- `maxHeight` (default 82vh), `maxWidth` (default 520px)

### Modal — critical one-time flow
```jsx
<Modal onClose={handleClose} title="Safety briefing">
  {/* modal content */}
</Modal>
```
- `z-modal` (60), focus-trapped, `bg-stone3 border border-rule`
- Top border: `2px solid var(--color-danger)` always
- Omit `onClose` for mandatory flows (no escape / backdrop dismiss)

### AnimatedScore — counting entrance animation
```jsx
<AnimatedScore value={54} effect="glow" hero />
<AnimatedScore value={92} suffix="%" />
```
- `effect`: `none` | `glow` (hero scores) | `blur` (AI-derived values)
- `hero`: 650ms spring (for SceneHeader metrics), default 300ms

### PageEntrance — staggered section reveal
```jsx
<PageEntrance index={0} type="rise" stagger={45}>
  {/* content */}
</PageEntrance>
```
- `type`: `rise | blur | wipe | fade`
- `stagger × index` = animationDelay — creates natural cascade effect

### Dot — GitHub-style intensity square
```jsx
<Dot level="d4" />   {/* solid danger */}
<Dot level="w2" />   {/* 50% warn */}
<Dot level="ok" />   {/* resolved green */}
<Dot level="empty" />{/* faint placeholder */}
```
- `d1–d4`: danger at 25 / 50 / 75 / 100% opacity
- `w1–w4`: warn at 25 / 50 / 75 / 100% opacity
- Shape: `w-2 h-2 rounded-sm`

### ConsequenceNotice — post-action confirmation
```jsx
<ConsequenceNotice show={acted}>
  CAPA-2604-006 closed — export unblocked.
</ConsequenceNotice>
```
- Slide-in animation when `show` becomes `true`
- `bg-ok/10 text-ok border-t border-ok/20`

### EmptyState — empty panel placeholder
```jsx
<EmptyState icon={Package} message="No open orders" sub="All lots are on schedule." />
```
- Ghost row skeleton (faint) behind the centered message
- `message`: `font-body text-muted text-body`

### PersonAvatar
```jsx
<PersonAvatar name="J. Crocker" size={28} />
```
- BoringAvatar with the platform palette

---

## 8. Interaction Patterns

### Evidence gate
Buttons that depend on blocking items must render `disabled` (`opacity-40 cursor-not-allowed`).
Clicking a disabled button flashes danger briefly. Never allow false success.

### Consequence visibility
Every consequential action must surface what changed. Use `ConsequenceNotice` or
build visible state change directly into the card. The metric that updated + what it
means for the plant must be visible. Never complete an action silently.

### SlidePanel (case detail)
Clicking a case/finding title opens a right-edge slide panel (not a modal).
Width: 400px default. Slide-in from right via `.slide-right` animation.
Closes: backdrop click, Escape key, or X button.

### Hold to confirm
Irreversible high-stakes actions (lot release, agent override) use `HoldButton`.
1500ms default. Never use a normal `Btn` for destructive confirmation.

### Data Readiness score reactivity
Resolving a naming conflict or context gap:
1. Updates `readinessScore` in AppState
2. Increments `AnimatedScore` via spring transition
3. Shows `ConsequenceNotice` with new score value

### Role view
Switching roles via the user dropdown re-routes to the appropriate start screen
and scopes the nav to that role's access level.

### Plant switching
Selecting a different plant updates `currentPlant` in AppState, sets `workerMode`
automatically, and re-reads compliance state. Sector-conditional nav items
(Equipment, Value Chain) respond to the new sector.

---

## 9. State Architecture

All shared interactive state lives in `src/context/AppState.jsx`.

Key state slices:
```
viewingRole            — 'director' | 'supervisor' | 'operator-reyes' | 'operator-okonkwo'
currentPlant           — PLANTS.sl | .ks | .co | .se | .de
workerMode             — 'human' | 'robot' | 'hybrid'
sidebarCollapsed       — boolean
shiftActed             — { [findingId]: boolean }
blockingEvidenceUploaded — boolean
allergenOverride       — null | { reason, by, at }
checklistSigned        — { [checklistId]: boolean }
closedCases            — string[]
readinessScore         — number
escalationStates       — { [findingId]: { state, owner, chain[] } }
agentActions           — action log entries
agentDecidedKeys       — Set<string>
commandAcknowledged    — Set<string>
activityLog            — entries[]
```

Screens import `useAppState()` — never manage these locally.

---

## 10. Data Layer

Static data lives in `src/data/index.js`. Each screen imports its own slice.
Key exports:
```js
import { shiftData, line6Data, wichitaData, denverData, facility } from '../data'
import { handoffData }                      from '../data'
import { supplierData }                     from '../data'
import { capaData }                         from '../data'
import { readinessData, systemConfidenceScore } from '../data'
import { commandData, agentConfigData }     from '../data'
import { interventionSummary, interventions } from '../data/interventions'
import { deliverySummary, orders, demandForecast } from '../data/delivery'
```

To swap in real data: replace the named export with an API call. Component
interfaces do not need to change.

---

## 11. What Never To Do

- **No light surfaces.** `bg-white`, `bg-gray-*`, `bg-slate-*`, Tailwind built-in
  `bg-stone-*` are wrong. Use the custom tokens (`bg-stone`, `bg-stone2`, etc.).
- **No border-radius beyond `rounded-btn` (2px, buttons) and `rounded-full`
  (avatars, status dots).** No `rounded`, `rounded-md`, `rounded-lg` on panels,
  cards, or chips.
- **No decorative gradients.** The SceneHeader stone-2 → stone gradient is
  structural. Atmospheric glow radials in `.atmo-glow-*` are managed via
  CSS classes — do not replicate inline.
- **No drop shadows on layout elements.** `shadow-raise` is for floating overlays
  and active primary buttons only. `shadow-card` for lifted cards.
- **No tooltip-only urgency.** If something is wrong, it must be visible without
  hovering.
- **Never allow a consequential action to complete silently.** Every action needs
  a `ConsequenceNotice` or a clear visible state change.
- **Never use hardcoded hex colors.** Use `var(--color-*)` CSS variables or
  Tailwind token classes. For SVG `stroke`/`fill`, use `var(--color-*)` directly
  (works in HTML context). For opacity modifiers on non-standard values use
  Tailwind's slash syntax: `bg-danger/[0.04]`.
- **Never use `ochre`** — that token name is obsolete. The primary accent is
  `signal` (steel blue). Use `bg-signal`, `text-signal`, `border-signal`.
- **Never use `text-subhead`, `text-page`, or `text-display`.** These aliases
  have been removed. Use `text-head`, `text-metric`, `text-score` respectively.
- **Do not build `ActionBanner + StatBar` stacks as the primary screen hero.**
  Use `SceneHeader` (it contains both).
- **SlidePanel has no `open` prop.** Conditionally mount it:
  `{open && <SlidePanel ... />}`. Do not pass an `open` prop.
- **Do not define a local `function SectionHeader` inside a screen file.**
  It will shadow the shared import. Use a distinct name (e.g. `PolicySectionHeader`).

---

## 12. CSS Variables & Utility Classes

### Motion tokens (`src/index.css :root`)
```css
--dur-instant:   50ms
--dur-fast:     100ms
--dur-quick:    200ms
--dur-standard: 300ms
--dur-data:     500ms
--dur-live:    6000ms
--dur-atmo:    9000ms   /* atmospheric — slow, background only */

--ease-linear:   cubic-bezier(0, 0, 1, 1)
--ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1)
--ease-enter:    cubic-bezier(0.19, 0.91, 0.38, 1)
--ease-exit:     cubic-bezier(0.42, 0, 1, 1)
--ease-inout:    cubic-bezier(0.42, 0, 0.58, 1)
--ease-spring:   cubic-bezier(0.16, 1, 0.3, 1)
```

These are also available as Tailwind `transitionTimingFunction` tokens:
`ease-enter`, `ease-exit`, `ease-spring`, `ease-inout`, `ease-standard`.

### Animation utility classes
```css
.display-num        — JetBrains Mono, weight 500, tight tracking, tabular-nums
                       Apply to all numeric displays

.live-dot           — breathing pulse (2.4s) — live data indicator
.beat               — breathing pulse (2.4s) — nav badge pulse

.atmo-glow-danger   — ambient danger radial, slow pulse (9s)
.atmo-glow-warn     — ambient warn radial, slow pulse
.atmo-glow-ok       — ambient ok radial, slow pulse

.slide-in           — fadeIn + translateY(-4px → 0), 0.22s spring
.slide-right        — fadeIn + translateX(16px → 0), 0.28s spring (SlidePanel enter)
.slide-right-out    — translateX(0 → 20px), 200ms exit

.modal-enter        — scaleIn + translateY(6px → 0), 200ms spring
.modal-exit         — scaleOut + translateY(0 → 6px), 150ms exit

.plant-drop-in      — sidebar dropdown entrance, spring with overshoot
.content-reveal     — page-level screen entrance (defined in index.css)
.row-in             — list row staggered entrance
.bar-grow           — bar fill animation
.waveform-reveal    — sparkline scale-from-bottom reveal
.flash-success      — brief ok tint flash on action success
.undo-countdown     — 6s linear width sweep (undo timer bar)
```

### Surface class aliases (Tailwind hyphen bridge)
Tailwind config keys like `stone: { 2: ... }` generate `bg-stone-2` (hyphenated),
but the codebase uses the no-hyphen form everywhere. `index.css` provides:
```css
.bg-stone2   .bg-stone3   .bg-stone4
.bg-sidebar2 .bg-sidebar3
.text-ink2
.border-rule2
```
Always use the no-hyphen form. Never write `bg-stone-2`.

---

## 13. File Structure

```
src/
  App.jsx                     — routes + layout shell, no logic
  main.jsx                    — ReactDOM.createRoot
  index.css                   — Tailwind imports + all custom utilities
  context/
    AppState.jsx              — all shared interactive state
  components/
    Sidebar.jsx               — persistent left nav (240px expanded / 48px collapsed)
    UI.jsx                    — all shared primitives (see §7)
    TrustStrip.jsx            — persistent system confidence bar
    StatBar.jsx               — horizontal stat strip (StatCell grid)
    ShiftHero.jsx             — ShiftIQ hero section component
    PatternMatrix.jsx         — GitHub-style CAPA pattern matrix
    BenchmarkBlock.jsx        — benchmark comparison block
    AgentTimeline.jsx         — agent action log timeline
    ErrorBoundary.jsx         — screen-level error recovery
  screens/
    PlantOverview.jsx         — /overview  (default landing)
    ShiftIQ.jsx               — /shift  (tabs: Shift, Handoff, Fleet, Allocation)
    ShiftIQV2.jsx             — alternate ShiftIQ view (shift board + scorecards)
    HandoffIQ.jsx             — shift handoff screen (rendered as tab within /shift)
    RobotFleet.jsx            — robot fleet management (rendered as tab within /shift)
    ResourceAllocation.jsx    — workforce allocation (rendered as tab within /shift)
    SupplierIQ.jsx            — /supplier
    CapaEngine.jsx            — /capa
    DataReadiness.jsx         — /readiness
    OperatorView.jsx          — /operator
    Analytics.jsx             — /analytics
    AgentControl.jsx          — /agents
    NotificationCenter.jsx    — /notifications (also used as inline overlay)
    BatchIntelligence.jsx     — /batch
    CompliancePolicy.jsx      — /compliance
    ProcessHierarchy.jsx      — /hierarchy
    KnowledgeVault.jsx        — /knowledge
    ExecutionAuthority.jsx    — /execution
    RecordVault.jsx           — /records
    ValueChain.jsx            — /delivery
    EquipmentIntelligence.jsx — /equipment
    IntegrationHub.jsx        — /integration
    ImpactLoop.jsx            — /outcomes
    Briefing.jsx              — dead (legacy, route redirects to /overview)
    NetworkView.jsx           — dead (legacy, route redirects to /supplier)
  data/
    index.js                  — all static demo data
    delivery.js               — ValueChain / supply chain data
    interventions.js          — intervention log data
  lib/
    tokens.js                 — raw color/token values for SVGs and inline styles
    utils.js                  — riskColorClass, riskLabel, useFocusTrap, etc.
    styles.js                 — toneStyle() utility
tailwind.config.js            — token definitions
design.md                     — this file
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
