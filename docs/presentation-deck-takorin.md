# Takorin — Presentation Deck
**Audience:** Design leadership / hiring panel
**Goal:** Show decision-making and judgment under real constraints, with honest results, in under 20 minutes.
**Format:** 8 slides. Problem, decision, tradeoff, result, repeated per major call, then how the work got made and what's still unresolved.

## Audience Analysis

This audience is listening for whether the impact story holds up past the first sentence, whether tradeoffs get named instead of glossed, and whether I can talk about a wrong call without getting defensive. Design craft gets them in the room. Decision-making and honest results keep them there.

## Key Messages

1. Solving "what do I act on first" meant ranking existing signals instead of adding new ones, on a platform where every module pulled toward showing more.
2. The platform's visual system was chosen against one hard constraint, not preference: it had to read the same way across six different audiences in one sitting.
3. Splitting review into two independent passes, run after the build was already called done, caught three real regressions a single combined pass would likely have waved through.
4. I directed a staged AI design pipeline rather than freehanding screens, and the actual work was deciding which findings were real and which were noise, including overriding the model's own first answer more than once.
5. There's no live usage data yet, so the results here are de-risking numbers, not business numbers, and I'll say that plainly in the room before anyone has to ask.

## Slide-by-Slide Outline

**1. Title**
- Content: "Takorin: replacing alert noise with a ranked action queue, with every critical issue caught before it reached a prospect."
- Visual: Plain title slide, no UI yet.
- Speaker notes: This sentence is the whole talk compressed. Everything after it is evidence.

**2. The Problem**
- Content: Plant directors running 2 to 6 lines had signals from quality, supply chain, compliance, and equipment, each with its own alert logic. Nothing was ranked against anything else. Nothing had a named owner. Nothing distinguished urgent from this-week. The director did that triage by hand, every session.
- Visual: Side-by-side of the old, unranked module alerts.
- Speaker notes: State the problem and stop talking. Let it sit before moving to the fix.

**3. Decision: Rank, Don't Add**
- Content: Built `/command` as its own screen and the new default landing view, not a panel on the existing home screen. Every item carries an urgency tier, owner, and time window from data the platform already had.
- Tradeoff: Cut the audit trail on queue-clear to protect the act-now feeling for this release. Logged as a known gap for compliance-heavy customers, not hidden.
- Result: One entry point instead of five, with ownership and deadlines built in rather than optional.
- Visual: Before and after of the home route.
- Speaker notes: If asked why no audit trail, say exactly what's in the tradeoff line. Don't improvise a justification in the room.

**4. Decision: The Visual System Is Infrastructure**
- Content: Three directions tested against one constraint: legible to six different roles in one sitting, director through auditor through investor. The instrument-panel direction won because it stayed legible under that test. The other two implied more than the data supported or looked good without proving anything.
- Tradeoff: Less distinctive than either alternative alone. Traded for legibility on purpose.
- Result: One visual grammar, no per-audience redesign required.
- Visual: Three direction thumbnails, the chosen elements marked.
- Speaker notes: This is the slide that answers "how do you decide A versus B" if it comes up later. Point back to it directly.

**5. Decision: Staffing Is Config, Not a UI Branch**
- Content: Plants run human-only, robotic, or hybrid crews. Moved `workerMode` into shared state once instead of writing a conditional into every screen that touched staffing.
- Tradeoff: Cost more time on the first feature that needed it.
- Result: The next two screens built, Robot Fleet and Resource Allocation, plugged into the existing value with zero changes to the original logic.
- Visual: One config value branching into three places it's read.
- Speaker notes: This is the systems-thinking slide. Say plainly that the first feature was slower to build because of this call, and that the second and third were faster because of it.

**6. How It Got Built**
- Content: A staged AI design pipeline did the drafting: audit the existing system, pressure-test the proposed approach before drawing anything, build, then two independent critique passes. My job was deciding which findings were real debt and which were noise, and overriding the model's first answer when it optimized for looking finished over being right.
- Visual: None needed. Talk through it.
- Speaker notes: Name one specific override, the second critique pass catching the hardcoded operator name, as the concrete example if asked what "overriding the model" actually looked like.

**7. Result**
- Content: Two independent review passes found 4 critical and 4 major issues. Every critical got fixed before sign-off. One major got logged as design debt on purpose, an operator workflow needing three taps against a two-tap spec, deferred because the real fix needs a different input method. Zero of the issues either pass found reached a buyer demo.
- Visual: The three caught regressions, before and after.
- Speaker notes: This is the slide that proves the rigor claimed in slide 6 actually produced something. Don't round the numbers up or down.

**8. What's Still Open**
- Content: The agentic layer's confidence thresholds were set by judgment about how costly a wrong call is per agent, not by usage data, because there isn't usage data yet. I don't know yet whether a real customer's risk tolerance calls for a simpler, uniform threshold instead of the tuned version shipped. That's the call I'd want this room to push on first.
- Visual: Plain text.
- Speaker notes: Say this before anyone asks. Naming it first is the point of the slide.

## Copy Pass Notes

Cut "Hook," "Journey," and other process-theater labels from the slide content itself. Slide titles state the decision or the result directly. Internal shorthand (ghost text, FSMA references, code identifiers) stays in speaker notes, where it can be explained, not in titles where it has to carry the slide alone on its own. The closing slide states the open question as a fact about the work, not a rhetorical question thrown to the room.

## Suggested Next Step

Run `/write-rationale` on slides 3 through 5 if a written leave-behind is needed for a take-home round. The deck version here is already compressed for an 18-to-20-minute spoken pass.
