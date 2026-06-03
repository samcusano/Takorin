# Sidebar — Component Spec

**Source:** `src/components/Sidebar.jsx`  
**Category:** Layout · Navigation  
**Status:** Active

## Overview

**Use when:** Every screen in the application. The sidebar is the sole navigation mechanism — all route links live here.

**Don't use when:** Never render a second sidebar. The sidebar is a singleton rendered once in `App.jsx`.

## Anatomy

1. Brand button — logo + app name, doubles as collapse toggle
2. Navigation items — icon + label, grouped by section
3. Worker mode button — toggles Human / Robot / Hybrid mode
4. Theme toggle — Dark / Light / Auto
5. User section — avatar, name, role label

## Tokens used

| Token | Usage |
|---|---|
| `--color-sidebar` | Base background (always dark) |
| `--color-sidebar-2` | Brand button background |
| `--color-sidebar-3` | Hovered/active nav items |
| `--color-sidebar-border` | Right border and internal dividers |
| `--color-sidebar-ghost` | Inactive nav labels |
| `--color-signal` | Active nav item accent and dot |
| `--dur-quick` | Collapse transition duration (200ms) |
| `--ease-spring` | Collapse transition easing |
| `--z-sidebar` | z-30 in Tailwind (sidebar stacking) |
| `--shadow-raise` | Popup submenu shadow |

## Props

The sidebar is a stateful component. It reads/writes from `AppState` context (`collapsed`, `mobileNavOpen`, `workerMode`).

No external props — import and render as `<Sidebar />`.

## States

| State | Visual |
|---|---|
| Expanded | 240px wide, icon + label visible |
| Collapsed | 48px wide, icon only, label hidden |
| Mobile open | Slides in from left (full nav visible) |
| Mobile closed | Off-screen (translate-x-full) |

## Collapsed behavior

Width transitions using `transitionDuration: var(--dur-quick)` and `transitionTimingFunction: var(--ease-spring)`. Labels fade out; section headers hide. Brand area shows only the logo icon.

## Navigation group structure

Nav items are flat arrays in the component. Groups are separated by visual dividers. Active state is detected via `useMatch` from `react-router-dom`.

## Worker mode button

Cycles through: `Human → Robot → Hybrid → Human`. State is stored in `AppState.workerMode`. The icon and label reflect the active mode.

## Mobile

On small screens (`sm:` breakpoint and below), the sidebar is off-screen and toggles via `mobileNavOpen` state. A backdrop overlay closes it on tap.

## Code example

```jsx
// In App.jsx
import Sidebar from './components/Sidebar'
<Sidebar />
```

## Cross-references

- `AppState` — provides `collapsed`, `mobileNavOpen`, `workerMode` state
- `src/index.css` → `.sidebar-offset` — main content compensates for sidebar width via CSS var `--sidebar-width`
