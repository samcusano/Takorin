# Design Brief: Command Surface

## Problem Statement
Takorin surfaces risk signals across 8 screens, but plant directors can't triage them.
Signals compete for attention without hierarchy, urgency is expressed as severity levels
but not time-to-action, and there is no clear ownership attached to any signal.
The result: directors scan screens instead of acting on floors.

## Users
**Primary:** Plant director, overseeing 2–6 lines simultaneously.
Working at a desk or tablet. High stakes, low tolerance for noise.
Mental model: a well-maintained operations ledger.

**Ability spectrum:** Under cognitive load by default — split attention, shift pressure,
ambient noise. Must work at a glance. Must be usable under fatigue.

## Core Gaps
1. No signal priority hierarchy — "what matters most right now?" is unanswered on every screen
2. No ownership — director sees a problem but not whose job it is to fix it
3. No time framing — "act in 5 minutes" looks identical to "monitor for 2 hours"
4. No decision closure — system presents risk but doesn't complete the loop to a recommended action

## Design Direction
**Approach A: Command Surface**

A persistent ranked action queue, visible across all screens (anchored in the sidebar or
as a persistent layer). Each item surfaces: urgency tier, named owner, time window, and
recommended action. The director opens Takorin and sees the top items that need action
right now — without navigating between screens.

Takorin already has all the data. The gap is synthesis and surfacing.
Don't add more signals; rank the existing ones.

## Constraints
- Must work within the existing design system (design.md)
- Color palette: ochre, stone, ink, semantic danger/warn/ok — no substitutions
- Layout: sidebar (240px) + main area pattern must be preserved
- TypeScript/React + Tailwind stack
- No new data sources or backend integrations
- No mobile-first redesign

## Existing Design System
`design.md` at project root. Full color palette, typography, layout patterns
(ActionBanner → StatBar → Content + right rail), component library at
`src/components/UI.jsx`.

## Taste Direction (Early Signal)
Precision instrument aesthetic — warm material (stone, ochre, brass), not cold enterprise
software. High information density is intentional; the problem is hierarchy, not volume.
The Command Surface should feel like a priority dispatch board, not a notification feed.

## Success Criteria
- Director opens Takorin and knows immediately what to act on
- Every signal has a next step and a named owner
- Urgency is unmistakable — "act now" looks and feels different from "watch this"
- Less time in the app, more time on the floor

## Out of Scope
- New data sources or backend integrations
- Mobile-first redesign
- Authentication / settings screens
- Redesigning existing screens (beyond surfacing Command Surface signals on them)
