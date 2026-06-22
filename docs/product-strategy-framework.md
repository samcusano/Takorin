# Takorin — Product Strategy Framework

### All Modules · Updated June 2026 (originally April 2026) · Working document for founder use

This is the April 2026 framework, carried forward and reconciled against the actual codebase as of June 2026. Modules 1–5 are the original five, lightly annotated where the build has moved past the spec. Modules 6–13 are new — the platform roughly tripled in surface area between April and June. Everything in a *Structured spec* section under a new module is grounded in what's actually built (data fields, tabs, thresholds cited directly from code); fields like **Hypothesis**, **Leap of faith assumption**, and **Current business goals** are judgment calls I've drafted from the product's own internal logic — treat them as a first pass for you to confirm or correct, not settled fact.

---

## Platform framing

Unchanged from April, and still the right frame: Takorin is an agent, not a dashboard. It senses, plans, acts (by surfacing interventions), and learns by anchoring to the plant's own history. The human stays in the loop by design.

One thing has changed enough to be worth stating explicitly: in April, "agentic" was a narrative claim. As of June, it's a literal, inspectable mechanism. There are now 11 named agents (`src/data/index.js`), each with a declared confidence threshold, a write-scope (`create-only`, `track-only`, `advisory`, or emergency-auto-act with an override window), and a tiered autonomy ladder — **Observe → Recommend → Execute → Govern** — that an agent only climbs by earning it (Govern tier requires 95% success and zero rollbacks over a trailing window). `AgentControl` and `PolicyBuilder` are where this lives, and they're now the single most important module in the platform to get right, because they're the proof surface for everything the Platform framing claims. See Module 7.

---

## Module 1 — ShiftIQ

*(April spec below is unchanged and still accurate. One structural update: HandoffIQ — described in the original Module 2 as a standalone destination — now lives as a tab inside ShiftIQ, not its own route. See Module 1 update note and the revised Module 2 framing.)*

**2026-06 update:** ShiftIQ now renders a "Handoff" tab (`activeTab === 'handoff'`) that loads `HandoffIQ.jsx` in place. At plants running `workerMode: 'robot'` or `'hybrid'` (Wichita, Denver), ShiftIQ also shows a Mode Bar indicating which worker configuration is active. The risk-score-and-intervention-window mechanics described below are unchanged.

### Narrative framing

ShiftIQ is the module where the platform's agentic character is most visible and most testable. It is the place where Takorin makes its strongest claim: that a machine, reading three signals simultaneously across a shift's first hour, can predict with greater reliability than a supervisor's intuition whether that shift is heading toward a loss — and can say so with enough specificity and time to change the outcome.

The job this module does is not monitoring. Monitoring is a feature of a dashboard. ShiftIQ is an intervention system. The difference is that monitoring surfaces a fact and expects the user to decide what it means. An intervention system surfaces a conclusion — "this shift is above the threshold" — and a specific ranked action — "complete startup checklists on Oven B, precedent April 2nd, 28 minutes remaining." The user's role is authorization, not analysis.

### Structured spec

**Customer job to be done**
When I am a supervisor walking into a shift that is already running, I need to know within the first fifteen minutes whether this shift is heading toward a loss — and what specific action will change that — so I can intervene before the intervention window closes.

**Problem statement**
Shift losses in food manufacturing are almost never caused by a single catastrophic failure. They are caused by three or four mild signals compounding over two hours into an outcome that was visible in retrospect at minute forty. The data to catch this exists — checklist completion rates, qualified staffing ratios, machine certification status — but it lives in three separate systems, none of which correlates it into a single risk signal with historical precedent attached.

**Most accessible alternatives**
The supervisor's own experience and intuition. A morning ops meeting reviewing the previous shift's numbers after the fact. A MES dashboard showing downtime but not the conditions that caused it. None of these operate predictively.

**Metrics this product is meant to move**
OEE on pilot lines (target: 5–15% improvement within 90 days). Percentage of shifts ending above the intervention threshold where a Takorin recommendation was actioned. Average time between risk escalation and supervisor response. Reduction in shift-level OEE variance.

**Current business goals this product facilitates**
Justifying the platform subscription by showing a direct line between Takorin recommendations and OEE improvement. Generating the historical precedent library (now formalized as **KnowledgeVault**, see Module 13's frozen-foods analog isn't built yet — precedent for ShiftIQ currently lives in `shiftData.findings[].evidence`, not yet unified with KnowledgeVault's taxonomy). Building the institutional case for expanding from one line to the whole plant.

**Hypothesis this design is attempting to confirm or refute**
That a supervisor, given two or three specific interventions with a named historical precedent and a visible countdown window, will act at a meaningfully higher rate than on a generic OEE alert.

**Leap of faith assumption**
That supervisors trust a recommendation more when it is grounded in their own plant's history than a general model. This is the platform's central leap of faith — see the Cross-module notes.

**What onboarding set the user up to expect**
That the first ShiftIQ finding will be recognizable against a real historical shift from their own plant.

**How it went from zero state to this**
Zero state: no baselines, risk score suppressed. Day 1–14: signals flow, baselines build, no recommendations yet. Day 14–30: first early-confidence recommendations. Day 30+: confidence rises with the precedent library.

**What we already know about the user**
The supervisor is not a data person, has run shifts for 3–15 years, and her primary anxiety is not that Takorin will be wrong but that it will be *confidently* wrong and she'll act on it anyway. Every design decision here is a response to that fear.

**Agentic framing**
Sense: read three signal sources continuously. Plan: correlate, rank, identify the intervention window. Act: surface with a countdown. Learn: record the outcome and weight future recommendations — this loop is now closed and auditable in **Impact Loop** (Module 9), which didn't exist when this module was first specced.

---

## Module 2 — HandoffIQ

**2026-06 update — read this before the rest of this section.** HandoffIQ is no longer a standalone destination. The `/handoff` route now redirects into `/shift`, and `HandoffIQ.jsx` renders as a tab inside ShiftIQ. The job-to-be-done below is still accurate — it still generates an automated briefing for the incoming supervisor (what happened, current status, to-dos, what to watch), and the incoming supervisor still must acknowledge carry-forward items before the shift starts. What's new: at hybrid/robot-mode plants, a fifth section — "Fleet at handoff" — appears, listing robot faults and units due for maintenance within 24 hours. The CAPA-driven Workforce Development Intelligence framing from the original narrative is not yet built; certification/workforce data now lives mostly in **OperatorView** (Module 10).

The practical effect of the demotion from standalone module to tab: HandoffIQ is no longer competing for a place in the navigation, which removes the original module's implicit bet that handoff deserved its own habit-forming destination. That bet has effectively been resolved — the team decided the briefing belongs inside the shift workflow it's bridging, not beside it. Worth confirming that was a deliberate call and not just where it landed.

*(Original narrative and structured spec preserved below — the underlying JTBD is unchanged.)*

### Narrative framing

HandoffIQ solves a problem that every food manufacturing plant has and almost none has articulated clearly: the moment between shifts is where institutional knowledge evaporates. The product's job is to eliminate that knowledge gap structurally — not by asking supervisors to document more, but by doing the documentation for them from signals Takorin is already reading.

### Structured spec

**Customer job to be done**
When I am an incoming supervisor beginning a shift, I need a complete picture of the current state of the line in under five minutes, so I can run the line from the first moment rather than spending the first hour catching up.

**Problem statement**
The shift handoff is the most information-dense moment in a manufacturing day and the one with the least structured support.

**Most accessible alternatives**
A verbal handoff (no record), a paper logbook (incomplete), a MES shift report (documents the past, doesn't brief the future).

**Metrics this product is meant to move**
Handoff sign-off completion rate. First-hour OEE losses on briefed vs. unbriefed shifts. Certification mismatch rate at station assignment.

**Current business goals this product facilitates**
Reducing ShiftIQ's risk score at shift start by ensuring better incoming information. Generating the structured record that feeds ShiftIQ's precedent library.

**Hypothesis this design is attempting to confirm or refute**
That an auto-generated briefing requiring no extra supervisor input will be read and acted on at a higher rate than a manual document.

**Leap of faith assumption**
That the auto-generated document is accurate enough that supervisors trust it without verifying manually by calling the outgoing supervisor anyway.

**What we already know about the user**
The incoming supervisor is time-pressured and reading this on a tablet while the shift is already starting. The document must be scannable in ninety seconds.

---

## Module 3 — SupplierIQ

*(Unchanged from April — still accurate against the code.)*

**2026-06 cross-reference:** the "revenue at risk" / chargeback exposure figure now surfaced prominently in **PlantOverview** (Module 6) and partially echoed in **ValueChain** (Module 12) is computed directly from SupplierIQ's `chargebackExposure` field on urgent lots. These three surfaces are not yet a unified system — ValueChain currently filters SupplierIQ's data manually rather than through a shared model — which is fine for now but worth knowing before promising a customer a single "exposure" number that updates everywhere automatically.

### Narrative framing

SupplierIQ is the module that lives at the boundary between the plant and the outside world. The Shelf Life Optimizer takes it from a compliance tracking tool to an active production planning instrument. The Supplier Compliance Scorecard turns it from a buyer-only tool into a two-sided platform.

### Structured spec

**Customer job to be done**
When I am a compliance manager reviewing the next 72 hours of production, I need to know every ingredient lot has a verified COA, will arrive on time, and won't expire before the production window closes.

**Problem statement**
Supplier compliance is managed reactively — the COA is missing, the ingredient is delayed, the lot expires, each only discovered after it's already a problem.

**Most accessible alternatives**
A compliance spreadsheet, phone calls chasing documents, a MES schedule with no input-readiness visibility.

**Metrics this product is meant to move**
% of runs started with a verified COA for all ingredients. Batches started on an expired lot (target zero). COA submission lead time. Supplier tier distribution.

**Current business goals this product facilitates**
FSMA 204 compliance readiness. Recall simulation readiness. Supplier negotiation leverage.

**Leap of faith assumption**
That suppliers engage with the Compliance Scorecard portal rather than ignoring it as another compliance burden.

**What we already know about the user**
The compliance manager is the highest-anxiety user in the platform. She'd rather have a false positive than miss a real gap.

---

## Module 4 — CAPA Engine

*(Substantially unchanged. Two points of drift worth flagging.)*

**2026-06 update:** the root-cause pattern data (`patternRows`) and the industry-benchmark percentile (`benchmarks`, e.g. "CAPA on-time closure · rank 44/100 · 78% · below median") both exist in the data layer exactly as specced, but neither is rendered as the heatmap/comparison-layer the April narrative describes — they show as plain stat cards today. The operational center of gravity has also shifted slightly: CAPA Engine is now clearly **case-closure and evidence**, while a new sibling module, **CompliancePolicy** (Module 12), owns "is the plant audit-ready" and "is this lot legally shippable." That division of labor is clean and worth keeping — don't merge them back together.

### Narrative framing

The CAPA Engine is where Takorin's intelligence compounds. Every other module generates events; CAPA Engine is where those events become cases, cases become patterns, and patterns become structural improvements.

### Structured spec

**Customer job to be done**
When I am a QA Director reviewing the corrective action register, I need to know which cases are overdue, which root causes are recurring, and which are connected to patterns I can address structurally.

**Problem statement**
CAPA management is predominantly a documentation exercise; "corrective" is frequently nominal because the same root cause recurs.

**Most accessible alternatives**
MasterControl, ETQ, or a QMS module — mature, but documentation systems that don't correlate CAPA data with live production signals.

**Metrics this product is meant to move**
CAPA on-time closure rate (currently 44th percentile, target top quartile). % of closed CAPAs with verified evidence (target 100%, evidence-gated). Recurring root-cause rate.

**Current business goals this product facilitates**
FDA inspection readiness. FSMA 204 traceability evidence. Continuous-improvement compounding back into ShiftIQ's risk model.

**Leap of faith assumption**
That the anonymized benchmark pool is statistically meaningful enough to be credible — requires a minimum peer density in a specific production category, or the benchmark means nothing.

**What we already know about the user**
The QA Director is the most risk-aware person in the building, has high tolerance for information density, and will use all of it.

---

## Module 5 — Data Readiness Score

*(Unchanged. Still the meta-layer that governs trust in everything else.)*

**2026-06 cross-reference:** `IntegrationHub.jsx` is now embedded as the "Integrations" tab inside Data Readiness (rendered with its SceneHeader suppressed), rather than existing as its own destination — same pattern as HandoffIQ folding into ShiftIQ.

### Narrative framing

The Data Readiness Score is the only module explicitly about the platform itself. It makes the invisible "Tower of Babel" data-coherence problem visible — three systems calling the same ingredient three different names — without which an agentic system senses incorrectly and acts on wrong conclusions with high confidence.

### Structured spec

**Customer job to be done**
When I am a Plant Director who has just deployed Takorin, I need to understand how much of what the platform tells me I can trust, and what specific actions raise that trust.

**Problem statement**
Every AI system reads data that was designed to be read by humans with tacit context the AI doesn't have, producing systematically wrong, high-confidence inferences.

**Metrics this product is meant to move**
Overall readiness score (55–70 at onboarding → 90+). Active naming conflicts (→ zero). ShiftIQ risk-score confidence as a direct downstream output.

**Leap of faith assumption**
That the resolution steps are within the plant's own capacity to execute without an IT project — the design must distinguish what plant ops can fix from what genuinely needs IT, and be honest about which is which.

**What we already know about the user**
The Plant Director reads this rarely and wants operational language, not data-science language.

---

## Module 6 — Command Surface (PlantOverview + Network)

### Narrative framing

This is the module the original April document was conceptually missing entirely — and it's now the platform's default landing screen. Every other module answers "what's happening in this one place." Command Surface answers the question a director actually opens the app asking: *what do I look at first, across everything, right now?* It synthesizes line-level risk, supplier alerts, agent decisions, and (via the Network tab) cross-plant supply correlations into a single ranked queue. It does not add new signals — design-state.md is explicit about this principle — it ranks and routes the signals every other module already produces.

The Network tab extends the same trust logic across plant boundaries: it surfaces AI-detected cross-plant patterns ("ConAgra delivery delays → Line 4 scrap spikes," shown with a confidence percentage) and lets a director hold or notify across multiple plants sharing an exposure in one action.

### Structured spec

**Customer job to be done**
When I am a plant director opening the app at the start of my day, I need one ranked view of every line, every pending decision, and every cross-plant exposure — so I know what needs my attention before I look at anything else.

**Problem statement**
Without this screen, knowing where to look first required either walking the floor, attending a morning huddle, or opening every individual module (ShiftIQ, SupplierIQ, CAPA) one at a time — none of which surfaces a single prioritized, owned, time-boxed list.

**Most accessible alternatives**
The morning ops huddle. Manually checking each line's ShiftIQ tab. A plant manager's own mental model of "which line is usually trouble."

**Metrics this product is meant to move**
Time from app open to first action taken. % of the Shift Briefing queue actioned before its time window closes. Number of lines a director actually opens per session (should trend toward "only the ones that need it," not all of them).

**Current business goals this product facilitates**
Makes Takorin the literal first thing a director sees — the home-screen habit that justifies daily, not occasional, use. The Network tab is the seed of a multi-plant upsell: a director managing one plant sees value others don't get until they're managing a network.

**Hypothesis this design is attempting to confirm or refute**
That a ranked, owned, time-boxed queue (the Shift Briefing rail) drives faster action than a flat grid of line tiles a director has to scan and prioritize herself.

**Leap of faith assumption**
That a director trusts an aggregated, multi-line risk synthesis enough to triage by it, rather than falling back to opening every line individually "just to be sure" — the same trust leap as ShiftIQ, one level up in scope.

**What onboarding set the user up to expect**
That her own real lines, supervisors, and SKUs will be ranked in an order that matches — or correctly overrides — her own morning intuition about which line needs her first.

**How it went from zero state to this**
This module has no independent zero state — its value is entirely downstream of ShiftIQ, SupplierIQ, and CAPA already having data. It's a synthesis layer, so its value timeline is bounded by whichever upstream module is slowest to reach readiness.

**What we already know about the user**
Same Plant Director persona as Module 5 — low tolerance for noise, wants "what do I act on" not "here's everything."

**Agentic framing**
This is the clearest expression of the **Plan** stage at multi-line scope: it doesn't sense or act independently, it correlates what other modules already sensed and routes the result.

---

## Module 7 — Agent Control & Policy

### Narrative framing

This module didn't exist as a director-facing surface in April; agent confidence thresholds were hardcoded in `agentConfigData.confidenceMethodology`, invisible to anyone outside engineering. It now exists as two tightly linked screens: **AgentControl**, the action ledger and audit trail for everything the agent layer does, and **PolicyBuilder**, the director-editable rule editor that decides when each agent is allowed to act.

This is the most strategically important module in the platform, full stop. The Platform framing's claim — "the human remains in the loop by design" — was, in April, a sentence in a strategy document. It is now a literal mechanism: 11 named agents, each with a declared write-scope (`create-only`, `track-only`, `advisory`, or emergency-auto-act with a 15-minute override window), a confidence threshold, and a tiered autonomy ladder that has to be earned — Observe, Recommend, Execute, Govern — with Govern requiring a trailing 95% success rate and zero rollbacks. PolicyBuilder turns the abstract "trust architecture" the April cross-module notes described into something a director can see backtested (fire count, false-action count, a plain-language impact note) before deciding to promote a rule from Shadow to Live.

The agent roster has also grown past the original eight (Pre-Shift Verification, Compliance Monitor, Supplier Intelligence, Resource Allocation, Predictive Maintenance, Handoff Synthesis, Risk Escalation, CAPA Closure) to eleven, adding **Data Quality Guardian** (blocks dependent agents when a source goes stale), **Supply Continuity** (shelf-life-vs-transit-time monitoring), and **Replenishment & Inventory** (cross-plant safety-stock rebalancing, proposal-only).

### Structured spec

**Customer job to be done**
When I am a plant director responsible for what an autonomous agent is allowed to do, I need to see exactly what each agent senses, what it's allowed to act on, proof of how reliably it's performed by autonomy tier, and the ability to tighten or loosen its mandate myself with confidence it won't fire blind.

**Problem statement**
As the number of autonomous agents on a floor grows past a handful, "we have AI watching the floor" stops being a credible claim — to a director, a security team, or an auditor — without one place that answers: which agent, under what threshold, has done what, and what happened when it acted.

**Most accessible alternatives**
The alternative to this module is, literally, last quarter's Takorin: thresholds buried in `agentConfigData.confidenceMethodology`, invisible and uneditable outside a code change. No competing CMMS/QMS product exposes agent autonomy as a director-editable, backtested policy layer.

**Metrics this product is meant to move**
Tier mix over time (% of actions at Observe vs. Recommend vs. Execute vs. Govern). Override rate. Escalation rate. Rollback rate. Approval dwell time on high/critical actions. Number of agents that have earned Govern-tier eligibility.

**Current business goals this product facilitates**
This is the proof surface for the entire "agent, not dashboard" platform claim, and it's also exactly what a buyer's security or compliance team will ask to see before approving expanded autonomy — the write-scope limits, the corroboration requirements, the 5-second compliance-action delay, and the rationale-acknowledgment dwell timer are all answers to a real procurement objection, not UI flourish.

**Hypothesis this design is attempting to confirm or refute**
That directors will expand agent autonomy (promote a policy from Shadow to Live, raise a threshold) at a meaningfully higher rate when shown backtested fire/false-action counts first, versus being asked to simply trust the model.

**Leap of faith assumption**
That the backtest numbers in the Live-Impact panel are themselves trusted. This is the same leap as ShiftIQ's precedent citation, one layer up — now it's not a single finding being trusted, it's a policy's entire track record.

**What onboarding set the user up to expect**
The first trust event here isn't a finding — it's watching one's own agent graduate from Observe to Recommend tier after a clean track record. That promotion, visible in the History tab, is the onboarding moment.

**How it went from zero state to this**
Every agent starts at Observe (log only, no recommendation surfaced). Day 14–30: first Recommend-tier promotions as a track record accumulates. Govern tier requires a 95%-success, zero-rollback trailing window — this is realistically a multi-month curve for any single agent, the slowest trust ramp in the platform, because the stakes of real autonomy are categorically higher than a single recommendation being right or wrong.

**What we already know about the user**
The director's fear here isn't "will this one finding be wrong" — it's "will I lose the ability to stop an agent before it's too late." The override window, the rationale-required override log, and the explicit irreversibility flags (Resource Allocation's 15-minute window after an emergency auto-act) are trust signals aimed at exactly that fear, the same way ShiftIQ's confidence percentage was aimed at the supervisor's fear of being confidently misled.

**Agentic framing**
This module doesn't run its own sense-plan-act-learn loop. It's the governance layer that makes every *other* module's loop legible, auditable, and revocable. It is the single most direct, literal implementation of "the human remains in the loop by design."

**Known cleanup item:** `ExecutionAuthority.jsx` is dead code — its autonomy-tier and execution-log UI was absorbed into AgentControl's History tab, but the file is still in the repo and unimported. Safe to delete.

---

## Module 8 — QualityIQ

### Narrative framing

QualityIQ is real-time defect monitoring with one structural decision that distinguishes it from a standard vision-inspection dashboard: instead of one blended "accuracy" number, it decomposes AI inspection performance by SKU and by defect type, runs it explicitly against a human baseline (currently 98.4% AI vs. 79% human), and gives genuinely novel — out-of-distribution — defects an escalation path to a human reviewer rather than silently passing or silently auto-learning from them.

### Structured spec

**Customer job to be done**
When I am a line supervisor or QA manager, I need to know in real time whether a line's defect rate is drifting, whether the vision system's confidence on the current SKU is high enough to rely on, and what to do with the rare defect the model has never seen before.

**Problem statement**
Most inline vision-inspection systems present a single accuracy number with no decomposition by SKU or defect type, and no structured path for a genuinely novel defect to reach a human before it's silently passed or silently folded into model retraining.

**Most accessible alternatives**
A fixed pass/fail vision light with no further context. Manual spot-check sampling. A defect log reviewed at shift end, after the run that produced it is already done.

**Metrics this product is meant to move**
Defect escape rate (this is the single largest line item in Impact Loop's ROI calculation — $142K/yr in current data). AI-vs-human accuracy gap by SKU and defect type. Novel-event disposition turnaround time. Auto-CAPA trigger rate (currently armed at 1.0% sustained over 15 minutes).

**Current business goals this product facilitates**
Defensibility — when a customer or auditor asks how Takorin knows its inspection AI is reliable, the Accuracy Detail tab's per-SKU, per-defect-type breakdown (including an honest "where humans still lead" section) is the literal answer. It also directly feeds both CAPA (auto-trigger) and Impact Loop (defect escape rate).

**Hypothesis this design is attempting to confirm or refute**
That showing a supervisor the specific defect-type and per-SKU breakdown — instead of one blended accuracy figure — increases trust enough that she stops manually re-checking units the system already passed.

**Leap of faith assumption**
That novel-event escalation is rare enough not to create alert fatigue, but real enough that a QA manager actually engages with disposition rather than rubber-stamping it.

**What we already know about the user**
Two distinct users: the line supervisor (cares about real-time defect rate, on the floor) and the QA manager (cares about accuracy defensibility, will read the full breakdown at a desk).

---

## Module 9 — Impact Loop

### Narrative framing

Impact Loop is the module that closes the "Learn" stage the original Module 1 narrative described as aspirational — "record whether the action was taken, what the OEE outcome was, and weight that outcome in future recommendations." That sentence is now a real screen. Every intervention card traces a full chain: which agent recommended it, what signals it was based on, who approved it and how long they spent reviewing, what was done, what changed (before/after, with a confidence-weighted attribution, not an overstated one), and — where applicable — an operator's floor confirmation that the fix actually held.

### Structured spec

**Customer job to be done**
When I am a director or finance stakeholder, I need to see, in dollars, whether the platform paid for itself — and trace specific recommendations to specific measured outcomes, not just a platform-level number I have to take on faith.

**Problem statement**
AI platforms routinely make ROI claims at the platform level without connecting any single recommendation to a measured outcome, which turns the number into an act of faith a skeptical buyer has no way to audit.

**Most accessible alternatives**
A sales-deck ROI estimate calculated once and never revisited. A generic "OEE improved X%" claim with no causal chain back to specific interventions.

**Metrics this product is meant to move**
Year 1 ROI % (293% / $730K net on $249K cost in current data). Per-metric annualized value across 7 tracked categories. Adoption rate by finding type — currently cert-compliance recommendations are accepted 88% of the time vs. predictive-maintenance at 24%. Attribution confidence per metric, shown explicitly, not overstated (82–84% range).

**Current business goals this product facilitates**
The literal artifact a director uses to defend subscription renewal and to make the case for expanding from one line to a whole network. It's also what makes the platform's "learn" stage auditable rather than asserted.

**Hypothesis this design is attempting to confirm or refute**
That the adoption-rate gap between trusted finding types (cert compliance, 88%) and distrusted ones (predictive maintenance, 24%) tells the product team exactly which *agent* needs a trust intervention — better evidence, clearer rationale — rather than just which agent is "underperforming."

**Leap of faith assumption**
That an honestly-hedged attribution confidence (e.g., "82% attributable to Takorin") makes the 293% headline more credible to a skeptical CFO, not less — the bet is that visible uncertainty reads as rigor, not weakness.

**What onboarding set the user up to expect**
The first intervention a director traces end-to-end — recommendation, dwell time, action, measured before/after, operator floor confirmation — is the moment this screen converts from "another tab" to "the proof."

**How it went from zero state to this**
This module's value depends on CAPA, ShiftIQ, and QualityIQ findings having accumulated enough acted-on history to compute real before/after deltas. It has the longest zero-to-value timeline of any module, gated entirely by upstream modules.

**What we already know about the user**
A director reading this screen in front of someone above her — a regional VP, a CFO. The bar is "defensible under questioning," not "impressive at a glance."

---

## Module 10 — Operator View & Notification Center

### Narrative framing

Where HandoffIQ briefs the incoming supervisor, OperatorView does the equivalent job one level down — for the individual operator standing at a station. It's the least-served layer in most plant software: floor-level context (what changed since my last shift, what my certification allows today, what I'm specifically supposed to watch for) usually arrives verbally and incompletely from whoever's leaving. A director can also step into any operator's view in simulation mode, which doubles as a way to verify that what the agent layer is approving matches what the floor actually experiences.

Notification Center is smaller but enforces the same trust-architecture discipline as everywhere else in the platform: even in a passive activity feed, AI-derived signals are shown with a visible confidence percentage, never hidden behind a flat alert.

### Structured spec

**Customer job to be done**
When I am an operator starting my shift, I need to see what changed since I was last at this station, what my certification allows me to do today, and what tasks — mine and AI-suggested — need to happen, without asking my supervisor to explain context I should already have.

**Problem statement**
Floor-level information is the least-served layer of most plant software, which is built for supervisors and directors. Operators get context verbally, often incompletely, from the person they're replacing.

**Most accessible alternatives**
A verbal pass-down from the outgoing operator (the same gap HandoffIQ solves at the supervisor level, unaddressed here). A paper task list with no situational context.

**Metrics this product is meant to move**
Time-to-productive-start at shift change. AI-linked task confirmation rate. Certification progression rate. Fatigue/rest threshold breach rate — explicitly scoped in the UI as "for scheduling only, not performance review," a boundary worth keeping firm.

**Current business goals this product facilitates**
Reduces the same first-hour risk window ShiftIQ targets, but from the operator's vantage point. The "Automation transition readiness" tab is also the retention hook for hybrid/robot-mode plants — it shows a director which operators are ready to supervise automation, not just run a station.

**Hypothesis this design is attempting to confirm or refute**
That an operator who sees a specific, named hint tied to their actual situation ("Covering above cert level") follows it at a higher rate than a generic safety reminder — the same specificity-converts hypothesis as ShiftIQ, one level down.

**Leap of faith assumption**
That operators actually read a briefing at shift start rather than skipping to the task list — the same adoption risk HandoffIQ accepted for supervisors, now extended to a user with even less patience.

**What we already know about the user**
The operator is on the floor with a tablet, less patient than the incoming supervisor HandoffIQ was designed for. The UI has to be faster to parse, not just complete.

---

## Module 11 — Equipment & Robotic Operations

*(EquipmentIntelligence, with RobotFleet and ResourceAllocation as its fleet and allocation tabs.)*

### Narrative framing

This module is the floor-level proof that the platform's value extends to hybrid and fully-robotic plants (Wichita = robot, Denver = hybrid), not just human-staffed lines. It merges two concerns that are usually separate systems: equipment health (remaining useful life, statistical process control, maintenance windows) and task coverage (who or what covers a station if a robot or a human goes down). One important gap to know about: a "Resource Allocation" agent is defined in AgentControl's roster, but the actual Reallocate button in this module is fully manual today — there's no AI proposing reallocations yet, only a consequence-preview modal once a human initiates one. That's a real discrepancy between what the agent layer claims to do and what this screen actually does; worth resolving or at least not promising past.

### Structured spec

**Customer job to be done**
When I am a director at a robot or hybrid plant, I need to know which equipment or robot units are degrading before they fail, what their real remaining useful life is, and who or what covers every task if a unit — mechanical or human — goes down, so a single failure doesn't become a missed shift.

**Problem statement**
Equipment health monitoring and workforce/robot task coverage have historically been separate systems — a CMMS for one, a staffing spreadsheet for the other — with no shared view of where a single point of failure creates a real coverage gap.

**Most accessible alternatives**
A CMMS dashboard with no link to who covers the task if equipment fails. A staffing spreadsheet with no link to equipment RUL.

**Metrics this product is meant to move**
Unplanned downtime hours/week (already a top Impact Loop line item at $511.7K/yr). RUL prediction accuracy. Redundancy coverage rate — % of tasks with both a human and a robot fallback. Repeated same-operator/same-robot override incidents.

**Current business goals this product facilitates**
Direct proof, at the floor level, that the platform generalizes across worker configurations — supports expansion across plants with different human/robot mixes.

**Hypothesis this design is attempting to confirm or refute**
That a redundancy map with single-point-of-failure rows highlighted will change reallocation behavior before a gap becomes a real outage — the same specificity-converts logic as ShiftIQ, applied to equipment and labor coverage instead of shift risk.

**Leap of faith assumption**
That a fully manual reallocation flow is acceptable for now — but if directors come to expect the "Resource Allocation" agent already defined elsewhere in the platform to propose reallocations automatically, finding this screen still entirely manual will read as a broken promise, not a roadmap item.

**What we already know about the user**
Same Plant Director/Supervisor persona as elsewhere, but specifically at robot/hybrid plants — a newer, smaller segment than the human-only plants the rest of the platform was built around first.

---

## Module 12 — Compliance & Traceability

*(CompliancePolicy, with RecordVault as its traceability tab. Distinct from, and complementary to, Module 4's CAPA Engine.)*

### Narrative framing

CAPA Engine answers "did we close this case correctly." Compliance & Traceability answers two different questions: "is the plant ready for an inspection today, across every regulatory framework we're subject to (FDA, China GB, EU IFS, ISO 22000)," and "can this specific lot legally ship." The AuditSimPanel's Defensibility Score is a literal simulated-inspection result — pass/fail/at-risk counts a QA director could put in front of her own boss before a real audit. RecordVault is the lot-level FSMA 204 mechanism underneath it: every Critical Tracking Event and Key Data Element for a lot, scored on whether the chain is complete enough to be submittable, with cross-plant hold coordination so a recall's actual blast radius is visible before it's declared.

### Structured spec

**Customer job to be done**
When I am a compliance manager or QA director with an audit on the calendar, I need to know exactly which findings would fail an inspection today, what dollar exposure each one carries, and whether every lot in production has a complete, submittable FSMA 204 chain.

**Problem statement**
Audit prep is a quarterly fire drill because framework compliance status, CAPA case status, and lot traceability live in separate systems nobody correlates until an inspector is already on site.

**Most accessible alternatives**
A manual audit-prep binder assembled in the weeks before a known inspection. A QMS module that tracks policy text but not live evidence. Spreadsheet tracking of FSMA 204 key data elements.

**Metrics this product is meant to move**
Defensibility Score (pass/fail/at-risk across frameworks). Number of lots with incomplete FSMA 204 chains. Unresolved accountability-register findings vs. days to next inspection. Cross-plant recall blast-radius visibility.

**Current business goals this product facilitates**
Turns "FDA inspection readiness" from an aspiration in the CAPA module into a literal simulated-inspection surface.

**Hypothesis this design is attempting to confirm or refute**
That showing a compliance manager the *specific* naming conflict blocking a lot's traceability (e.g., "TS-8811 naming conflict across MES, ERP, supplier portal") drives faster resolution than a generic "traceability incomplete" flag — the same specificity-converts hypothesis as Data Readiness, applied to one regulatory framework.

**Leap of faith assumption**
That compliance managers trust the Defensibility Score enough to walk into a real inspection citing it, rather than independently re-verifying everything by hand — if they re-verify anyway, the module hasn't actually prevented the fire drill it claims to.

**What we already know about the user**
Same high-anxiety profile as SupplierIQ's user — would rather see ten false "at-risk" flags than miss one real audit-failing gap.

**Division of labor (important — don't re-merge):** CAPA Engine closes cases and proves the corrective action. Compliance & Traceability asks whether the plant is inspection-ready and whether a specific lot can legally ship. Same underlying data, genuinely different questions.

---

## Module 13 — Process Intelligence (illustrative second vertical: craft fermentation)

*(BatchIntelligence, ProcessHierarchy, and KnowledgeVault. Framed deliberately as a second, less mature vertical demonstrating the platform's range — see note below.)*

### Narrative framing

Every other module in this document is built around the same fictional company: a US frozen-entrée manufacturer running plants in Salina, Wichita, and Denver. These three modules are not — they're built around "GF-01 Gaoming Factory," a Chinese soy-sauce and fermented-condiment plant (koji, benzaldehyde, master blenders, Heilongjiang vs. Shandong soybean variance). That's a deliberate choice to show the platform generalizes past one food category, and it's a genuinely interesting bet: a craft fermentation process is about as far from a CPG frozen-food line as food manufacturing gets, and the platform's core claims — sense, plan, act, learn, with a human in the loop — still hold up there.

It's also, by a wide margin, the platform's most ambitious and riskiest claim. The other modules digitize signals that are already mechanical and legible — vibration, temperature, checklist completion. KnowledgeVault is trying to digitize something categorically harder: a master blender's *taste*, encoded as a structured, confidence-scored, searchable rule ("benzaldehyde decline... held only by Chen Wei and partially by Liu Fang. Departure would leave a gap"). ProcessHierarchy then runs causal-chain reasoning over that encoded judgment to forecast propagation across zones, weeks ahead of a final grade outcome. BatchIntelligence tracks the resulting batch-level quality trajectory day to day.

Worth flagging plainly: this vertical doesn't yet have a brief the way Command Surface does (`docs/2026-04-29-command-surface.md`). "GF-01 Gaoming Factory" exists only as a placeholder inside the code, with no named company, no stated production volume, no defined relationship to the Salina/Wichita/Denver world (same parent company? a different customer entirely? a sales-demo concept for a different market?). If this vertical is going to keep growing, it deserves the same founder-level brief the first one got.

### Structured spec

**Customer job to be done**
When I am a master blender or fermentation operations lead, I need to see, at the vessel and zone level, which batches are drifting from craft-quality outcomes — and why — early enough in a multi-month fermentation cycle to intervene, because by the time a deviation shows up in the final grade, months of production and ingredient cost are already sunk.

**Problem statement**
Fermentation quality depends on tacit expert judgment that is even less observable in raw sensor data than a mechanical line's signals, and the people who hold that judgment are aging out of the workforce faster than it's being captured.

**Most accessible alternatives**
The master blender's senses and a personal notebook. Lab sampling at fixed checkpoints, too sparse to catch early drift. No structured way to capture *why* a blender intervened, so the reasoning leaves with them.

**Metrics this product is meant to move**
% of batches reaching Premium vs. Standard grade. Institutional-risk-rated knowledge entries successfully captured before a key expert's departure. Propagation-forecast accuracy (did the predicted zone-to-zone effect actually occur). Query-to-resolution time during an active deviation.

**Current business goals this product facilitates**
KnowledgeVault is trying to capture tacit expert knowledge as structured, provenance-tracked precedent before it's lost to attrition — a genuinely different problem from anything the frozen-foods modules solve, and worth treating as its own product bet rather than a feature of the existing platform.

**Hypothesis this design is attempting to confirm or refute**
Whether institutional judgment, encoded as data with provenance and an evidence base shown, earns the same trust from a working expert as a living colleague's advice would.

**Leap of faith assumption**
This is the single highest leap-of-faith assumption in the entire platform: that craft judgment — taste, smell, "this batch feels early" — can be encoded into thresholds and rules at all without losing the thing that made the expert valuable. If master blenders reject the encoded rules as "not how it actually works," this module fails in a way the more mechanically legible modules wouldn't.

**What onboarding set the user up to expect**
The moment a fermentation lead sees her own departed colleague's actual judgment correctly encoded and cited with provenance — recognizing a real, specific, nearly-lost piece of institutional memory now searchable.

**How it went from zero state to this**
Likely the slowest zero-to-value curve in the platform. Capturing enough validated craft-threshold and grade-rule entries requires sustained participation from senior experts who are, by definition, busy and scarce.

**What we already know about the user**
A master blender who trusts their own senses more than any sensor, with decades of tenure, and who will be the most skeptical user in the platform of any rule claiming to encode what they know — a harder trust problem than even ShiftIQ's supervisor anxiety, because this user's professional identity is built on being irreplaceable.

---

## Cross-module notes

Updated from April. Three things that cut across all modules.

**The trust architecture, now mechanized.** Every module's leap of faith assumption is some version of: the user must trust the recommendation enough to act on it. In April this was a design principle. In June it's also a literal mechanism — AgentControl's tiered autonomy ladder (Observe → Recommend → Execute → Govern) and PolicyBuilder's backtested, director-editable thresholds are the trust architecture made concrete and graduated rather than all-or-nothing. The original rule still holds and now applies one level up: any decision that degrades the transparency of confidence levels, threshold logic, or autonomy tier undermines the entire platform, not just one module.

**The agentic loop is no longer aspirational.** Eleven named agents exist, each with a declared write-scope and confidence threshold. Impact Loop closes the "learn" stage that the original ShiftIQ narrative described as a future goal — it's now a real, traceable screen connecting recommendation → action → measured outcome → adoption rate. The product team should keep treating prompt-dependent features (asking the user to request insight rather than surfacing it) as a step backward, same as April.

**The zero-to-value timeline is still the retention model — and it just got a long tail.** The April modules ran 14–90 days to first value. The new modules stretch that range substantially: Agent Control's Govern-tier promotion is explicitly multi-month, gated on a 95%-success, zero-rollback track record. Process Intelligence (Module 13) is likely the single slowest value curve in the platform, gated on sustained participation from scarce senior experts. Track both against real deployments — a plant stalling at Observe-tier for every agent after 90 days, or a fermentation customer with an empty KnowledgeVault after the same window, are both high-churn signals, just on different clocks than the original four modules.

**Open reconciliation items (not resolved here, worth a decision):**
- `ExecutionAuthority.jsx` is dead code, fully absorbed into AgentControl's History tab. Safe to delete.
- AgentControl's roster includes a "Resource Allocation" agent, but ResourceAllocation's Reallocate flow is currently 100% manual — no agent proposes a reallocation yet. Either wire them together or stop implying they're connected.
- CAPA Engine's root-cause pattern data and industry-benchmark percentile exist but render as plain stat cards, not the heatmap/comparison layer the original narrative describes.
- The fermentation vertical (Module 13) has no named company brief. If it's staying in the product, it needs one.

---

## Metadata

Last updated: 2026-06-19
Updated by: Claude (research grounded in current codebase, all strategic judgments flagged for founder confirmation)
Version: 2.0 (supersedes April 2026 working document)
Approved by: _pending_
