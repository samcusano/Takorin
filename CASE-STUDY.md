# Takorin: Case Study

**Role:** Product Designer (sole designer, AI-directed build)
**Type:** Plant-operations platform for food manufacturing
**Scope:** Market and user research, end-to-end product design, 22 screens, design system, staged review
**Stage:** High-fidelity prototype, validated through research and review, not yet in front of live production users

---

Most software built for factories has the same flaw. It is excellent at telling you what already happened and close to useless at telling you what to do next. Takorin is my attempt to design the opposite of that, and this is the story of how the research forced me to throw out the obvious version of the product before I built it.

## The dashboard nobody opens

Before I drew a single screen, I sat down with three plant directors, each running operations at one of the top four food manufacturers in the world. I went in expecting a feature wishlist. What I got was closer to a warning.

Not one of them opened the dashboard they already owned. One said it plainly: it tells me what happened, not what to do about it. (If you have ever bought enterprise software and then watched the team quietly go back to a spreadsheet, you know the feeling.) These are people running plants with thousands of staff and razor margins, and the most expensive system on their desk was the one they trusted least.

That is the problem I was actually being asked to solve. Not a missing chart. A missing decision.

## Why a bad shift costs so much

Food manufacturing runs on a single number called Overall Equipment Effectiveness. A few points of OEE on one line is the difference between a plant that prints money and one that barely clears. A single point is often six figures a year. So when a shift goes sideways, it is not a reporting inconvenience. It is real money walking out the door.

Here is what makes a bad shift so frustrating. It is almost never one dramatic failure. It is a few small signals, a late checklist here, a sensor drifting warm there, stacking up over two hours into a loss that looks obvious in hindsight at minute forty. By the time a supervisor notices, the window to do anything about it has already closed.

The maddening part is that the data to catch it already exists. Checklist completion, staffing qualifications, machine certifications, supplier paperwork, sensor readings. All of it is being recorded. It just sits in five separate systems that have never been introduced to each other, so the director ends up doing the correlation in her head, every shift, from memory and gut.

Two things make this urgent right now. A miss is asymmetric, because an unnecessary alert costs a few annoyed minutes while a missed signal costs a held batch or a recall. And FSMA 204, the new lot-level traceability rule, becomes a hard requirement in 2028 that big buyers are already using as a qualification gate. The plants know the clock is running.

## What the directors actually told me

I grounded the work in the industry's own thinking before I designed anything. The agentic AI writing from WEF, BCG, and IBM gave me the spine of the interaction model, the idea of a system that senses, ranks, acts, and learns, with a human approving anything that matters. A Food Industry Executive piece pushed me away from monitoring and toward intervention. Chao Yi's writing on data harmonization named the quiet killer of most factory AI, the same ingredient sitting under three different names across three systems, which became the basis for the trust layer. A Genuine Impact analysis of the supplier documentation gap shaped the compliance scorecard.

The interviews were where it got specific. Three findings came up independently, in almost the same words each time.

The first was that more dashboards were not wanted. Every director already had a Manufacturing Execution System, and none of them described it as the thing they open first.

The second was about fear, and it reshaped the whole product. The anxiety was never "what if the number is wrong." It was "what if it is confidently wrong, I act on it, and the shift fails anyway." Every one of them had been burned by software that demoed beautifully and was useless on the floor.

The third was about timing. They all described the same window: a supervisor walks into a running shift, spends the first hour catching up on partial information, and by the time she has the full picture, the controllable moment is gone. That finding became the spine of the product. The job was not reporting on the last shift. It was briefing the next one before it could go wrong.

## Why nobody had already built this

I mapped Takorin against the tools these plants already pay for, and the pattern was consistent. Every category does its own slice well and leaves the correlation, the part that actually takes judgment, on the human.

| Category | Examples | What it does | Where it stops |
|----------|----------|--------------|----------------|
| MES and OEE dashboards | AVEVA, Rockwell FactoryTalk, Siemens Opcenter, GE Proficy | Track downtime and OEE | Shows what happened, not the conditions that caused it |
| QMS and CAPA | MasterControl, ETQ Reliance | Record corrective actions for audit | Documents a case, never correlates it with production signals to catch the next one early |
| Supplier and traceability | TraceGains, FoodLogiQ, Trustwell | Track certificates and lot traceability | Siloed from shift-floor risk |
| Machine-health AI | Augury, Sight Machine, Uptake | Predict equipment failure | Blind to staffing, certification, and supplier risk |
| Integrated IIoT | Schneider EcoStruxure | Real-time OEE plus predictive maintenance | Strong where installed, but vendor-locked to its own machines |

None of them are bad. They are good at what they do. The gap is that not one of them owns the decision layer, and the decision layer is exactly what a director values most. That is Takorin's whole wedge. It sits across these systems and turns their separate outputs into one ranked call with a named precedent, a countdown, and a human approval step. No competitor surfaces data readiness as a score the user can see, and none ranks a quality signal against a supplier signal on the same screen.

## Where the opportunity actually is

The empty column in that table is also where the money is. Three forces are arriving at the same time. Agentic AI is finally mature enough to trust with a human approval step. FSMA 204 makes traceability a hard 2028 deadline. And the master operators whose judgment quietly runs these plants are retiring, taking decades of tacit knowledge with them. The WEF Lighthouse Network already proves the upside is real, with its lighthouse plants posting measurable OEE gains from exactly this kind of work. What is missing is a way to get there without a multi-year platform replacement.

The economics make the sale easy to reason about. Food manufacturing is a multi-trillion-dollar industry running on thin margins, and OEE is the lever. Because a point of OEE on one line is six figures a year, the subscription is a small fraction of the loss it prevents. Takorin does not need to be cheap. It needs to be a rounding error against the money it saves.

The motion follows from that. Land on one pilot line, prove the OEE gain against that line's own history, and use the proof to expand to the plant and then the network. The per-line return is the unit of the business case, and the plant director is the person who signs the expansion.

The part I like most is that the product gets harder to remove the longer it runs. Every shift that gets recorded, actioned, and resolved becomes a data point in that plant's own history, which makes the next recommendation more accurate and more credible. The data readiness score doubles as the retention tool, because it shows the customer, in their own language, the gap between the value they are getting today and the value sitting just behind a weekend of data cleanup. (I am framing this as a thesis, not booked pipeline. The market sizing is directional and would need real validation before it went anywhere near an investor.)

## The decision: subtract, then rank

Every team on the project wanted the same thing, which was to surface more of their data. More quality charts. More supply numbers. I came very close to building a beautifully thorough dashboard that answered every question except the one a director asks at 6:38am, which is just: what do I deal with first?

So I did the opposite of what the brief implied and started taking things off the screen. The front door became one ranked queue. Every signal shows up with a priority, an owner attached, and a clock running, all of it built from data the plant already had. I made it a standalone screen and the default landing view rather than a panel on the old home screen, because a panel competes with everything around it while a screen with nothing else on it makes the ranked list the only thing in the room.

That choice cost me something, and I logged it rather than hide it. In this version, items clear from the queue on acknowledgement with no audit trail. I cut the trail on purpose to protect the act-now feel of the first release, knowing a compliance-heavy customer will need it back later.

## The visual system was a constraint, not a mood board

I prototyped three directions. One was an instrument panel built on calibrated, attributable readings. One paced itself like a narrative, where when something happened mattered as much as what happened. One leaned on atmosphere and glow to signal urgency.

I picked the instrument panel, and the reason was not taste. This platform gets read by six different roles in one sitting, from a supervisor on a tablet to an auditor at a desk to an investor in a meeting, and only the instrument-panel logic stayed legible across all of them without anyone learning a new way to read a screen. The narrative direction implied more certainty than the data actually had, which is a dangerous thing to suggest to someone about to authorize an intervention. The atmospheric one looked great and proved nothing. I traded distinctiveness for legibility on purpose, because the people who act on this screen under pressure outrank the people who see it once in a deck.

## Staffing is a config value, not a UI fork

Plants run human-only crews, robotic lines, or a hybrid. By the third screen that needed to know which, I stopped writing the same conditional over and over and moved that state into one shared place that every screen reads. It cost more on the first feature than an inline check would have. It paid back immediately, because the next two screens plugged into the existing value without touching the original logic, and I later folded both of them into the shift view for the same reason. Good architecture is mostly the boring decision to not repeat yourself.

## What I actually built, and why

Twenty-two screens shipped in the prototype, but most of them exist to serve one of a handful of jobs the research pointed at. Here is what got built and the reasoning behind it.

**ShiftIQ, the intervention engine.** This is the screen the whole product is organized around, and it exists because of the interview finding about the first hour. It reads the risk signals at the start of a shift, ranks the findings by how much they will cost, and attaches two things a generic alert never has. The first is a named precedent from the plant's own past, because a director trusts a recommendation grounded in her own history far more than one grounded in a general model. The second is a countdown to the moment the window closes, because a finding without a deadline is just trivia. ShiftIQ also absorbed what used to be three separate screens for handoffs, robot fleets, and resource allocation, since all of them were really answering one question about who and what is ready for this shift.

**The trust stack: Data Readiness and visible confidence.** This is the direct answer to the fear every director named. A strip at the top of every screen shows the health of the data sources feeding the system, so nobody reads a recommendation without knowing how fresh the inputs are. Data Readiness goes deeper. It is the one screen in the product that is about the platform itself rather than the plant, and it scores how much of what Takorin says can be trusted. More to the point, it names the specific reasons confidence is low, the same ingredient sitting under three different names across the MES, the ERP, and the supplier portal, and it gives an honest effort estimate to fix each one. Most factory AI hides its uncertainty. This product points straight at it, because the directors told me that hiding it is precisely how trust dies.

**Agent Control, where the human stays in the loop.** Takorin behaves like an agent, not a report. Named agents watch their corner of the operation and propose actions, each carrying its reasoning, its target, and a confidence score. A person approves or overrides, and nothing consequential happens without that approval. The screen exists so the autonomy is legible. A director can see what the system did on its own and what it is still waiting on her to authorize. The confidence score is tuned per agent based on how costly a wrong call would be, which is why a recommendation about a compliance filing carries a higher bar than one about scheduling.

**CAPA Engine, where corrective actions actually correct.** Corrective action management in this industry is mostly a documentation exercise. A case opens, gets closed when someone remembers, and the same root cause comes back next quarter. I built the CAPA Engine to change what closed means. An evidence gate makes a case impossible to close without proof attached. Pattern analytics surface when several separate cases share one root cause, which is the thing a manual register never catches. And a benchmark layer shows a QA director her closure rate as a percentile against comparable plants, because the research said competitive context moves this buyer more than an absolute number ever will. It exists to make an FDA inspection a non-event rather than a quarterly emergency.

**SupplierIQ, the edge of the plant.** Every other module reads data generated inside the building. This one handles the risk that walks in from outside. It tracks certificate status against the production schedule, watches delivery ETAs, and runs a shelf-life optimizer that flags a lot about to expire before the run that needs it, while there is still time to reorder. It also carries a supplier compliance scorecard, which exists for two reasons. FSMA 204 is coming, and a score a supplier can see changes that supplier's behavior without anyone having to chase them.

**Knowledge Vault, against the retirement cliff.** The master operators who hold these plants together are retiring, and their judgment leaves with them. The Knowledge Vault captures that tacit expertise and rates the institutional risk of losing it. It exists because the most expensive thing a plant can lose is the person who knows why the oven runs warm on the gluten-free line, and nobody had a place to put that knowledge before it walked out the door.

**Impact Loop, the proof.** This screen closes the causal chain. A signal observed, a decision made, an operator confirming the action, and the measured outcome that followed. It exists because the whole business case depends on being able to say that a Takorin recommendation led to a real result rather than a coincidence. Without this loop, the impact claims are just telemetry with a narrative stapled on.

The remaining screens support these. Operator View gives the floor a role-scoped place to confirm interventions and log what they notice, which is what feeds the Impact Loop its ground truth. The domain screens carry the readings each specialist expects, including the statistical process control chart a quality engineer looks for first and the batch lifecycle a production lead lives in. Compliance and records hold the audit surface, security holds access, and a process hierarchy maps the plant the whole way down to the station. A notification center collects what cannot wait. Underneath all of it, two quiet decisions do real work. Worker mode lets one set of screens serve human, robotic, and hybrid plants, and a per-plant confidence calibration lets the agentic layer be tuned to each deployment instead of running a single universal number.

## How it actually got built

I directed a staged AI pipeline rather than freehanding screens one at a time. There was a stage that audited the existing system for the real gap, a stage that pressure-tested the approach before any pixels got drawn, a build pass, and then two critique passes run separately so visual polish could not quietly cover for functional debt.

My job in that loop was not writing prompts. It was deciding which findings were real debt and which were noise, and overriding the model when its first answer optimized for looking finished over being right. The clearest case: the second critique pass caught an operator view that had hardcoded one operator's name across every shift. The screen looked complete. A single combined review, satisfied by the polish, would most likely have waved it through. The two passes existed precisely so one of them was allowed to be unimpressed.

## What it produced

I report what exists, which is validated demand and review results, not deployment numbers.

The demand is not a guess. All three director interviews confirmed the core problem and rejected the obvious alternative of another dashboard. The product is anchored to that, not to an assumption I made at a desk.

The review held up. Two independent passes found 4 critical and 4 major issues. Every critical was fixed before sign-off. One major was logged as documented design debt rather than dropped silently, an operator workflow that takes three taps against a two-tap spec, deferred because the real fix needs a different input method. None of the issues either pass found reached a buyer demo.

The structural wins are easy to state. One ranked entry point replaced five unranked alert sources, with ownership and deadlines built in by construction. One visual grammar serves every role with no per-audience variant to maintain. A token-enforced design system holds all 22 screens to zero raw-value violations through a CI-ready audit. And the worker-mode decision let two later screens ship with no change to the original logic.

The OEE targets the product is built to move, the 5 to 15 percent gain on pilot lines and the drop in time between a risk and a response, are hypotheses to test in a pilot. I am not claiming them as results, because they are not results yet.

## What I still do not know

The decision I would most want a hiring panel to push on is the confidence model. The thresholds in the agentic layer were set by my judgment about how costly a wrong call would be for each agent, not by usage data, because there is no usage data yet. I genuinely do not know whether a real customer's risk tolerance calls for a simpler uniform threshold instead of the tuned version I shipped. I will find out when it is in front of someone whose job depends on the answer, and I would rather name that opening myself than have it found.

The thing I am proud of is unglamorous. The most valuable feature turned out to be the one that takes a decision off the user's plate, not the one that adds another chart. In a market racing to put more AI on the screen, the edge was the discipline to put less. The interviews are what gave me the standing to make that call, because when a director tells you to her face that she does not open the dashboard she already owns, building another one stops being a serious option.

What I am still watching is the gap between a prototype that reviews clean and a product that survives contact with a real plant's data, its regulators, and its operators. That gap is mapped honestly in the PRD, and I would rather walk a panel through it than pretend it is not there.
