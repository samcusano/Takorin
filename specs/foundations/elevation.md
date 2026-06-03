# Elevation & Shadow Foundation

## Shadow tokens

| Token | CSS Var | Value | Usage |
|---|---|---|---|
| Card | `--shadow-card` | `0 1px 4px rgba(0,0,0,0.30)` | Subtle card lift in dark theme |
| Raise | `--shadow-raise` | `0 4px 20px rgba(0,0,0,0.45)` | Floating elements, tooltips, popovers |
| Overlay | `--shadow-overlay` | `0 2px 12px rgba(0,0,0,0.40)` | Detail overlays, inline dropdowns |
| Modal | `--shadow-modal` | `0 16px 48px rgba(0,0,0,0.50)` | Full-screen modals, slide panels |
| Card alert | `--shadow-card-alert` | `0 1px 5px rgba(222,108,78,0.20)` | Alert-state cards |

### Tailwind shadow class equivalents
- `shadow-card` → `--shadow-card`
- `shadow-raise` → `--shadow-raise`

## Light theme

Shadows reduce significantly in light mode (dark values are multiplied by roughly 0.2–0.25):
- `--shadow-raise`: `0 4px 16px rgba(0,0,0,0.10)`
- `--shadow-card`: `0 1px 3px rgba(0,0,0,0.08)`
- `--shadow-overlay`: `0 2px 12px rgba(0,0,0,0.12)`
- `--shadow-modal`: `0 16px 48px rgba(0,0,0,0.15)`

## Elevation hierarchy

| Layer | Token | Use case |
|---|---|---|
| 0 (flat) | No shadow | Standard content, table rows |
| 1 (raised) | `--shadow-card` | Cards, info panels |
| 2 (floating) | `--shadow-raise` | Sidebar popup menus, dropdowns |
| 3 (overlay) | `--shadow-overlay` | Detail overlays within a section |
| 4 (modal) | `--shadow-modal` | Full-screen modals, `SlidePanel` |

## Rules

- Never write raw `box-shadow` values in component code — always use `--shadow-*` tokens
- Use `.card-lift` CSS class for hover lift animations (already includes shadow transition)
- The alert shadow `--shadow-card-alert` is used automatically by components when `tone="danger"` — do not apply manually unless overriding
