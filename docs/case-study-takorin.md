# Takorin

Takorin is a plant-operations platform built to replace alert noise with a ranked action queue. I rebuilt the home screen around that queue, set the platform's visual system to hold up across six different audiences without anyone needing a translation, and ran the build through a staged review process that caught every critical issue before it reached a single prospect.

## Problem

Plant directors running 2 to 6 lines had every signal they needed and no way to tell which one mattered first. Quality, supply chain, compliance, and equipment each ran their own alerts on their own logic, so nothing was ranked against anything else, nothing had a named owner, and nothing distinguished "act in the next ten minutes" from "review this week." The director had to do that triage by hand, every time they opened the tool.

## Decision: rank, don't add

The fix wasn't a new dashboard. It was answering "what do I look at first" directly: every signal gets an urgency tier, a named owner, and a time window, built entirely from data the platform already had.

I built this as its own screen, `/command`, and made it the new default landing view instead of a panel added to the existing home screen. A panel still competes with everything else on the page it sits on. A screen with nothing else on it makes the ranked list the only thing in the room.

**Tradeoff:** making `/command` the default route meant rewriting the redirect every other screen pointed to, and items clear from the queue on acknowledgement with no audit trail in this version. I cut the audit trail on purpose, to protect the "act now and move on" feeling for the first release. A compliance-heavy customer will eventually need that trail back. That's a known gap, logged, not an oversight.

**Result:** one entry point instead of five competing ones, and every signal inside it carries an owner and a deadline by construction, not by convention.

## Decision: the visual system is infrastructure, not a mood

I prototyped three different visual directions for the full platform. One was an instrument-panel approach, built on calibrated, attributable readings. Another paced itself like a narrative, where when something happened carried as much weight as what happened. The third leaned on atmosphere, using glow and texture to signal urgency.

I picked the instrument panel as the backbone and kept the other two as secondary effects. The reason wasn't taste, it was the constraint: this platform gets read by six different roles in one sitting, director through auditor through investor, and only the instrument-panel logic stayed legible across every one of them without anyone learning a new way to read a screen. The narrative direction implied more certainty than the underlying data actually had. The atmospheric direction looked good and proved nothing.

**Tradeoff:** the platform reads more restrained than either alternative would have alone. I traded distinctiveness for legibility on purpose, because the people who have to act on this screen under time pressure outrank the people who'll see it once in a deck.

## Decision: staffing is a config value, not a UI branch

Takorin needed to represent three different plant-floor realities: human-only crews, robotic lines, and hybrid lines. By the time a third screen needed to branch on staffing type, I stopped writing per-screen conditionals and moved `workerMode` into shared state once, read everywhere it mattered.

**Tradeoff:** this cost more time on the first feature that needed it than an if-statement would have. It paid that back immediately after: Robot Fleet and Resource Allocation, the two screens built right after this decision, both plugged into the existing config value without touching the original branching logic at all.

## How this got built

I ran the build through a staged AI design pipeline instead of freehanding screens one at a time: a stage that audited the existing system for the real gap, a stage that pressure-tested whether the proposed approach actually solved the scanning problem before any pixels got drawn, a build pass, and two separate critique passes run independently so visual polish couldn't hide functional debt.

My job in that process wasn't writing prompts. It was deciding when a finding was real debt and when it was noise, and overriding the model's own proposed direction when its first answer optimized for looking finished over being right. The second critique pass caught three things the first pass missed: low-opacity ghost text that had crept back into seven screens, a sparkline rendering as a six-point bar chart instead of a trend line, and an operator detail view that had quietly hardcoded one specific operator's name across every shift.

## Result

Two independent review passes found 4 critical and 4 major issues across the platform. Every critical got fixed before sign-off. One major issue got logged as documented design debt instead of dropped silently: an operator workflow that needs three taps against a two-tap spec, deferred because the real fix needs a different input method, not a patch. None of the issues either pass found reached a buyer demo.

## What's still open

The confidence thresholds in the platform's agentic layer were set by judgment about how costly a wrong call would be for each specific agent, not by usage data, because there isn't usage data yet. That's the one decision in this build I'd want challenged first. I don't know yet whether a real customer's risk tolerance calls for a simpler, uniform threshold instead of the more precisely tuned version I shipped. I'll find out when it's in front of someone whose job depends on the answer.
