# Takorin Color System

A color system for an **operational intelligence instrument** — not a consumer
app, not a startup dashboard. Dev-only preview: `/__design_lab`.

> ## ✅ Decision (record of record)
>
> **Foundry is the chosen color system. We are implementing Foundry; Verdant and
> all other explorations are dropped.**
>
> Foundry — warm bone ink + steel‑blue on graphite — wins for the product UI: its
> neutral canvas lets the data and status colors speak, and it already maps 1:1
> to the live `tokens.css`, so adoption is zero‑risk. The exploration that led
> here ran through seven systems (reference brands Daylight/Rainmaker/Tocco and
> originals Halide/Ledger/Plasma/Kiln/Verdant); Verdant was the runner‑up as a
> *brand/marketing* color but tints the product green and collides with
> "green = good," so it is not used.
>
> **Gradients:** flat by default. Gradient appears in exactly three places —
> chart area‑fills, one hero number per screen, and brand/marketing surfaces (see
> §6). Never on data, status, tables, or repeatedly‑read controls.
>
> **Borders & radius:** 1px hairline borders as the primary structure (shadows
> don't read on dark); radius 2 / 6 / 10 (control / card / surface). See §7.
>
> **System states (branded, not generic):** tuned to the warm‑instrument feel
> rather than primary traffic‑light colors — **success = the steel‑blue accent**, gold =
> caution, periwinkle = info. **`danger` is a clean refined red `#EA5455`**
> (resolved: red restored for split‑second danger recognition in a food‑safety
> context; hue ~0° keeps it clearly distinct from the gold warning). Every state
> is still paired with an icon/label/dot, so meaning never rides on hue alone.

---

## 1. Visual personality

The character of the system is **warm instrumentation**:
the gravity and rigor of a cockpit gauge or trading terminal, but with warmth
that keeps it human across a 12‑hour shift. Three traits hold every variant
together:

- **Warm‑neutral foundation.** Backgrounds and surfaces are never pure
  `#FFFFFF` or pure `#000000`. They carry a trace of bone, oat, paper, or
  graphite. This is what separates Takorin from cold enterprise SaaS.
- **One accent, earned.** Each palette has exactly one accent that means
  "interactive / look here." It is never spent on decoration. A second
  `warm` hue carries narrative and secondary data — never a call to action.
- **Branded signal semantics.** System colors *can and should* carry brand
  character — but within hard limits, because they carry meaning and must clear
  contrast. Brand them through **hue temperature, saturation, and harmony with
  the accent**, never by breaking the learned signal. So: **success = the
  steel‑blue accent itself** (on‑brand "good," since blue still reads positive),
  a gold for caution (not fluorescent yellow), info pulled into the accent family
  (a periwinkle — more violet than the steel‑blue success, so the two read apart
  by hue), and a **clean, refined red** for danger — warmed
  to fit the graphite system but unmistakably red. The line is recognition: push
  branding until a state stops reading instantly, and you've gone too far (the
  earlier "no‑red error" experiment was exactly that line — danger must stay red).

The system follows the pairing‑without‑overwhelming guidance referenced in the
brief: **one dominant, one accent, the rest neutral; let warm and cool balance;
give bold color room to breathe.**

---

## 2. Role architecture (shared by all palettes)

Every palette defines the same 20 roles. A role's *job* is fixed; only its
*value* changes between palettes. This is the contract that makes the switcher —
and `tokens.css` — work.

| Role | Group | Job in the UI | Do **not** |
|---|---|---|---|
| `bg` | Surface | App canvas, behind everything | Put text directly on it |
| `surface` | Surface | Cards, panels, sidebar — default container | Use as a hover state |
| `surfaceRaised` | Surface | Headers, popovers, KPI cells, hover targets | Stack 3+ levels deep |
| `border` | Surface | Standard 1px dividers and card outlines | Use for text |
| `borderStrong` | Surface | Hard separation, input outlines, emphasis rules | Overuse — it shouts |
| `text` | Content | Headings + body. ≥7:1 on surface (AAA) | Use on accent fills |
| `textMuted` | Content | Labels, metadata, secondary copy. ≥4.5:1 (AA) | Use for primary reading at <14px on busy bg |
| `textDim` | Content | Timestamps, ghost captions. Large/decorative only | Use for any body copy (below AA) |
| `accent` | Brand | Primary buttons, active nav, links, focus rings | Spend on borders/backgrounds wholesale |
| `accentHover` | Brand | Hover/pressed state of accent surfaces | Use as the resting accent |
| `accentDim` | Brand | Selected‑row wash, badge fill, sparkline fill | Put accent‑colored text on it at small sizes unless ≥4.5:1 |
| `accentText` | Brand | Text/icon that sits **on** an accent fill | Use on `surface` |
| `warm` | Brand | Narrative highlight, 2nd data series, context | Use as a CTA or a status |
| `warmDim` | Brand | Tinted background for `warm` content | — |
| `ok` / `okDim` | Semantic | Success: nominal, cleared, on‑target | Mean "go" generically |
| `warn` / `warnDim` | Semantic | Warning: watch, trending to risk, caution | Use for errors |
| `danger` / `dangerDim` | Semantic | Error: at‑risk, failed, blocking | Use for ordinary emphasis |
| `info` / `infoDim` | Semantic | Neutral system notes, predictive/AI annotations | Confuse with `accent` (info is passive) |

**Universal pairing rules**

1. Text on its intended surface meets **WCAG AA (4.5:1)** minimum; `text` on
   `surface` targets **AAA (7:1)**. `textDim` is exempt — it is decorative.
2. Semantic color is **always doubled**: a `*Dim` background carries the matching
   `*` foreground (e.g. `danger` text on `dangerDim`). Never rely on hue alone —
   pair every status color with an icon, label, or dot for color‑blind users.
3. `accentText` is the only color allowed on an `accent` fill, and the pair is
   tuned to clear AA. On light palettes that means white on a deep accent; on
   dark palettes it means a near‑black ink on a luminous accent.
4. Focus ring = `accent` at 2px with 2px offset, on every interactive element.

---

## 3. The system — Foundry

The single source of truth for `tokens.css`. Dark, warm graphite. System states
are **branded** (tuned to the system) but keep their learned meaning — see §2.

**Foundry** — *warm bone ink on graphite* (Takorin native)
The cockpit‑glass instrument: gravity without coldness. Maps 1:1 to the live
`tokens.css` surfaces. System states: **success = the accent `#4B9CE4`**, gold =
caution, a clean refined **red `#EA5455`** = danger (hue ~0°, distinct from the
gold warn), periwinkle = info.
`bg #0B0F18` `surface #131A26` `raised #1B2538` `border #263042` `borderStrong #2F3A52`
`text #EDE4CB` `muted #7A8EA8` `dim #4A5D74`
`accent #4B9CE4` `accentHover #6FB0EA` `accentDim #0D1E38` `accentText #06121F`
`warm #C4844E` · `ok #4B9CE4` `warn #D4902A` `danger #EA5455` `info #7C86E8`

*Dropped (considered & rejected): Verdant (emerald green‑black — strong brand
color, but tints the product green and fights "green = good"), and the earlier
reference/original explorations Daylight · Rainmaker · Tocco · Halide · Ledger ·
Plasma · Kiln.*

---

## 4. Application map (where color lands, by surface)

- **Sidebar / chrome** — `bg`/`surface` with `borderStrong` seam; active item
  uses `accentDim` wash + `accent` left‑rail + `text`; inactive items `textMuted`.
- **Primary button** — `accent` fill, `accentText` label; hover → `accentHover`.
  Exactly one primary per view.
- **Secondary button** — transparent fill, `borderStrong` outline, `textMuted`
  label; hover lifts to `text`.
- **KPI numbers** — `text` for neutral metrics; switch to `ok`/`warn`/`danger`
  only when the number *is* a status (risk score, on‑target %).
- **Cards** — `surface` body, `border` outline; a status card gets a 3px
  `danger`/`warn` **left border** and a `*Dim`‑filled pill, never a full‑bleed
  color fill.
- **Charts** — series 1 = `accent`, series 2 = `warm`, threshold/target line =
  `danger` dashed; gridlines = `border`; never more than two saturated series.
- **Badges / chips** — `*Dim` background + matching `*` text + a 7px dot.
- **Links & focus** — `accent`; visited state is not tracked in an app context.

---

## 5. What this system refuses to do

- No pure black or pure white surfaces — kills the warm‑instrument character.
- No second accent competing with the first; `warm` is support, not a rival CTA.
- No semantic color used decoratively (a red divider, a green heading) — it
  dilutes the signal when it actually matters.
- No hue‑only status — every state pairs color with shape/label for
  accessibility.
- No gradients on body copy, labels, or data rows, and none below ~16px text —
  see §6 for where gradients *are* welcome.

---

## 6. Gradients — rare and earned

**Recommendation: flat by default.** Foundry works fully flat, and the product
should stay that way. Gradient is a deliberate accent in **exactly three places**
— it carries energy, so it goes only on what should be looked at first.
Recommendation view: `/__design_lab` → "Where gradients are allowed".

**The three places gradients are allowed**

| Use | Technique |
|---|---|
| Chart area‑fill | A single `accent → transparent` fill under a trend line — conventional, and it aids reading |
| One hero number | At most **one** signature metric per screen via `background-clip: text` — never ordinary KPIs |
| Brand / marketing surfaces | Login, empty states, marketing — a mesh/aurora where brand can breathe; **never in product data** |

**Flat everywhere else (the default):** KPI cells, tables & data rows, status
chips, buttons, cards & surfaces, gradient text on ordinary metrics, and borders.
No gradient backgrounds, surface sheen, gradient borders, or gradient‑filled CTAs
in the product — those read consumer and erode the instrument feel. Gradient
everywhere flattens the hierarchy it exists to create; the restraint *is* the craft.

---

## 7. Borders & radius

The quiet, engineered half of the instrument feel. Both should be nearly
invisible so the visual energy goes to the data and the one accent.

### Corner radius — tight, uniform

Use the existing `tokens.css` scale; resist rounder.

| Token | Value | Where |
|---|---|---|
| `--radius-sm` / `--radius-btn` | **2px** | buttons, chips, inputs, small controls |
| `--radius-md` | **6px** | cards & panels — the workhorse |
| `--radius-lg` | **10px** | large surfaces only: modals, the side/overlay panels |
| `--radius-full` | pill | avatars, status dots, toggles **only** |

- **Avoid `0px`** (brutalist, harsh on dense dark UI) and **avoid `>10px`**
  (consumer‑soft, drains gravity). The control‑panel slider exposes 0–28; the
  product lives at 2 / 6 / 10. Lab defaults open at **6** (card).

### Borders — 1px hairline, the primary structure

On dark graphite, shadows barely register, so structure comes from **borders +
surface steps, not elevation.** That makes the 1px line the most important
divider in the system.

- **One line weight: 1px.** Two *color* weights: `--border-soft` (standard
  dividers, cards) and `--border-strong` (inputs, emphasis rules, active state).
  Don't go to 2px lines — that reads brutalist.
- **Borders never carry system state.** Do **not** use a colored left‑ or
  top‑border on a card to signify danger/warn/ok. **Status goes on a badge** — a
  `StatusPill` with a label (e.g. Shift's "Watch" / "Act Now" tier pill), toned
  by severity. A card border is always the neutral 1px hairline. (Rationale: a
  badge is scannable, labelled, accessible, and consistent between nav and
  screens; a colored rail is an unlabelled, ambiguous second status channel.)
- **Active‑selection** left‑rail (e.g. the `accent` nav indicator) is fine — that
  is selection, not system state.
- **Focus ring = `accent`, 2px + 2px offset** — the one place 2px is correct.
- **No gradient borders in the product.** Borders are always flat 1px.

---

*Implementation: Foundry's roles already live in `tokens.css`. To change any
value, update the Layer‑1 primitive + Layer‑2 semantic alias, then update
`specs/tokens/token-reference.md`. The lab values above are intentionally raw —
the design lab is the one place exempt from the no‑raw‑hex rule
(see `scripts/token-audit.js` ignore list).*
