# Takorin Interface Design System

## Who, What, Feel

**Who:** Plant directors, quality managers, and shift supervisors at food manufacturing facilities — Salina KS, Houston TX, Wichita KS. They are legally accountable. The decisions they make here get filed with the FDA. They open this at 5:50am before line-start or at 11pm during a recall.

**What:** Know in seconds whether the shift is safe to start. Catch bad lots before production. Issue AI-recommended holds inside FSMA's 24-hour compliance window. Hand off shift risk without gaps. Review AI decisions and hold the system accountable.

**Feel:** A control room instrument panel from the year after the one you know. Warm graphite surfaces — not the cold blue-black of a terminal, not the clinical white of a SaaS product. The warmth signals that a person made this for another person, not a machine for a metric. Dense but not cluttered. Confident but not brash. The data leads; decoration doesn't exist.

---

## Direction

**Warm instrumentation.** Dark graphite surfaces with warm bone type. Numbers in JetBrains Mono — every digit the same width, reading like a measurement. Narrative in Bricolage Grotesque — structured, purposeful, slightly editorial. Body copy in Plus Jakarta Sans — clean without being cold.

The color palette came from the manufacturing world: warm graphite stone, bone ink, steel blue signal for interactive elements, amber warn, rust danger, green ok. Token names describe function, not aesthetics — stone, ink, muted, rule, signal, ok, warn, danger.

Border radius is 2px on interactive controls only — tight enough to read as precision instrumentation, not consumer software. Layout elements have zero radius.

Dark mode is the canonical experience. Light mode uses near-white parchment surfaces and remains warm. The sidebar is always dark regardless of theme.

---

## Tokens

### Color System

All colors are CSS-variable based and support dark/light/auto theme switching. Both dark and light modes are first-class — never assume either.

#### Dark mode defaults (CSS variables)
```
--color-stone-rgb:    11  15  24   → #0B0F18 — base surface, dark graphite
--color-stone-2-rgb:  19  26  38   → #131A26 — elevated surface, panels
--color-stone-3-rgb:  27  37  56   → #1B2538 — tertiary, section backgrounds
--color-stone-4-rgb:  38  48  66   → #263042 — quaternary, structural borders
--color-ink-rgb:     237 228 203   → #EDE4CB — primary text, warm bone
--color-ink-2-rgb:   155 144 112   → #9B9070 — secondary text
--color-muted-rgb:   122 142 168   → #7A8EA8 — tertiary, labels, metadata
--color-rule-rgb:     38  48  66   → same as stone-4 — strong borders
--color-rule2-rgb:    26  35  53   → #1A2335 — standard structural border
--color-ok-rgb:       95 168 119   → #5FA877 — pass, resolved, clear
--color-warn-rgb:    201 142  42   → #C98E2A — alert, at-risk, expiring
--color-danger-rgb:  222 108  78   → #DE6C4E — blocking, recall risk, critical
--color-signal-rgb:   75 156 228   → #4B9CE4 — interactive, structural (primary accent)
--color-context-rgb: 196 132  78   → #C4844E — narrative accent, interpretation
--color-deep-rgb:    124 134 232   → #7C86E8 — AI/predictive, historical data
```

#### Light mode (data-theme="light")
```
--color-stone-rgb:   252 251 249   → #FCFBF9 — near-white warm base
--color-stone-2-rgb: 245 243 238   → #F5F3EE — off-white elevated
--color-stone-3-rgb: 234 231 224   → #EAE7E0 — light warm gray
--color-stone-4-rgb: 218 214 205   → #DAD6CD — medium warm gray
--color-ink-rgb:      22  16   8   → #160F08 — near-black warm
--color-ink-2-rgb:    72  64  50   → #484032 — secondary
--color-muted-rgb:   120 112  98   → #787062 — warm muted
--color-rule-rgb:    206 200 188   → #CEC8BC — structural border
--color-rule2-rgb:   228 225 218   → #E4E1DA — subtle border
--color-ok-rgb:       30 100  56   → #1E6438 — deeper green
--color-warn-rgb:    140  92  10   → #8C5C0A — deeper amber
--color-danger-rgb:  168  44  28   → #A82C1C — deeper rust
--color-signal-rgb:   32  88 168   → #2058A8 — deeper blue
```

#### Sidebar (always dark, both themes)
```
--color-sidebar-rgb:         8  13  22   → #080D16
--color-sidebar-2-rgb:      14  21  32   → #0E1520
--color-sidebar-3-rgb:      21  32  48   → #152030
--color-sidebar-border-rgb: 28  42  64   → #1C2A40
--color-sidebar-ghost-rgb: 106 136 168   → #6A88A8
```

#### Semantic dim (low-opacity tints for card backgrounds)
```
ok.dim, warn.dim, danger.dim, signal.dim — low-opacity surface tints
Use at 0.02–0.08 opacity for background tinting only
```

#### Semantic token layer (preferred for new code)

A non-breaking alias layer maps semantic intent to the same CSS variables. Both sets are valid; use semantic names in new code.

```
Surface:
  bg-surface          → bg-stone      (base canvas)
  bg-surface-raised   → bg-stone2     (elevated panels, headers)
  bg-surface-tint     → bg-stone3     (section backgrounds, hover targets)
  bg-surface-inset    → bg-stone4     (inset / recessed areas)

Text:
  text-on-surface          → text-ink    (primary content)
  text-on-surface-dim      → text-ink2   (secondary text)
  text-on-surface-subtle   → text-muted  (labels, metadata)

Borders:
  border-border-strong   → border-rule    (hard separation)
  border-border-soft     → border-rule2   (standard border)

Interactive:
  bg-interactive / text-interactive   → bg-signal / text-signal

Status (already semantic — no alias needed):
  text-ok / bg-ok / text-warn / bg-warn / text-danger / bg-danger

CSS inline style variables (same aliasing, for style={{ color: ... }} usage):
  var(--surface)           var(--surface-raised)   var(--surface-tint)
  var(--on-surface)        var(--on-surface-dim)    var(--on-surface-subtle)
  var(--border-strong)     var(--border-soft)       var(--interactive)
  var(--status-ok)         var(--status-warn)       var(--status-danger)
```

#### Palette token names (existing code — do not rename)
```
bg-stone / bg-stone2 / bg-stone3 / bg-stone4
text-ink / text-ink2 / text-muted
border-rule / border-rule2
text-ok / text-warn / text-danger / text-signal / text-context / text-deep
bg-ok/[0.x] / bg-warn/[0.x] / bg-danger/[0.x] — opacity variants
bg-sidebar / bg-sidebar2 / bg-sidebar3
```

#### How theme switching works

All tokens — both palette and semantic — reference CSS variables (`rgb(var(--color-stone-rgb) / <alpha>)`) that change value based on the `[data-theme]` attribute on `<html>`. The Tailwind build generates classes that reference these variables. No class name changes are needed to switch themes — only the CSS variables change.

```
data-theme="dark"  → dark graphite values (default)
data-theme="light" → near-white parchment values
no attribute       → follows prefers-color-scheme media query (auto)
```

The sidebar tokens are the only exception — they never change with theme (sidebar is always dark).

---

### Typography

Three font families, strict role separation:

```
font-body:    'Plus Jakarta Sans', system-ui, sans-serif
  — Labels, body copy, UI text, metadata, button text, chips
  — The workhorse. Used for all non-heading, non-numeric text.

font-display: 'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif
  — Screen-level headings, SceneHeader statements, ActionBanner headlines
  — Card titles when semantic weight matters
  — NOT for body paragraphs at same size as font-body

font-mono: 'JetBrains Mono', 'Menlo', monospace
  — Via the display-num utility class ONLY
  — All numeric data values: scores, counts, measurements, percentages
  — Tabular nums, weight 500, letter-spacing -0.01em
```

**Type scale** (Tailwind custom sizes):
```
text-nano    11px  lh 1.35 — metadata, timestamps, chip text (floor — never smaller)
text-label   12px  lh 1.35 — secondary labels, badge text, table headers
text-body    14px  lh 1.5  — primary reading text, card content, list items
text-sub     16px  lh 1.4  — section subheadings, narrative statements, prominent labels
text-head    20px  lh 1.25 — panel headers, screen section headings
text-title   24px  lh 1.15 — callout numbers, stat values
text-metric  32px  lh 1    — KPI grid cells
text-score   52px  lh 1    — hero scores — top of scale; no larger needed
```

Removed: `text-micro` (10px) — imperceptible from label at viewing distance, too small under stress.
`text-base` (15px) — no-man's-land between body and sub; removed.
`text-hero` (64px) and `text-jumbo` (80px) — `text-score` (52px) suffices; larger type solves layout problems not hierarchy problems.

**display-num utility class** — use on all large numeric values:
```css
font-family: JetBrains Mono, monospace;
font-weight: 500;
letter-spacing: -0.01em;
font-variant-numeric: tabular-nums;
```

---

### Spacing

Base unit: 4px. Tailwind default scale applies.
Common values: `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px).
Padding conventions: `px-4 py-2.5` for scope bars, `px-5 py-3` for section rows, `px-6 py-5` for SceneHeader content.

---

### Depth Strategy

Two tiers:

**Layout elements** — borders only:
```
border border-rule2     — standard component boundary
border-b border-rule2   — row separation
border-r border-rule2   — panel separation
border-l-[3px] border-l-{tone}  — severity accent (danger/warn/ok/signal)
```

**Floating elements** — shadows allowed:
```
shadow-raise  — modals, drawers, SlidePanel, dropdown overlays
shadow-card   — subtle lift for cards in specific contexts
```

Never use shadows on layout panels, stat grids, section headers, or list rows.

---

### Border Radius

- `rounded-btn` (2px) — interactive controls: Btn, FilterDropdown buttons, chip buttons
- `rounded-full` — PersonAvatar only
- Everything else: **zero radius**. Cards, panels, rows, inputs, chips, badges — all sharp.

---

## Component Patterns

### Btn
Three variants. Always uses `font-body font-medium text-body` (13px). Min-height 40px. Active state `scale(0.97)`. Radius: `rounded-btn` (2px).

```jsx
// Primary — signal bg, white text, hover shadow-raise
<Btn variant="primary" onClick={fn}>Label</Btn>
<Btn variant="primary" icon={ArrowRight} onClick={fn}>Label</Btn>

// Secondary — stone2 bg, border-rule, ink text, hover stone3
<Btn variant="secondary" onClick={fn}>Label</Btn>

// Ghost — no border/bg, muted text, hover ink
<Btn variant="ghost" onClick={fn}>Label</Btn>
```

### StatusPill
Inline toned badge. `text-label` (11px), `font-body`. Small dot + text. Uses `toneStyle()` for bg/text.
Tones: `ok` `warn` `danger` `signal` `muted` `alert`

```jsx
<StatusPill tone="danger">Blocked</StatusPill>
<StatusPill tone="ok">Active</StatusPill>
```

### SceneHeader
The canonical screen hero. Appears at the top of every content screen. Required fields: `metric`, `metricLabel`, `tone`, `statement`. Optional: `module`, `context`, `meta`, `sparkline`, `children` (footer signal strip).

- `metric` — always a score/rate/percentage. Raw counts go in `meta`, not `metric`.
- `tone` — drives atmospheric glow color (`ok`/`warn`/`danger`/`muted`)
- `statement` — mandatory narrative sentence. Human voice. Not a label.
- `meta` — array of `{label, value, color}` for secondary stats strip
- `sparkline` — optional `{points, label, color}` for trend line in header
- `children` — renders as signal health strip below statement

```jsx
<SceneHeader
  module="Equipment"
  context="Line 4 · Active monitoring"
  metric={71}
  metricLabel="equipment health"
  tone="warn"
  statement="Sensor A-7 at threshold. 2 assets nearing maintenance window."
  meta={[
    { label: 'SPC warnings', value: '2' },
    { label: 'In maintenance', value: '1' },
  ]}
/>
```

### FilterDropdown / MultiFilterDropdown
Scope bar filter controls. Used in horizontal `flex items-center gap-2 px-5 py-2.5 border-b border-rule2 bg-stone flex-shrink-0` scope bar row.

- `FilterDropdown` — single select. Active state: `bg-ink text-stone`.
- `MultiFilterDropdown` — multi-select with checkboxes. Active: badge count in label.

### SlidePanel
Right-side detail panel. Slides in from right, backdrop overlay. Max-width configurable (default 400px).
Use for job-3 detail retrieval — audit records, decision history, connector specs.

```jsx
<SlidePanel title="..." subtitle="..." accentColor="var(--color-danger)" onClose={fn}>
  {content}
</SlidePanel>
```

### VaulDrawer
Bottom sheet overlay. Use for contextual actions that don't require full context switch — notifications, quick reference.

### HoldButton
Hold-to-confirm control. Required for consequential irreversible actions (creating maintenance tickets, resolving data issues).
```jsx
<HoldButton
  label="Hold to request PM"
  holdLabel="Keep holding to confirm…"
  doneLabel="PM ticket created"
  duration={1500}
  tone="warn"
  onConfirm={fn}
/>
```

### StatGrid / StatCell
Horizontal metrics bar. Always in a `grid` row with `border-r border-rule2 last:border-r-0`. Each cell shows label (muted micro) + value (display-num) + optional fill bar.

### SectionHeader
Divider row within a panel. `bg-stone2 border-b border-rule2`. Contains label `StatusPill` or plain text + optional badge.

### ActionBanner
Full-width notification strip. Tone drives border-bottom and bg tint. Always `flex-shrink-0`. Appears at the top of content area (below SceneHeader) when action is required.

### AnimatedScore
Animated number reveal. Used inside `display-num` spans.
```jsx
<AnimatedScore value={score} effect="glow" hero />
```

---

## Severity System

Left-border accent is the primary severity signal on cards and rows:
```
border-l-[3px] border-l-danger  — blocking, recall risk, critical
border-l-[3px] border-l-warn    — at-risk, expiring, degraded
border-l-[3px] border-l-ok      — resolved, clear, passing
border-l-[3px] border-l-signal  — informational, AI-related
border-l-[3px] border-l-rule2   — neutral
```

Background tints reinforce severity at lowest opacity: `bg-danger/[0.03]`, `bg-warn/[0.02]`, `bg-ok/[0.04]`.

---

## Theme System

Three modes, driven by `data-theme` attribute on `<html>`:
- **Dark** (default): `data-theme="dark"` — graphite surfaces, bone text
- **Light**: `data-theme="light"` — near-white surfaces, warm ink
- **Auto**: no attribute — follows `prefers-color-scheme` media query

All color tokens are CSS variables (`--color-stone-rgb`, etc.) that resolve per-theme. The sidebar is always dark regardless of theme. Toggle is in the sidebar bottom: Sun / Monitor / Moon buttons.

---

## Animation Principles

```
--dur-fast:      100ms  — micro-interactions, hover states
--dur-quick:     200ms  — standard transitions
--dur-standard:  300ms  — panel animations
--dur-data:      500ms  — bar/score fills

--ease-enter:   cubic-bezier(0.19, 0.91, 0.38, 1) — fast in, long tail
--ease-exit:    cubic-bezier(0.42, 0, 1, 1)       — slow start, fast out
--ease-spring:  cubic-bezier(0.16, 1, 0.3, 1)     — elastic spatial motion
--ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1) — neutral
```

- Spatial movement (panels sliding, cards expanding): `ease-spring`
- Semantic state changes (score changing tone, status updating): `ease-standard`, no spring
- Data fills (score bars, progress): `ease-enter` at 500ms
- Atmospheric glow: 9s ambient pulse, `opacity: 0.04 → 0.10`
- Reduced-motion: fade only (`opacity` transition), no transforms

### Utility animation classes
```
.slide-in         — translateY(-4px) → 0, 220ms spring
.slide-right      — translateX(16px) → 0, 280ms spring
.content-reveal   — translateY(3px) → 0, 150ms ease-enter
.row-in           — translateY(8px) → 0, 320ms spring (staggered list)
.bar-grow         — scaleX(0) → 1, 550ms spring (score bars)
.metric-in        — translateY(12px) scale(0.88) → 0 1, 440ms spring
.plant-drop-in    — scale(0.94) translateX(-8px) → 1 0, 320ms spring
```

---

## Layout Conventions

### Page structure
```
<div className="flex flex-col h-full overflow-hidden content-reveal">
  <SceneHeader ... />
  {/* Optional: scope bar or distribution strip */}
  <div className="flex-1 overflow-y-auto">
    {/* Content */}
  </div>
</div>
```

### Master-detail
```
<div className="flex flex-1 min-h-0 overflow-hidden">
  <div className="w-[280px] flex-shrink-0 border-r border-rule2 flex flex-col bg-stone">
    {/* List */}
  </div>
  <div className="flex-1 overflow-y-auto">
    {/* Detail or grid */}
  </div>
</div>
```

### Scope bar (filter row)
```jsx
<div className="flex items-center gap-2 px-5 py-2.5 border-b border-rule2 bg-stone flex-shrink-0">
  <FilterDropdown label="Agent" ... />
  <FilterDropdown label="Tier" ... />
  <MultiFilterDropdown label="Priority" ... />
  <span className="font-body text-muted text-label ml-auto">{count} events</span>
</div>
```

### Grid layout (cards)
```jsx
<div className="grid grid-cols-2 gap-px bg-rule2">
  {items.map(c => (
    <div key={c.id} className="bg-stone">
      <Card ... />
    </div>
  ))}
</div>
```
`gap-px bg-rule2` creates 1px dividers between grid cells.

### Sidebar
Always `fixed left-0 inset-y-0 z-30`. Width: 240px expanded, 48px collapsed icon-only.
Always dark (`bg-sidebar`) — never changes with theme.
Mobile: slides in as overlay via `translate-x` when `mobileNavOpen`.

---

## Sentence Case

All UI text is sentence case. Never all-caps except acronyms (FDA, FSMA, OEE, CAPA, CCP, MES, ERP, SPC, SCADA, COA, PM, QA, HACCP, SQF). No `uppercase` Tailwind class on any text element.

---

## What Not To Do

- No decorative border radius on cards, rows, inputs, or chips — only `rounded-btn` (2px) on interactive controls
- No shadows on layout panels, stat grids, or list rows — only on floating overlays (modals, drawers, dropdowns)
- No all-caps text — sentence case everywhere, acronyms excepted
- No Inter, Roboto, or system-ui as primary font — Plus Jakarta Sans is the body font
- No `bg-stone` inline in JSX bypassing CSS variables — always use Tailwind token classes
- Do not render SceneHeader `metric` as a raw count — counts go in `meta`, `metric` is for rates/scores/percentages
- Do not mix `font-display` and `font-body` at the same text size on adjacent elements
- Do not use `shadow-raise` on list rows, stat cells, or panel headers
- The sidebar must always stay dark — never apply light theme tokens to sidebar colors
