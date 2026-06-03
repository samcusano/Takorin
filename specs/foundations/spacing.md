# Spacing Foundation

## Scale

4px base. Matches Tailwind's default spacing scale (1 unit = 4px).

| Token | CSS Var | Value | Tailwind equivalent |
|---|---|---|---|
| px | `--space-px` | 1px | `px` |
| 1 | `--space-1` | 4px | `p-1`, `m-1`, `gap-1` |
| 2 | `--space-2` | 8px | `p-2`, `m-2`, `gap-2` |
| 3 | `--space-3` | 12px | `p-3`, `m-3`, `gap-3` |
| 4 | `--space-4` | 16px | `p-4`, `m-4`, `gap-4` |
| 5 | `--space-5` | 20px | `p-5`, `m-5`, `gap-5` |
| 6 | `--space-6` | 24px | `p-6`, `m-6`, `gap-6` |
| 7 | `--space-7` | 28px | `p-7`, `m-7`, `gap-7` |
| 8 | `--space-8` | 32px | `p-8`, `m-8`, `gap-8` |
| 10 | `--space-10` | 40px | `p-10`, `m-10`, `gap-10` |
| 12 | `--space-12` | 48px | `p-12`, `m-12`, `gap-12` |
| 16 | `--space-16` | 64px | `p-16`, `m-16`, `gap-16` |

## Usage

Prefer Tailwind utility classes for spacing in JSX. Use `--space-*` CSS variables only when:
- Spacing must be calculated in JavaScript
- Inside `style={{}}` props where Tailwind classes don't apply
- In CSS custom property expressions

```jsx
/* Preferred: Tailwind */
<div className="px-6 py-4 gap-3">

/* Acceptable: CSS var in inline style */
<div style={{ gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-6)' }}>

/* Not allowed: raw pixel values */
<div style={{ gap: 12, padding: '16px 24px' }}>
```

## Common Patterns

| Context | Value | Token |
|---|---|---|
| Panel padding | 24px (h) · 20px (v) | `--space-6` / `--space-5` |
| Tight list gap | 8px | `--space-2` |
| Standard list gap | 12px | `--space-3` |
| Card padding | 16–20px | `--space-4` / `--space-5` |
| Section padding | 24px | `--space-6` |
| Module gap | 32px | `--space-8` |
