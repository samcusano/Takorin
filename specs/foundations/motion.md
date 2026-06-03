# Motion Foundation

## Duration tokens

| Token | CSS Var | Value | Usage |
|---|---|---|---|
| Instant | `--dur-instant` | 50ms | Micro-feedback, badge state changes |
| Fast | `--dur-fast` | 100ms | Focus rings, hover fills, quick state |
| Quick | `--dur-quick` | 200ms | Sidebar collapse, small UI transitions |
| Standard | `--dur-standard` | 300ms | Most interactive transitions |
| Data | `--dur-data` | 500ms | Data bars, progress widths |
| Live | `--dur-live` | 6000ms | Undo countdown, progress indicators |
| Atmo | `--dur-atmo` | 9000ms | Atmospheric ambient pulses |

## Easing tokens

| Token | CSS Var | Curve | Usage |
|---|---|---|---|
| Linear | `--ease-linear` | `cubic-bezier(0,0,1,1)` | Countdowns, progress bars |
| Standard | `--ease-standard` | `cubic-bezier(0.25,0.1,0.25,1)` | General purpose |
| Enter | `--ease-enter` | `cubic-bezier(0.19,0.91,0.38,1)` | Elements entering the screen |
| Exit | `--ease-exit` | `cubic-bezier(0.42,0,1,1)` | Elements leaving the screen |
| In-out | `--ease-inout` | `cubic-bezier(0.42,0,0.58,1)` | Symmetric reversible transitions |
| Spring | `--ease-spring` | `cubic-bezier(0.16,1,0.3,1)` | Bouncy, springy expansions |

## Animation classes

These utility classes are defined in `index.css` and ready to use:

| Class | Description |
|---|---|
| `.slide-in` | Element slides in from top (menu/dropdown) |
| `.slide-right` | Element slides in from right |
| `.plant-drop-in` | Panel enters from left with spring |
| `.modal-enter` / `.modal-exit` | Modal scale + fade |
| `.drawer-in` / `.drawer-out` | Bottom drawer slide |
| `.row-in` | Table row entrance |
| `.metric-in` | Metric number entrance (delayed) |
| `.bar-grow` | Bar chart grow from left |
| `.page-rise` | Page content rise on route change |
| `.page-fade` | Page fade on route change |
| `.waveform-reveal` | Chart reveal from bottom |
| `.content-reveal` | Generic content fade+rise |
| `.live-dot` | Pulsing live indicator dot |
| `.beat` | Pulsing beat animation |
| `.atmo-glow-danger/warn/ok` | Atmospheric risk glow |
| `.danger-pulse` | Ring pulse for critical alerts |
| `.spinner` | Loading spinner |
| `.score-tick` | Score value update tick |
| `.badge-pulse` | Badge count increment |
| `.decision-commit` | Green flash on positive decision |
| `.flash-success` | Full-component success flash |
| `.shake-error` | Error shake |
| `.card-lift` | Card hover lift with shadow |
| `.undo-countdown` | Linear countdown bar |

## Rules

- Never write raw `cubic-bezier(...)` strings in component code — use `--ease-*` tokens
- Never write raw `ms` values in transitions — use `--dur-*` tokens
- Apply `prefers-reduced-motion` is already handled globally — all animation classes respect it
- Atmospheric glows (`atmo-glow-*`) are absolute-positioned overlays — parent needs `position: relative` and `overflow: hidden`
- `.metric-in` has a built-in 100ms delay — do not add additional delay unless staggering a grid

## Transition shorthand pattern

```jsx
/* Correct */
style={{ transition: `width var(--dur-data) var(--ease-enter)` }}

/* Not allowed */
style={{ transition: 'width 500ms cubic-bezier(0.19,0.91,0.38,1)' }}
```
