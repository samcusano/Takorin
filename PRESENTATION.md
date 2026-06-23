# Takorin: Presentation Deck

**Audience:** Design leadership and hiring panel
**Goal:** Show product judgment and decision-making under real constraints, with honest results, in 18 to 20 minutes
**Format:** 11 slides. Aligned to the case study so the spoken version and the written version tell one story.

---

## Audience analysis

This panel is listening for whether the impact story holds up past the first sentence, whether tradeoffs get named instead of glossed, and whether I can talk about a wrong call without getting defensive. Design craft gets me in the room. Decision-making and honest results keep me there. The business framing matters here too, because it shows I was designing a product, not decorating one. The one thing that loses this room is a number I cannot defend, so every claim is sourced or labeled as a hypothesis.

## Key messages

1. I reframed the brief from "show more data" to "rank what we already have," and I had the standing to do it because three plant directors at three of the top four food manufacturers told me to my face they do not open the dashboard they already own.
2. The visual system was chosen against one hard constraint, legibility to six different roles in one sitting, not against preference.
3. The business case is real and asymmetric. OEE economics make the subscription a fraction of the loss it prevents, and the precedent library makes the product harder to remove the longer it runs.
4. I directed a staged AI build pipeline. The actual work was judging which findings were real debt and which were noise, including overriding the model's first answer more than once.
5. There is no live usage data yet, so the results are validated demand and de-risking review numbers, not business outcomes. I say that before anyone has to ask.

---

## Slide-by-slide outline

### 1. Title
- **Content:** "Takorin: replacing alert noise with a ranked action queue, validated by the directors who would use it and caught clean before it reached a prospect."
- **Visual:** Plain title slide, no UI yet.
- **Speaker notes:** This sentence is the whole talk compressed. Everything after it is evidence.

### 2. The business problem
- **Content:** Plant directors running two to six lines have every signal they need and no way to tell which matters first. The losses that drag OEE down are three or four mild signals compounding over two hours into an outcome that was obvious at minute forty. By the time anyone notices, the window has closed. A point of OEE on one line is six figures a year, so this is a money problem, not a reporting one.
- **Visual:** A timeline of a shift's first two hours with the controllable window shaded and the moment of noticing marked after it closes.
- **Speaker notes:** State the economics first. If the panel does not believe OEE is the money lever, nothing after this lands. Then stop talking and let the closing window sit.

### 3. What three plant directors told me
- **Content:** I interviewed three plant directors across three of the top four global food manufacturers, anonymized. Three findings converged. They do not want more dashboards. Their deepest fear is not a wrong number, it is a confidently wrong recommendation they act on. And the first hour of a shift is where the loss gets set.
- **Visual:** Three quote cards, attributed by role not name.
- **Speaker notes:** This is the slide that earns the reframe two slides later. When a director tells you she does not open the dashboard she already has, "build another dashboard" stops being a serious option. Name that this is where my standing to push back came from.

### 4. The competitive gap
- **Content:** I mapped Takorin against the tools these plants already pay for. MES and OEE dashboards show what happened, not the conditions that caused it. QMS and CAPA systems document cases, they do not correlate them. Supplier tools sit siloed from shift-floor risk. Machine-health AI is blind to staffing and supplier risk. Nobody owns the decision layer.
- **Visual:** The competitive table from the case study, with the empty "decision layer" column highlighted.
- **Speaker notes:** The point is not that incumbents are bad. They are good at their slice. The gap is that every one of them leaves the correlation, the judgment part, on the human.

### 5. The business opportunity
- **Content:** Three forces open the market now: agentic AI is mature enough to trust with a human approval step, FSMA 204 makes lot-level traceability a hard 2028 requirement, and the master operators whose judgment runs these plants are retiring. The economics are asymmetric: the subscription is a fraction of the OEE it protects. The motion is land on one line, prove it against that line's own history, expand to the plant. The moat compounds, because every actioned shift makes the next recommendation more credible.
- **Visual:** Land-and-expand diagram, one line to plant to network, with the precedent library shown growing underneath.
- **Speaker notes:** Say plainly that the market sizing is directional and would need hard validation before an investor deck. Naming that keeps a finance-literate panel on side instead of hunting for the number I cannot back.

### 6. Decision: rank, don't add
- **Content:** The fix was not a new data source. It was answering "what do I look at first" using signals the platform already had, with an urgency tier, a named owner, and a time window on every item. I built it as its own screen and made it the default landing view, not a panel on the existing home screen.
- **Tradeoff:** Items clear from the queue on acknowledgement with no audit trail in this release. I cut the trail on purpose to protect the act-now feel, and logged it as a known gap for compliance-heavy customers rather than hiding it.
- **Visual:** Before and after of the home route, five competing alerts to one ranked queue.
- **Speaker notes:** A panel competes with everything on its page. A screen with nothing else on it makes the ranked list the only thing in the room. If asked why no audit trail, give the tradeoff line exactly. Do not improvise a justification.

### 7. Decision: the visual system is infrastructure
- **Content:** Three directions tested against one constraint: legible to six different roles in one sitting, director through auditor through investor. The instrument-panel direction won because it stayed legible under that test. The narrative direction implied more certainty than the data had. The atmospheric direction looked good and proved nothing.
- **Tradeoff:** Less distinctive than either alternative alone. Traded for legibility on purpose.
- **Visual:** Three direction thumbnails, the chosen one marked, the six reader-roles listed down the side.
- **Speaker notes:** This is the slide that answers "how do you decide A versus B." The people who act on this screen under time pressure outrank the people who see it once in a deck.

### 8. Decision: staffing is config, not a UI branch
- **Content:** Plants run human-only, robotic, or hybrid crews. By the third screen that needed to know which, I moved `workerMode` into shared state once instead of writing a conditional into every screen.
- **Tradeoff:** Cost more time on the first feature that needed it.
- **Result:** The next two screens, Robot Fleet and Resource Allocation, plugged into the existing value with zero changes to the original logic. I later folded both into the shift view for the same reason.
- **Visual:** One config value branching into the places it is read.
- **Speaker notes:** The systems-thinking slide. Say plainly that the first feature was slower because of this call and the next two were faster because of it.

### 9. How it got built
- **Content:** A staged AI pipeline did the drafting: audit the existing system, pressure-test the approach before drawing anything, build, then two independent critique passes run separately so polish could not hide functional debt. My job was deciding which findings were real debt and which were noise, and overriding the model when its first answer optimized for looking finished over being right.
- **Visual:** The pipeline stages as a horizontal flow, with the two critique passes drawn as separate lanes.
- **Speaker notes:** The concrete override: the second critique pass caught an operator view that had hardcoded one operator's name across every shift. The screen looked complete. A single combined pass, satisfied by the polish, would likely have waved it through.

### 10. Results
- **Content:** Two independent review passes found 4 critical and 4 major issues. Every critical was fixed before sign-off. One major was logged as documented design debt on purpose, an operator workflow needing three taps against a two-tap spec, deferred because the real fix needs a different input method. None of the issues either pass found reached a buyer demo. Demand is validated separately: all three director interviews confirmed the problem and rejected the dashboard alternative.
- **Visual:** The caught regressions before and after, plus the three findings as validated-demand markers.
- **Speaker notes:** Do not round the numbers. This is the slide that proves the rigor claimed on slide 9 produced something. The OEE targets are hypotheses to pilot, not results I am claiming, and I say so.

### 11. What is still open
- **Content:** The agentic layer's confidence thresholds were set by judgment about how costly a wrong call is per agent, not by usage data, because there is no usage data yet. I do not know whether a real customer's risk tolerance calls for a simpler uniform threshold instead of the tuned version I shipped. That is the call I would want this room to push on first.
- **Visual:** Plain text.
- **Speaker notes:** Say this before anyone asks. Naming it first is the point of the slide. The second open item, the gap between a prototype that reviews clean and a product that survives a real plant's data and regulators, is mapped in the PRD if they want to go there.

---

## Copy pass notes

Slide titles state the decision or the result directly, with no process-theater labels. Internal shorthand stays in speaker notes where it can be explained, not in titles where it has to carry the slide alone. The closing slide states the open question as a fact about the work, not a rhetorical question thrown to the room. No em dashes in slide copy.

## Alignment with the case study

This deck maps one to one with `CASE-STUDY.md`: slide 2 is the business problem, slide 3 is the research, slide 4 is the competitive landscape, slide 5 is the business opportunity, slides 6 through 8 are the design decisions, slide 9 is the build process, slide 10 is outcomes, and slide 11 is reflections. The PRD is the leave-behind for anyone who wants the full architecture and the honest gap analysis.

## Suggested next step

Run `/write-rationale` on slides 6 through 8 if a written leave-behind is needed for a take-home round.
