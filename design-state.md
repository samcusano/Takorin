# Takorin · Design State
_Designpowers shared context — updated by agents throughout the pipeline_

## Brief Summary
**Project:** Command Surface for Takorin  
**Problem:** Plant directors can't triage signals — no priority hierarchy, no ownership, no time framing  
**Primary persona:** Plant director, overseeing 2–6 lines, high cognitive load, low tolerance for noise  
**Success metric:** Director opens Takorin and knows immediately what to act on; every signal has an owner and time window  
**Brief:** `docs/designpowers/briefs/2026-04-29-command-surface.md`

## Design Principles
1. **Synthesis over volume** — don't add signals, rank existing ones
2. **Ownership is mandatory** — no signal without a named responsible party
3. **Urgency is spatial and chromatic** — act-now looks structurally different from watch-this
4. **Instrument precision** — warm material aesthetic, not enterprise dashboard noise

## Pipeline State
| Agent | Status | Notes |
|-------|--------|-------|
| design-scout | ✅ complete | Read design.md, screens, components. Identified command surface gap. |
| design-strategist | ✅ complete | Discovery complete. Approach A approved. Brief saved. |
| design-lead | ✅ complete | /command screen built, sidebar entry added, route wired, default redirect updated |
| motion-designer | ✅ complete | slide-right for panels, waveform-reveal, button press, dismiss transitions, prefers-reduced-motion coverage, ConsequenceNotice prop fix |
| content-writer | ✅ complete | Consequence message timing, 'Watch only' CTA, dismissed copy, 'Confirm reviewed' on override, 'Open case file', OperatorView empty state |
| design-builder | ✅ complete | All 5 design debt items resolved |
| accessibility-reviewer | ✅ complete | 2 critical + 2 major found, all fixed |
| design-critic | ✅ complete | Revise verdict, 1 major craft fix applied |
| heuristic-evaluator | ✅ complete | 3 critical + 2 major + 2 minor. All criticals fixed. 1 major noted as design debt. |

## Decisions Log
| Decision | Rationale | Agent |
|----------|-----------|-------|
| Command Surface approach | Directly solves "what do I look at first" — other approaches left the scanning problem unsolved | User direction |
| Work within existing design system | design.md is the source of truth; no palette substitutions | Constraint |
| `/command` as dedicated screen (new default home) | Director lands here first; other screens are drill-down destinations | User direction |
| Queue clears on acknowledgement | Clean sense of resolution; no need for audit trail in MVP | User direction |

## Open Questions
- How many items should the Command Surface show? (3? 5? Unlimited with scroll?) — to be determined by design-lead
- 9px ghost text: 61 remaining instances across 9 screens still below WCAG AA contrast. Systematic pass pending (NotificationCenter operationally critical instances fixed). Design debt.
- WaveformSparkline: 6 data points reads as bar chart, not waveform. Needs 12–16 points to achieve waveform visual vocabulary.

## Resolved Questions
| Question | Answer | Source |
|----------|--------|--------|
| Where does Command Surface live? | Dedicated `/command` screen — new default home | User direction |
| Resolution behavior | Item removed from queue on acknowledgement | User direction |

## Handoff Chain
```
design-strategist → design-lead [2026-04-29]:
"Command Surface approach approved. Director needs a ranked action queue:
urgency tier + named owner + time window + recommended action. Takorin 
already has all the data — the gap is synthesis and surfacing. 
Don't add signals; rank existing ones. The feel should be a priority 
dispatch board, not a notification feed. Warm material aesthetic, 
high density — but hierarchy must be unmistakable."
```

## Artefact Index
- Brief: `docs/designpowers/briefs/2026-04-29-command-surface.md`
- Design system: `design.md`
- Component library: `src/components/UI.jsx`
- Screens: `src/screens/`

## Mode
DIRECT — user approves each handoff before next agent dispatched
