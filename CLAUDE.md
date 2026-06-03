# Designpowers

This is the Designpowers design workflow system.

## Mandatory: Welcome Sequence First

**Before doing anything else in a new session**, you MUST run the welcome sequence defined in `skills/using-designpowers/SKILL.md`. This is non-negotiable.

1. Invoke the `using-designpowers` skill using the Skill tool **before** responding to any user message
2. The skill will show the bird welcome screen and handle onboarding
3. Do NOT skip the welcome, do NOT jump straight into design work, do NOT answer questions before the welcome runs

The welcome sequence checks for a returning user (taste profile at `~/.designpowers/taste-profile.md`) and shows the appropriate welcome screen with the bird. First-time users get offered a guided walkthrough. This must happen before any design work begins.

**Specifically: do NOT invoke design-discovery, design-strategy, design-memory, design-state, design-taste, or any other Designpowers skill until the welcome sequence has completed.** The bird must appear. The user must see the greeting and the walkthrough offer. Only then can the pipeline begin. If any skill is invoked before the welcome, stop and run the welcome first.

## Skills

All design skills live in `skills/`. The entry point is `skills/using-designpowers/SKILL.md` which orchestrates the entire workflow. Never bypass it.

## Agents

Design agents live in `agents/`. They are invoked by the workflow — do not call them directly without going through the skill orchestration.

---

## Design System — Token Rules

**Before writing or modifying any UI code, read the relevant spec file in `specs/`.** The full spec tree:

- `specs/foundations/` — color, spacing, typography, radius, elevation, motion
- `specs/tokens/token-reference.md` — every CSS variable, its value, and when to use it
- `specs/components/` — one spec per major component

**Use only tokens from `src/tokens.css`.** The rules:

1. **No raw hex, rgb, or rgba values** in component files (`*.jsx`, `*.js`, `*.css`). Always use `var(--color-X)` or `rgb(var(--color-X-rgb) / alpha)`.
2. **No raw cubic-bezier strings** — use `var(--ease-enter)`, `var(--ease-spring)` etc.
3. **No raw millisecond values** in transitions — use `var(--dur-fast)`, `var(--dur-data)` etc.
4. **No raw box-shadow values** — use `var(--shadow-card)`, `var(--shadow-raise)` etc.
5. **No raw pixel values** in inline `style={{}}` for spacing — use `var(--space-N)` or Tailwind classes.
6. Exception: `AVATAR_PALETTE` in `UI.jsx` may keep raw hex values (boring-avatars requires real colors for SVG generation).
7. Exception: SVG `stroke-width`, `r`, `cx`, `cy`, `x`, `y` geometry attributes — raw numbers are fine.
8. Exception: CSS var() fallback values — `var(--x, #fallback)` is acceptable.

**Run the token audit script before committing:**

```bash
node scripts/token-audit.js
```

Zero errors required. Warnings should be reviewed. The script exits with code 1 on errors (CI-ready).

**Adding new tokens:** If you need a color or value not in `tokens.css`, add it to `tokens.css` first (Layer 1 primitive + Layer 2 semantic alias), update `specs/tokens/token-reference.md`, then use it. Never hardcode a value that will be used in more than one place.
