# Takorin — Presentation Deck: The Agentic Layer
**Audience:** Design leadership / portfolio review
**Goal:** Demonstrate capability — specifically, design judgment around AI autonomy: when an agent should act on its own, when it should ask, and how a human stays able to trust either outcome.
**Type:** Portfolio/Case Study (single-feature scope), adapted for a design-fluent audience.
**Subject:** The agentic layer — 8 confidence-gated agents, and the cross-agent escalation workflow that ties them together. This is the most structurally complex workflow in the platform: it isn't one screen, it's a handoff chain that spans detection, decision, possible escalation, and closure.

## Audience Analysis

A design-leadership audience reviewing an AI feature is checking for one thing above all: did the designer think about what happens when the agent is wrong, not just when it's right. They'll be listening for whether autonomy was designed deliberately (thresholds, escalation paths, visible logging) or just exposed because the model could technically do it. Lead with the failure path, not the happy path — that's where the judgment is visible.

## Key Messages (3–5 takeaways)

1. Autonomy was designed as a spectrum with a visible seam, not a binary on/off — every agent either acts or asks, and which one happens is governed by an explicit confidence threshold, not by what the model felt like doing.
2. The actual design problem wasn't any single agent's behavior — it was the handoff between agents, e.g. a compliance breach detected by one agent has to survive being escalated, picked up, and eventually closed out by two others without losing context along the way.
3. The action log isn't a debug tool, it's the trust mechanism — a director's confidence in autonomous action comes entirely from being able to see what happened and why, after the fact, without having had to watch it happen.
4. Escalation isn't a fallback for failure — it's a designed-for, expected branch of the workflow, with its own UI, not an error state bolted on afterward.
5. This connects directly back to the platform's instrumentation principle: deterministic, inspectable, attributable. Agent autonomy was only allowed to ship where that principle could still hold.

## Story Arc

Hook → Context → Journey (the worked example, one signal walking through the full chain) → Solution rationale → Evidence → Reflection. The worked example is the spine of this deck — abstract agent descriptions don't land, watching one signal move through detection → decision → escalation/closure does.

## Slide-by-Slide Outline

**1. Title**
- Purpose: Frame this as an autonomy/trust problem, not a feature list.
- Content: "Designing for Agents That Act Without You Watching." Subhead: the agentic layer, Takorin.
- Visual: Plain title slide.
- Speaker notes: Set the frame immediately — this is not "we added AI agents," it's "we had to design what happens when they're wrong."

**2. The Hook**
- Purpose: Make the trust problem concrete before showing any agent UI.
- Content: "An agent that's right 95% of the time and silent about it is less trustworthy than one that's right 80% of the time and shows its reasoning." State the core tension: more autonomy reduces a director's workload; more autonomy also raises the cost of being wrong unsupervised.
- Visual: None yet — text only.
- Speaker notes: This is the thesis the whole deck argues for. Everything after this slide is evidence for it.

**3. Context — 8 Agents, One Shared Risk**
- Purpose: Establish scale and shared design constraint before the worked example.
- Content: 8 agents (Pre-Shift Verification, Compliance Monitor, Supplier Intelligence, Resource Allocation, Predictive Maintenance, Handoff Synthesis, Risk Escalation, CAPA Closure), each with its own domain but the same underlying question: act now, or surface to a human?
- Visual: Simple 8-tile grid, one line per agent.
- Speaker notes: Don't dwell here — this slide exists so the worked example in slide 5 doesn't feel like the whole feature.

**4. The Workflow — Why This One Is the Hard Case**
- Purpose: Justify why this particular chain (not a single-agent action) is the thing worth presenting.
- Content: Most agent actions are single-step (an agent acts, logs it, done). The hard case is a chain: Compliance Monitor detects a threshold breach → if confidence is high, it auto-opens a CAPA; if not, Risk Escalation routes it to a director → once corrective action is taken, CAPA Closure tracks evidence and validates the case can close. Three agents, one signal, two possible branch points.
- Visual: Simple swimlane diagram — Compliance Monitor → (branch) → Risk Escalation OR direct CAPA open → CAPA Closure.
- Speaker notes: Name explicitly that this is the slide that earns the rest of the deck's attention — single-agent actions are comparatively easy to design for.

**5. The Worked Example — Walkthrough**
- Purpose: Make the abstract chain concrete with one real signal.
- Content: A quality threshold breach is detected. Compliance Monitor evaluates confidence against its threshold. High confidence → CAPA auto-opens, logged, no human in the loop yet. Lower confidence → Risk Escalation routes it through the escalation chain to the right director, with the original signal context attached, not just "something happened." Once the corrective measure is taken (by a human, downstream), CAPA Closure tracks the evidence and validates against closure criteria before the case can actually close.
- Visual: 3–4 screenshots in sequence — the detected signal, the action log entry, the escalation view (if it branched that way), the closure record.
- Speaker notes: Pause on the branch point — ask the room what they'd want to see if they were the director receiving the escalation. That's the actual design question this slide is answering.

**6. Decision Rationale — Where the Confidence Threshold Sits**
- Purpose: Show the central judgment call, not just the mechanism.
- Content (rationale structure):
  - *Decision:* Each agent acts autonomously above its confidence threshold and queues for human review below it, rather than always acting or always asking.
  - *Context:* full autonomy removes the workload but removes the human's ability to catch a wrong call before it has consequences; full manual review defeats the purpose of having an agent at all.
  - *Options considered:* agent always acts (then notify); agent always asks first; threshold-gated split.
  - *Reasoning:* the threshold-gated split lets the cost of a wrong call set the bar per agent — a scheduling-reallocation suggestion (Resource Allocation) can tolerate a lower threshold than an action that auto-opens a compliance case, because the downstream cost of being wrong is different.
  - *Trade-off:* this means the platform doesn't have one universal trust story — a director has to learn that different agents carry different default autonomy, which is more cognitively demanding than "AI always asks" or "AI always acts" would be.
- Visual: A simple threshold slider diagram, two or three agents plotted at different points on it.
- Speaker notes: This is the slide most likely to get pushback — be ready to defend why a non-uniform threshold was worth the added complexity.

**7. Decision Rationale — The Action Log as the Trust Mechanism**
- Purpose: Show that visibility, not accuracy, is what was actually being designed for.
- Content (rationale structure):
  - *Decision:* every agent action — autonomous or escalated — writes to a single, visible action log, not a backend audit trail a director has to dig for.
  - *Context:* a director who can't see what an agent did will either disable autonomy entirely or stop checking — both failure modes defeat the feature.
  - *Reasoning:* trust in an autonomous system is built retrospectively, by being able to check its work after the fact without having had to supervise it live. The log had to be a first-class, always-visible surface, not a debug feature.
  - *Trade-off:* surfacing every action, including the routine ones, risks becoming its own noise problem — the same failure mode the whole platform was built to solve in the first place.
- Visual: Action log screenshot, annotated to show one autonomous entry and one escalated entry side by side.
- Speaker notes: Connect this explicitly back to the platform-wide "synthesis over volume" principle — the log had to be ranked too, not just exhaustive.

**8. Evidence — Does the Chain Actually Hold Together**
- Purpose: Show this wasn't just designed, it was checked.
- Content: The escalation path was deliberately tested for context loss — does a director receiving an escalated signal see the original detection context, or just "something needs attention"? Call out that this is the same discipline applied elsewhere in the platform (the design-critic pass that caught a hardcoded operator attribution bug) — multi-agent handoffs are exactly where context silently drops, and that's where review attention went.
- Visual: None required — can be text/discussion.
- Speaker notes: If asked "how do you know this works," this is the honest answer: it was tested for the specific failure mode (context loss across a handoff), not just for whether each agent individually behaved correctly.

**9. Reflection**
- Purpose: Name the open question honestly.
- Content: The non-uniform confidence threshold (slide 6) is the decision least validated by real usage — it was set by judgment about relative cost-of-being-wrong, not by data, because the platform doesn't have live usage yet. That's the thing most likely to need revision once a real customer's risk tolerance is known.
- Visual: Text only.
- Speaker notes: Naming this unprompted, before anyone asks, is the actual point of this slide.

**10. Close**
- Purpose: End with a craft question for this specific room.
- Content: "What I'd want pushback on: should confidence thresholds be uniform across all agents for the sake of a simpler trust story, even at the cost of being less precisely tuned per agent?"
- Visual: Plain text.
- Speaker notes: This is a real open design question, not a rhetorical one — be ready to actually discuss it, not just ask it.

## Copy Pass Notes (UX writing principles applied)

- Slide titles state a claim or a question, not a topic ("Where the Confidence Threshold Sits," not "Confidence Thresholds") — each one should be answerable from the title alone if someone only reads the deck outline.
- "Threshold-gated split" and similar internal shorthand are confined to rationale paragraphs, not headlines, so a reader unfamiliar with the codebase isn't asked to absorb a term before it's explained.
- The closing ask is phrased as a real, answerable question rather than a rhetorical flourish, consistent with the "say what you need" CTA guidance carried over from interface copy.

## Suggested Next Step
Run `/write-rationale` on slides 6 and 7 (confidence threshold placement, action log as trust mechanism) if this needs to become a written leave-behind alongside `design-rationale-takorin.md`.
