# Takorin — Design Rationale
Deepened version of the three rationale slides (5, 6, 7) from `presentation-deck-takorin.md`, expanded for a written leave-behind rather than spoken delivery.

---

## Decision 1: "Warm Instrumentation" as the Platform's Visual Grammar

### Decision
Adopt a single visualization and UI grammar — Warm Instrumentation — across the entire platform: an analytical, attribution-first instrument-panel backbone, with narrative pacing and material atmosphere borrowed only as secondary texture, never as the primary way information is communicated.

### Context
Takorin needed one visual language that would be read by six structurally different audiences in the same session — director, QA lead, plant ops, auditor, executive, and eventually investor — without any of them needing a different mental model to parse the same screen. The platform also already had an established design system (`design.md`) that any new direction had to extend, not replace.

### Options Considered
- **Direction A — Instrument Panel.** Calibrated, attribution-first, semantic color only (ok/warn/danger), tabular-nums for readings, dense but disciplined. Deterministic and inspectable by design.
- **Direction B — Narrative/Editorial Pacing.** Visual rhythm and whitespace driven by storytelling; temporal progression and intervention annotations read like a written account of what happened.
- **Direction C — High Materiality.** Field glow under critical signals, pressure-density backgrounds, motion-based signal convergence — atmosphere and tension communicated through surface texture.

### Evidence
Each direction was prototyped against the same screen, then evaluated specifically against the six-audience constraint — not against general aesthetic preference. Direction A was the only one of the three that held its meaning unchanged across all six roles: an auditor and an executive could both read a same panel correctly without translation. Direction B risked what was internally called "insight theater" — the pacing implied meaning that wasn't always backed by the underlying data. Direction C risked "signal art" — the material cues were compelling but not reliably attributable, which is disqualifying in a compliance-adjacent product.

### Reasoning
Direction A was adopted as the backbone because instrumentation logic is the only one of the three that is inherently audience-agnostic — a calibrated reading means the same thing to everyone who can read a number. Direction B's pacing was retained, but demoted to a structural tool (when things happened, in what order) rather than a tone (how the user should feel about it). Direction C's materiality was retained only as low-opacity seasoning — a glow under a critical signal, a faint thermal tint on a problem row — explicitly scoped to be "imperceptible when absent, felt when present," so removing it would never remove information, only ambience.

### Trade-offs
The platform reads as more restrained and less visually distinctive than either Direction B or Direction C would have produced on their own. This was accepted deliberately: legibility across six audiences outranked having a more memorable, single-audience aesthetic. The cost shows up most in marketing-adjacent contexts (e.g., an investor deck) where a punchier visual language might have performed better in isolation — but that audience was never going to be the primary daily user, so the trade was made in favor of the people who actually have to act on the screen under time pressure.

### Validation Plan
The real test is whether a plant director, an auditor, and an executive can each correctly state what a given panel is telling them without being walked through it — that's a usability check to run once the platform is in front of real prospects, not something provable in isolation. Until then, the working proxy was the design-critic and heuristic-evaluator passes, both of which were run as if reviewing for a skeptical, unfamiliar viewer rather than someone who already knew the system.

---

## Decision 2: Command Surface as a Dedicated Screen, Not a Widget

### Decision
Build `/command` as its own destination screen and make it the new default landing route, rather than adding a notification panel or summary widget to the existing home screen.

### Context
The originating problem was explicit: plant directors had no priority hierarchy, no ownership, and no time framing across existing signals. The brief (`docs/designpowers/briefs/2026-04-29-command-surface.md`) named the success metric narrowly — a director opens Takorin and immediately knows what to act on, with every signal owned and time-boxed.

### Options Considered
- **A panel or widget on the existing home/dashboard screen,** surfacing the top few ranked items alongside other dashboard content.
- **A digest-style summary** (email or end-of-shift style), reviewed periodically rather than live.
- **A dedicated `/command` screen** with no competing content, set as the new default route.

### Evidence
The strategist stage explicitly tested approaches against one question — does this directly solve "what do I look at first" — and rejected anything that left the scanning problem unsolved. A widget on an existing dashboard was judged to fail that test: it would still compete for attention with whatever else lived on that page, reproducing the original noise problem at a smaller scale. A digest was rejected because the platform's signals are time-sensitive (urgency tiers, time windows); a periodic summary contradicts the idea of acting on something now versus this week.

### Reasoning
A destination screen with nothing else on it makes the ranked queue the only thing in the room — there's no competing visual weight to scan past. Setting it as the new default route reinforces the answer structurally: the first thing a director sees, every session, is the ranked list, not a menu of other things they could look at instead. The queue clears on acknowledgement specifically so directors get a clean, immediate sense of resolution without needing an audit trail in the MVP — a deliberate scope cut in service of the "act now" feeling, with the trade-off named explicitly below.

### Trade-offs
Making `/command` the default route required changing the existing default redirect — a small technical change with outsized product consequences, since every other screen becomes, by definition, a drill-down from this one. Clearing items from the queue on acknowledgement means there is no built-in audit trail of what was triaged and when; this was accepted for the MVP as a conscious gap, not an oversight, and is the kind of decision that would need revisiting before a compliance-heavy customer would accept it in production.

### Validation Plan
The two metrics that actually validate this decision are time-to-first-action (does a director act within their session, or do they leave and lose the urgency) and whether anything meaningful was missed by routing everyone through one queue instead of letting directors browse modules first. Neither is measurable in a static prototype; both are the first things to instrument if this gets in front of a design partner with real usage.

---

## Decision 3: Worker Mode as Config, Not Conditionals

### Decision
Represent plant staffing reality — human-only, robotic, or hybrid — as a single `workerMode` value per plant in shared state, and gate all worker-mode-dependent UI (Sidebar nav, HandoffIQ flow, CommandSurface panels, new Robot Fleet and Task Allocation screens) off that one value, rather than writing per-screen conditionals as each new staffing-aware feature was needed.

### Context
The platform's original assumption — every plant is staffed the same way — broke when Takorin needed to represent plants that aren't human-only (a robot-staffed line, a hybrid line). This wasn't a single screen's problem; it touched navigation, handoff flows, agent activity, and required two entirely new screens (Robot Fleet, Resource Allocation).

### Options Considered
- **Per-screen conditionals,** added wherever a screen needed to behave differently for a robot- or hybrid-staffed plant.
- **A feature-flag-style toggle** scoped to specific components only where the difference was currently known to matter.
- **A single config value (`workerMode`) per plant in shared app state,** read by any component that needs to branch on staffing model.

### Evidence
At the point this decision was made, at least three existing surfaces already needed different behavior (HandoffIQ's sign-off flow vs. machine-state handoff, Sidebar nav items, CommandSurface's agent activity panel), with two new screens incoming. That's a strong signal the need was structural, not local to one feature — a pattern repeating across three-plus surfaces before the architecture decision was even made is past the threshold where ad hoc conditionals stay maintainable.

### Reasoning
A config value that lives once, in shared state, and propagates via context (`workerMode` / `setWorkerMode`) means every future worker-mode-aware feature has exactly one place to read from, and switching plants automatically switches mode everywhere at once — there's no risk of one screen reflecting the new plant's staffing model while another still shows the old one. This is the architecture bet of the project: it costs more upfront than a quick conditional would have, in exchange for every subsequent worker-mode feature being cheaper to add than the last one, instead of more expensive.

### Trade-offs
This was more upfront design and engineering work than the immediate need justified on day one — the first use case (HandoffIQ's branching flow) could have shipped faster with a local conditional. The bet only pays off if worker-mode-aware features keep arriving, which they did (Robot Fleet, Resource Allocation, agent activity panel) — but that was a bet made on a roadmap, not a guarantee, and an architecture decision made too early can be its own form of debt if the pattern hadn't repeated.

### Validation Plan
The real validation already happened in practice: every subsequent worker-mode feature (Robot Fleet, Resource Allocation, the AgentControl panel) plugged into the existing config value without needing to touch the original branching logic in HandoffIQ or Sidebar. If a future feature needs worker-mode awareness and can't cleanly read from the existing `workerMode` context, that's the signal the abstraction has reached its limit and needs to be revisited rather than patched around.

---

## Copy Review Notes

Each rationale section leads with the decision stated as a complete claim ("Adopt X," "Build Y," "Represent Z as config") rather than a topic heading, so a reader skimming just the bolded decision lines still gets the actual point. Internal shorthand ("ghost text," brief filenames, code identifiers) is kept to evidence/reasoning paragraphs where it can be explained in context, not in headings where it would need to carry meaning on its own. Trade-offs are stated as plain costs ("more upfront work," "no audit trail") rather than softened ("an opportunity for future iteration"), per the clear-over-clever principle — this audience reads hedged trade-offs as a credibility flag, not as diplomacy.

## Suggested Next Step
This document is ready to package as a handoff/wiki artifact alongside `case-study-takorin.md` and `presentation-deck-takorin.md`. If the design-leadership presentation gets scheduled, `/build-presentation` can pull the Trade-offs and Validation Plan sections in as backup-slide material for question handling.
