# Takorin Interface Design System

## Who, What, Feel

**Who:** Plant quality managers and operations directors at food manufacturing facilities — Salina KS, Houston TX, Wichita KS. They're legally accountable. The decisions they make here get filed with the FDA. They open this at 5:50am before line-start or at 11pm during a recall.

**What:** Catch bad lots before production. Issue holds inside FSMA's 24-hour compliance window. Hand off shift risk without gaps. Trust the AI's recommendations only when data is clean.

**Feel:** A quality inspection form that came to life. Typewriter-precise data on warm parchment. The gravity of compliance without the coldness of a terminal. Something a careful person built, not generated.

---

## Direction

**Monospace type on warm paper.** IBM Plex Mono carries ALL body text — numbers, labels, metadata, UI copy. Display numbers use Georgia serif at large sizes. This is the quality-control-form aesthetic made digital. Accountable, anti-decorative, unmistakably specific.

The palette came from the physical world of food manufacturing: unbleached flour (stone), dried wheat stalks (ochre), lab marking ink (ink), quality-pass green (ok), safety-stop red (danger), amber compliance alert (warn). Token names reinforce the world — stone, ink, ochre, ghost, rule — they read like a printing shop, not a startup.

Zero border radius everywhere. Sharp edges signal precision and accountability. Rounded corners would feel like a consumer app.

---

## Tokens

### Color — Surfaces
```
stone    #F5F0E8  — base canvas, unbleached flour / parchment inspection sheets
stone2   #EDE7DC  — elevated surface, sidebars, secondary panels
stone3   #E0D9CC  — tertiary surface, stat bars, section backgrounds
stone4   #D4CEC4  — quaternary, borders on hover
```

### Color — Text Hierarchy
```
ink      #100F0D  — primary text, lab marking ink, near-black
ink2     #2A2520  — secondary text, body copy
muted    #5E5650  — tertiary, labels, captions (WCAG AA on stone)
ghost    #696258  — metadata, subtext, disabled-adjacent
```

### Color — Borders
```
rule     #C8C0B4  — strong separation, section headers
rule2    #D8D2C8  — standard border — primary structural line
```

### Color — Semantic
```
ok       #3A8A5A  — quality pass, clear status, resolved
warn     #C4920A  — amber alert, expiring, degraded
danger   #D94F2A  — safety stop, blocking, recall risk
int      #3A7FD4  — informational, non-critical links
ochre    #C17D2A  — brand accent, focus rings, highlights
```

### Color — Sidebar (dark surface)
```
sidebar         #1A1610  — dark base
sidebar-2       #221E18  — elevated dark surface
sidebar-3       #2A2420  — tertiary dark
sidebar-border  #3A342E  — dark borders
sidebar-ghost   #A8A098  — dark muted text
```

### Typography
```
font-display: Georgia, serif
  — Large numbers (display-num), major headings
  — Weight 800, letter-spacing -0.02em, line-height 1

font-body: IBM Plex Mono, ui-monospace, monospace
  — Everything else: labels, body, metadata, buttons, values
  — The typewriter precision is non-negotiable

Size scale:
  text-[10px]  — micro labels, metadata, chips, uppercase tracking
  text-[11px]  — standard body, secondary values
  text-[12px]  — section headings, primary labels
  text-[13px]  — component titles, prominent labels
  text-base    — panel headers
  text-xl/2xl  — display numbers (paired with display-num class)

display-num class: Georgia, weight 800, letter-spacing -0.02em — always use for large numeric values
```

### Spacing
Base unit: 4px
```
xs   4px   — icon gaps, tight spacing within chips
sm   8px   — padding in dense rows, gap within components
md  12px   — standard component padding
lg  16px   — section padding (p-4)
xl  24px   — major section separation
```

### Depth Strategy
**Borders-only.** No decorative shadows. The flatness reads like a printed form — intentional, not lazy.

- `border border-rule2` — standard component boundary
- `border-b border-rule2` — row separation
- `border-l-2 border-l-{tone}` — left-accent severity indicator (danger/warn/ok)
- Shadow only on floating overlays: `0 12px 30px rgba(16,15,13,0.12)`

Never mix borders with shadows on the same level. Shadows are reserved for modals, drawers, and floating elements.

### Border Radius
**Zero everywhere** except:
- Modals/drawers: system default (user agent)
- Avatar: `rounded-full` (BoringAvatar)
- Scrollbar thumb: 0

Sharp edges signal precision and accountability. Do not round cards, buttons, inputs, chips, or badges.

---

## Component Patterns

### Btn (Button)
Two variants: `primary` (ink bg, stone text) and `secondary` (stone2 bg, border-rule2, muted text).
Always includes a directional icon (ArrowRight for primary, ChevronRight for secondary) unless overridden.
Min-height 36px. Text size 11px. Active state scale(0.97).

```jsx
<Btn variant="primary" onClick={fn}>Label</Btn>
<Btn variant="secondary" onClick={fn}>Label</Btn>
```

### StatCell
Top stats bar component. Label (10px muted, uppercase) + large display number + optional sub text + optional fill bar.
Use for key metrics at page top. Always in a grid row with `border-r border-rule2 last:border-r-0`.

### ActionBanner
Full-width notification strip. Tone drives border-bottom and bg tint: `danger`, `warn`, `ok`, `muted`.
Used at TOP of page (SupplierIQ, DataReadiness pattern). Body text in 11px muted. Children render as right-side actions.

```jsx
<ActionBanner tone="warn" headline="..." body="...">
  <Btn variant="secondary">Action</Btn>
</ActionBanner>
```

### ActionCard
Primary content card. Left border accent (2px, toned). Title 13px font-medium, subtitle 11px ghost.
Metadata row: array of strings or elements rendered as `·`-separated chips.
Status slot (top-right), actions slot (bottom).

### ExpandableMetadata
Accordion disclosure. Header is a button with ChevronRight that rotates 90° when open.
`tone` sets bg: danger/warn/ok/muted. Default closed unless `defaultOpen={true}`.
Use for progressive disclosure of simulation data, specs, or supplementary context.

### SP (Side Panel Section)
Right rail section container. Title + optional sub in header row. Children render below.
Use for structured right-rail content groups.

### RightRail
Standardized right rail container: `w-80` (320px), border-l, bg-stone2.
Use via `<RightRail>` in DataReadiness and via `Layout`'s side prop in other screens.
Never set the right rail width directly — always use this component.

### Layout
Two-column flex wrapper. `flex-1` main + `<RightRail>` side. Hidden on small screens (lg:block).
Pass content as children and side rail as `side` prop.

### MetadataRow
Icon + label + value row. Tone-tinted background at low opacity.
Use inside ExpandableMetadata or stacked for structured data presentation.

### Chip / Urg
Inline status badges. `Chip` for data status (ok/warn/danger/muted/int), `Urg` for urgency levels.
Both: 10px font-body, small dot prefix, toned bg at low opacity.

### PersonAvatar
BoringAvatar with Takorin palette. Sizes: 26-40px. Always paired with name text.

---

## Severity System

Left-border accent is the primary severity signal on cards and rows:
```
border-l-2 border-l-danger  — blocking, recall risk, critical
border-l-2 border-l-warn    — at-risk, expiring, degraded
border-l-2 border-l-ok      — resolved, clear, passing
border-l-2 border-l-muted   — neutral, informational
```

Background tints reinforce at lowest opacity: `bg-danger/[0.03]`, `bg-warn/[0.02]`.
Semantic text colors (`text-danger`, `text-warn`, `text-ok`) used on values and labels.

---

## Animation Principles

- Micro-interactions: 100ms (`--dur-fast`), `ease-standard`
- Entrances: 200-300ms, `ease-spring` (`cubic-bezier(0.16,1,0.3,1)`)
- Data fills (score bars, progress): 500ms, `ease-enter`
- Panels/drawers: slide from right, 280ms spring
- No bounce or spring in semantic state changes — spring is for spatial movement only
- Reduced-motion: fade only, no transforms

---

## Layout Conventions

- **Top stats strip:** `border-b border-rule2 bg-stone3/60 px-4 py-4` — readiness/status metrics grid
- **ActionBanner:** immediately below top stats or at very top if action required
- **Main area:** `flex flex-1 overflow-hidden` — scroll container within
- **Content padding:** `p-4` standard, `p-4 pb-32` only when sticky bottom bar present
- **Section titles:** `font-body font-medium text-ink text-[13px] mb-4`
- **Right rail padding:** `p-4` inner wrapper

---

## What Not To Do

- No Inter, Geist, or DM Sans — IBM Plex Mono is non-negotiable
- No border-radius on cards, buttons, chips, or rows
- No colored surfaces (don't change hue, only lighten/darken stone)
- No decorative shadows on layout elements
- No rounded scrollbars
- No blue as an accent — ochre is the accent
- No gradient fills
- No hero illustrations or decorative graphics
- Do not mix font-display and font-body at the same size — display is for numbers only
