# Takorin: Product Requirements Document

**Status:** High-fidelity design prototype (front-end, fixture data)
**Version:** 0.1.0
**Last updated:** June 2026
**Owner:** Sam Cusano (Product Design)

---

## 1. What Takorin is

Takorin is a plant-operations platform for food manufacturing. It is not a dashboard, a copilot, or a reporting tool. It is built as an agent in the operational sense: it senses conditions across data sources, ranks a response, surfaces specific interventions, and anchors recommendations to the plant's own history. A human stays in the loop by design. Every finding in the platform is an instruction waiting for a supervisor to confirm, not a report waiting for an analyst to interpret.

The product's value is decisional, not informational. When a plant director opens the platform at the start of a shift, the question being answered is "what do I act on first, and why," in the time she actually has.

**Current maturity.** What exists today is a working React prototype that demonstrates the full product surface against fixture data. It is the design and interaction model, validated through staged review, not a production system wired to live plant telemetry. Section 9 documents the gap between the prototype and a deployable product honestly.

---

## 2. Target users

| Role | Context | Primary anxiety |
|------|---------|-----------------|
| Plant Director | Opens the platform at shift start, reviews monthly ops | Acting on a confidently wrong recommendation |
| Shift Supervisor | On the floor, reading a tablet while the shift runs | Missing the intervention window |
| Compliance Manager | Highest-anxiety user; her name is on the audit | A missed alert becoming a recall |
| QA Director | At a desk managing the CAPA register | Being surprised by an inspector |
| Operator (L1/L2) | Physically on the line, confirms outcomes | Being handed work without the cert or context |

The platform supports a role switcher (`viewingRole`: director, supervisor, operator-reyes, operator-okonkwo) so the same data can be read through each role's lens.

---

## 3. Problem

Shift losses in food manufacturing are rarely a single catastrophic failure. They are three or four mild signals compounding over two hours into an outcome that was visible in retrospect at minute forty. The data to catch this already exists across checklist completion, qualified staffing, machine certification, supplier COAs, and sensor readings. It lives in separate systems, none of which correlate it into a single ranked signal with historical precedent attached. So the director does that correlation by hand, every session, and the intervention window closes before the pattern is named.

---

## 4. Product principles

1. **Decide, don't display.** Every time a feature tempts toward "show the user more data," the question is what the system should do with that data before it reaches the user.
2. **Trust is infrastructure.** Confidence percentages, named precedents, and signal-health indicators are not decoration. They are the answer to a supervisor's specific fear of acting on a wrong call. Any decision that hides confidence undermines the whole platform.
3. **Human in the loop at the Act stage.** Sense, plan, and learn are autonomous. Authorization is human.
4. **Surface early.** For compliance users, an unnecessary alert costs annoyance. A missed alert costs a production halt. The product errs toward surfacing.

---

## 5. Information architecture (what is built)

The platform ships 22 routed screens behind a persistent sidebar and a global `TrustStrip` (data-source health). Routing is lazy-loaded per screen. The IA was consolidated once during the build; the prior route names are preserved as redirects so no link breaks.

### Core operating loop
- **Plant Overview** (`/overview`): default landing view; cross-line state and the ranked situation set.
- **ShiftIQ** (`/shift`): the intervention system. Reads risk signals across the shift's first hour, ranks findings by impact, attaches a named historical precedent and a countdown window. Absorbs the former Handoff, Robot Fleet, and Resource Allocation routes.
- **Operator View** (`/operator`): role-scoped floor view for confirming interventions and logging field observations.
- **Agent Control** (`/agents`): the queue of agent-proposed actions with rationale, status, and human approve/override. Each action carries its agent, target, and reasoning.

### Quality and compliance
- **QualityIQ** (`/quality`): quality signal and drift tracking.
- **CAPA Engine** (`/capa`): corrective-action register with an evidence gate, root-cause pattern analytics, and an industry benchmark layer.
- **Compliance & Accountability** (`/accountability`): records, policy, and the audit trail surface.
- **SecurityIQ** (`/security`): access and system-integrity view.

### Supply and production
- **SupplierIQ** (`/suppliers`): external risk: COA status, delivery ETAs, a shelf-life optimizer, and a supplier compliance scorecard.
- **Batch Intelligence** (`/batches`): batch lifecycle and release recommendations.
- **Equipment Intelligence** (`/equipment`): equipment health with an SPC chart surface.
- **Value Chain / Delivery** (`/delivery`): downstream flow.

### Intelligence and trust infrastructure
- **Data Readiness** (`/data`): the meta-layer. Scores how much of the platform's output the director can trust, names specific data conflicts (for example, the same ingredient under three different names across MES, ERP, and the supplier portal), and gives honest effort estimates for each fix.
- **Knowledge Vault** (`/knowledge`): tacit-expertise capture with institutional-risk ratings.
- **Impact Loop / Performance** (`/performance`): the causality surface: AI observation to human decision to operator confirmation to measured outcome.
- **Process Hierarchy** (`/plant-map`): plant-to-line-to-station structure.
- **Notification Center** (`/notifications`): root-level overlay queue.

---

## 6. Shared systems

These are the cross-cutting systems that hold the 22 screens together as one product rather than 22 separate views.

### 6.1 Shared application state (`AppState`)
A single React context owns all cross-screen state: escalation state machines, the agent action log, finding actions, CAPA closures and evidence, readiness resolution, override rationales, quiet-period protocols, the activity log, and field observations. State persists to `sessionStorage` so a reload mid-task does not lose progress. Sets are serialized as arrays across the boundary.

### 6.2 Worker mode as configuration
Plants run human-only, robotic, or hybrid crews. Rather than branching every staffing-aware screen on crew type, `workerMode` lives in shared state once and is read everywhere it matters. This is why Robot Fleet and Resource Allocation could be folded into ShiftIQ without rewriting staffing logic.

### 6.3 Plant selector and per-plant calibration
Three demo plants exist with full backing data:

| Plant | Code | Readiness | Worker mode | Confidence band |
|-------|------|-----------|-------------|-----------------|
| Salina Campus | SL-04 | 64 | human | green ≥70, red ≤50 |
| Wichita Plant | KS-09 | 88 | robot | green ≥70, red ≤50 |
| Denver Plant | CO-07 | 92 | hybrid | green ≥70, red ≤50 |

Each plant carries a `sector`, a `confidenceModel`, and its own green/red confidence thresholds, so the agentic layer can be tuned per deployment rather than running one universal number.

### 6.4 Design token system
All UI is driven by `src/tokens.css` (a two-layer primitive-then-semantic token set). Component files may not use raw hex, raw cubic-bezier, raw millisecond, raw box-shadow, or raw pixel spacing values. A `token-audit.js` script enforces zero violations and is CI-ready. The visual grammar is an instrument-panel direction chosen for legibility across all reading roles.

### 6.5 Agentic layer
A set of named agents (Pre-Shift, Compliance, Supplier, Handoff) propose actions with timestamps, targets, and rationale. Actions move through states (completed, pending-review, overridden). Demo mode (`?demo=true`) seeds a presentation-clean state: compliance shown as Attention rather than Blocked, and the agent queue trimmed to two decisions.

---

## 7. The agentic loop, concretely

| Stage | Where it lives |
|-------|----------------|
| Sense | TrustStrip + Data Readiness + per-screen signal panels read source health continuously |
| Plan | ShiftIQ and CAPA Engine correlate against historical precedent and rank by impact |
| Act | Agent Control surfaces the ranked action with rationale and a countdown; a human approves or overrides |
| Learn | Impact Loop records whether the action was taken, the outcome, and feeds it back as precedent |

---

## 8. Success metrics (target outcomes the product is meant to move)

- **OEE on pilot lines:** 5 to 15 percent improvement within 90 days.
- **Actioned-finding rate:** percentage of above-threshold shifts where a recommendation was actioned.
- **Time-to-response:** average minutes between risk escalation and supervisor response.
- **OEE variance:** tightening the distribution so bad shifts get rarer, not just shorter.
- **Evidence-gated CAPA closure:** 100 percent of closed cases with verified evidence.
- **Recurring root-cause rate:** below 15 percent of new CAPAs traceable to a 90-day prior root cause.
- **Data readiness:** from a typical 55 to 70 at onboarding toward 90+.
- **Zero-to-value timeline:** first ShiftIQ finding by day 14, first auto-briefing by day 30, first CAPA pattern by day 90. This timeline is the retention model, not just a spec.

---

## 9. Out of scope and known gaps (honest current state)

The prototype demonstrates the product surface. It does not yet have the infrastructure a real multi-plant deployment requires. The following are documented gaps, not hidden ones.

| Gap | What a real deployment needs | Rough timeline |
|-----|------------------------------|----------------|
| Real data integration | OPC-UA / MQTT / REST adapter framework with an OT security model | 12 to 18 months |
| Regulatory validation (pharma) | IQ/OQ/PQ program; 21 CFR Part 11 e-signature layer | 18 to 24 months |
| Plant state isolation | `AppState` partitioned by `plantId`; data layer indexed by plant | 2 to 3 months |
| Sector-specific confidence | Configurable thresholds per sector (today's model is calibrated for biological/fermentation uncertainty) | 1 to 2 months |
| Scale-resistant Agent Control | Signal prioritization, suppression rules, a per-shift director decision budget | 2 to 3 months |
| Knowledge capture | A human knowledge-engineering program, not a software feature | Ongoing |
| Operator adoption | Mobile-first operator interface and a training program | 6 to 9 months |
| Multi-line within a plant | Line-level partitioning and a multi-supervisor view | 2 to 3 months |

The most important honesty in this PRD: state is currently global rather than partitioned by plant, the confidence model is a single calibration tuned for food, and there is no live integration layer. These are structural, not cosmetic, and a real expansion to many plants would surface them as crashes, blank analytics, or cross-plant data bleed before it surfaced anything else.

---

## 10. What a deployment would need to be true

Takorin's single leap-of-faith assumption is that supervisors trust a recommendation more when it is grounded in their own plant's history than in a general model. If supervisors dismiss findings because they do not trust the data behind them, the platform fails. That is why Data Readiness and the per-screen signal-health indicators are not features. They are the trust infrastructure that makes the risk score actionable. The product should never move toward being more prompt-dependent (asking users to request insight) and never away from surfacing confidence transparently.
