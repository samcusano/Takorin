# Border Radius Foundation

## Scale

Takorin uses a deliberately tight radius system. The design language is precision / instrumentation — soft rounding is reserved for interactive and status elements.

| Token | CSS Var | Value | Tailwind | Usage |
|---|---|---|---|---|
| None | — | 0px | `rounded-none` | Chart elements, hard-edge components |
| Small / Btn | `--radius-sm` / `--radius-btn` | 2px | `rounded-sm`, `rounded-btn` | Buttons, chips, badges, tags |
| Medium | `--radius-md` | 6px | `rounded-md` | Cards, panels, modals |
| Large | `--radius-lg` | 10px | `rounded-lg` | Large surfaces, drawers |
| Full | `--radius-full` | 9999px | `rounded-full` | Pills, avatars, status dots |

## Rules

- Buttons always use `rounded-btn` (2px) — this is the characteristic sharp button style
- Status dots (live indicators, tone dots) always use `rounded-full`
- SPC chart rectangles and line segments: `rx="0"` or `rx="1"` only — no rounding
- Never use `rounded-xl`, `rounded-2xl`, or anything larger than `rounded-lg`
