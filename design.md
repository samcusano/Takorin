# Takorin Design System
## AI Coding Agent Reference — v1.0 · April 2026

This document is the single source of truth for the Takorin design system.
Read this before writing any UI code. Every decision here is intentional.

---

## 1. What Takorin Is

An operational intelligence platform for food manufacturing. Not a dashboard —
an agent that tells plant directors what to do before it's too late.

**Primary user:** Plant director. Overseeing 2–6 lines simultaneously.
Reading at a desk, sometimes on a tablet. High stakes. Low tolerance for noise.

**Mental model:** A well-maintained technical ledger. Precision instrument faces.
Warm material — stone, brass, ochre — not cold enterprise software.

---

## 2. Layout Structure

### Persistent sidebar (always visible ≥ 960px)
```
width: 240px (w-[240px])
background: #1A1610 (bg-sidebar)
border-right: 1px solid #3A342E (border-sidebar-border)
```

### Main content area
```
margin-left: 240px (ml-[240px])
height: 100vh, overflow: hidden
flex-column layout: banner → stats → content
```

### Content layout pattern (all 5 screens)
```
ActionBanner (accent color bg, full-width, flex-shrink-0)
StatBar (grid-cols-N, border-b, flex-shrink-0)
Layout (flex: main + right side rail 260px)
```

### Right side rail
```
width: 260px (w-[260px])
background: stone2 (#EDE7DC)
border-left: 1px solid rule2 (#D8D2C8)
overflow-y: auto
```

---

## 3. Color Palette

### Brand colors (NEVER substitute)
```
ochre:      #C17D2A  — primary brand accent, CTAs, active states
ochreDim:   #FBF3E6  — ochre backgrounds
ochreDark:  #8A5A18  — depth, pressed states
brass:      #8A6A3A  — warm secondary, SupplierIQ, supplier contexts
brassDim:   #F5EFE4
```

### Ground palette
```
stone:      #F5F0E8  — primary page background
stone2:     #EDE7DC  — section backgrounds, side rails, headers
stone3:     #E0D9CC  — hover states, alternate rows
ink:        #100F0D  — primary text
ink2:       #2A2520  — secondary text, body copy
muted:      #78706A  — labels, metadata
ghost:      #A8A098  — rules, disabled, placeholder text
rule:       #C8C0B4  — dividers between content
rule2:      #D8D2C8  — outer borders, table rules
```

### Semantic colors (product UI only, never brand decoration)
```
ok:         #3A8A5A  — resolved, healthy, confirmed (green)
okDim:      #EBF5EF
warn:       #C4920A  — watch, approaching threshold (amber)
warnDim:    #FEF6E4
danger:     #D94F2A  — critical, overdue, blocked (red-orange)
dangerDim:  #FDECE7
int:        #3A7FD4  — THIRD-PARTY DATA ONLY (blue)
            Blue means: this came from somewhere else.
            NEVER use blue as a brand color.
```

### Module accent colors
```
ShiftIQ:     #D94F2A  (shift red-orange)
HandoffIQ:   #3A8A5A  (forest green)
SupplierIQ:  #8A6A3A  (brass)
CAPA Engine: #C4920A  (deep amber)
Data Ready:  #C17D2A  (ochre — platform level)
```

### Sidebar colors (dark surface)
```
sidebar:        #1A1610
sidebar2:       #221E18
sidebarBorder:  #3A342E
sidebar text:   #A8A098 (ghost) inactive, #F5F0E8 (stone) active
sidebar active: bg-ochre/10, border-l-ochre
```

---

## 4. Typography

**One typeface family throughout: Georgia (serif)**
This is an intentional differentiation. Every B2B SaaS competitor uses
geometric sans-serif (Inter, DM Sans, etc.). Takorin uses Georgia.

### Type scale
```
display-num class:
  font-family: Georgia
  font-weight: 800 (bold)
  font-style: italic
  letter-spacing: -0.02em
  line-height: 1
  Use for: large numbers (scores, counts, OEE), risk scores, case numbers

Headings (font-display font-bold italic):
  text-base (16px)  — action banners
  text-xl (20px)    — page-level display numbers
  text-2xl (24px)   — hero numbers
  text-3xl (30px)   — score rings
  text-4xl (36px)   — countdown numbers

Body (font-body):
  text-[13px] font-medium  — primary content labels
  text-[12px]              — body text
  text-[11px] italic       — descriptions, metadata
  text-[10px] italic       — timestamps, sub-labels
  text-[9px] italic        — legends, fine print

Labels (uppercase, tracked):
  text-[10px] font-medium tracking-widest uppercase text-ghost
  Use for: section category labels, nav section headers

Italic is the default voice for the platform.
Plain non-italic is used for: fonts that need weight (numbers, titles).
```

---

## 5. Spacing and Grid

```
Page padding:     px-4 to px-5 (16–20px)
Section padding:  px-4 py-3 (standard cell)
Compact padding:  px-4 py-2.5 (side rail rows, dense tables)
Section gap:      border-b border-rule2 (1px rules, no margin)
```

**No border-radius anywhere.** Every element is square-edged.
This is a design decision, not an omission. It communicates precision
and differentiates from every competitor.

**1px rules as composition.** Horizontal rules (`border-b border-rule2`)
are the primary layout element. They structure information the way ledger
lines structure a document.

---

## 6. Component Reference

### ActionBanner
```jsx
<div className="flex items-start gap-4 px-5 py-3.5" style={{ background: moduleAccent }}>
  <div className="flex-1">
    <div className="font-display font-bold italic text-stone text-base">{headline}</div>
    <div className="font-body italic text-stone/80 text-[12px] mt-0.5">{body}</div>
  </div>
  <Btn variant="ghost">{action}</Btn>
</div>
```

### StatBar cell
```jsx
<div className="px-4 py-3 border-r border-rule2 last:border-r-0">
  <div className="font-body italic text-muted text-[10px] mb-1">{label}</div>
  <div className="display-num text-xl text-ink">{value}</div>
  <div className="font-body italic text-ghost text-[10px] mt-0.5">{sub}</div>
  <div className="h-px bg-rule2 mt-2">
    <div className="h-full bg-{tone}" style={{ width: fill + '%' }} />
  </div>
</div>
```

### Urgency pill (unified — use this instead of custom status chips)
```jsx
<Urg level="critical|warn|ok|info">{text}</Urg>
// critical → danger color
// warn     → warn color
// ok       → ok color
// info     → muted/ghost
```

### Finding/Case card
```jsx
<div className="border-l-2 border-l-{urgency} border-b border-rule2">
  <div className="grid grid-cols-[28px_1fr]">
    <div className="pt-4 pl-3 display-num text-[13px] text-{urgency}">{num}</div>
    <div className="p-4 pl-2">
      <p className="font-body font-medium text-ink text-[13px]">{title}</p>
      <p className="font-body italic text-ink2 text-[12px]">{desc}</p>
      <p className="font-body italic text-ghost text-[11px]">▸ {evidence}</p>
      {/* actions */}
    </div>
  </div>
</div>
```

### Consequence notice (shows after action — confirms upstream impact)
```jsx
<ConsequenceNotice show={acted}>
  {description of what changed upstream}
</ConsequenceNotice>
// Only shows when show=true
// slide-in animation
// bg-ok/10, text-ok, border-t border-ok/20
```

### Side panel section
```jsx
<SP title="Section title" sub="optional subtitle">
  {/* rows */}
</SP>
// Wraps content with a labeled header and border
```

### GitHub-style dot (CAPA pattern matrix)
```jsx
<Dot level="d4|d3|d2|d1|w4|w3|w2|w1|ok|empty" />
// d1–d4: danger intensity (d4 = solid danger)
// w1–w4: warn intensity
// ok: resolved green
// empty: 20% opacity rule2
// Shape: w-2 h-2 rounded-sm (not circular)
```

### SVG score ring (standard pattern)
```jsx
const circ = 2 * Math.PI * radius
const offset = circ - (score / 100) * circ
<svg>
  <circle cx r fill="none" stroke="#D8D2C8" strokeWidth={weight} />
  <circle cx r fill="none" stroke={color} strokeWidth={weight}
    strokeDasharray={circ} strokeDashoffset={offset}
    transform="rotate(-90 cx cy)" strokeLinecap="butt" />
  <text textAnchor="middle"
    style={{ fontFamily:'Georgia,serif', fontWeight:800, fontStyle:'italic', fill:color }}>
    {score}
  </text>
</svg>
// strokeLinecap: "butt" always (not "round" — looks imprecise)
// transition: stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)
```

---

## 7. Interaction Patterns

### Evidence gate
The export/close button must be disabled (muted style, cursor-not-allowed)
when a blocking item exists. Clicking the disabled button should flash
danger-red briefly to confirm the block is real. Never allow a false success.

### Consequence visibility
Every consequential action must show what changed upstream.
Pattern: action fires → ConsequenceNotice appears below the acting element
showing the metric that updated and when the platform will reflect it.
Never let an action disappear into a vacuum.

### Case detail slide-over
Clicking any case title opens a right-edge panel (not a modal).
Width: min(480px, 95vw). Slide-in animation.
Contains: meta grid, root cause chips, regulatory mapping, evidence,
activity log, action buttons.
Closes: overlay click or X button.

### Data Readiness score reactivity
Resolving a naming conflict or context gap must:
1. Increment the score ring via stroke-dashoffset transition
2. Update the score text
3. Show a ConsequenceNotice with the new score

---

## 8. Routing

React Router v6. Each module is a real URL:
```
/         → redirect to /shift
/shift    → ShiftIQ
/handoff  → HandoffIQ
/supplier → SupplierIQ
/capa     → CAPAEngine
/readiness → DataReadiness
```

---

## 9. Data Layer

All fake data lives in `src/data/index.js`.
Each screen imports only its own named export:
```js
import { shiftData }     from '../data'
import { handoffData }   from '../data'
import { supplierData }  from '../data'
import { capaData }      from '../data'
import { readinessData } from '../data'
```

To add real data: replace the relevant export with an API call.
The component interface does not need to change.

---

## 10. What Never To Do

- **No blue** as a brand color. Blue = third-party/external data only.
- **No border-radius.** Not on buttons, chips, panels, rings. Zero.
- **No gradients** except the benchmark index bar and zone bars (functional, not decorative).
- **No drop shadows** on the mark or wordmark.
- **No tooltip-only urgency.** If something is wrong, it must be visible
  without hovering.
- **Never** allow an action to complete silently. Every action needs
  a consequence notice or a state change.
- **Never** use `rounded-*` Tailwind classes on interactive components.
  `rounded-full` is only used for avatars and indicator dots.

---

## 11. File Structure

```
src/
  App.jsx              — routes only, no logic
  main.jsx             — ReactDOM.createRoot
  index.css            — Tailwind imports + display-num utility
  components/
    Sidebar.jsx        — persistent left nav (240px, dark)
    UI.jsx             — all shared primitives (Urg, StatCell, Btn, etc.)
  screens/
    ShiftIQ.jsx        — /shift
    HandoffIQ.jsx      — /handoff
    SupplierIQ.jsx     — /supplier
    CAPAEngine.jsx     — /capa
    DataReadiness.jsx  — /readiness
  data/
    index.js           — all static fake data
  lib/
    tokens.js          — raw color/token values for SVGs and inline styles
tailwind.config.js     — token definitions (mirrors tokens.js)
design.md              — this file
```

---

## 12. Running the Project

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

Navigate between modules using the left sidebar.
Sidebar stays fixed. Content area scrolls independently.
On screens < 960px the sidebar collapses (add hamburger if needed).
