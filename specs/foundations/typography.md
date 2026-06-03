# Typography Foundation

## Font Families

| Role | Token | Stack | Usage |
|---|---|---|---|
| Body | `--font-family-body` | `'Plus Jakarta Sans', system-ui, sans-serif` | All running text, labels, UI text |
| Display | `--font-family-display` | `'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif` | Headings, narrative statements, module labels |
| Mono | `--font-family-mono` | `'JetBrains Mono', 'Menlo', monospace` | Numbers, data values, code, timestamps |

### Tailwind class equivalents
- `font-body` → Plus Jakarta Sans
- `font-display` → Bricolage Grotesque
- `font-mono` → JetBrains Mono

### Special class: `.display-num`
Apply to all numeric data values (KPI metrics, scores, counts). Renders in JetBrains Mono with tabular-nums and no ligatures. Do not use `font-mono` alone for numeric data — use `.display-num`.

## Type Scale

| Name | Token | Size | Line height | Usage |
|---|---|---|---|---|
| nano | `--font-size-nano` | 11px | 1.35 | Metadata, timestamps, chip labels |
| label | `--font-size-label` | 12px | 1.35 | Secondary labels, badge text |
| body | `--font-size-body` | 14px | 1.5 | Primary reading text, descriptions |
| sub | `--font-size-sub` | 16px | 1.4 | Section subheadings, prominent labels |
| head | `--font-size-head` | 20px | 1.25 | Panel headers, screen section heads |
| title | `--font-size-title` | 24px | 1.15 | Callout numbers, stat values |
| metric | `--font-size-metric` | 32px | 1 | KPI grid cells |
| score | `--font-size-score` | 52px | 1 | Hero risk / shift scores — top of scale |

### Tailwind class equivalents
`text-nano`, `text-label`, `text-body`, `text-sub`, `text-head`, `text-title`, `text-metric`, `text-score`

## Font Weights

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--font-weight-regular` | 400 | `font-normal` | Body text |
| `--font-weight-medium` | 500 | `font-medium` | Labels, secondary headings |
| `--font-weight-semibold` | 600 | `font-semibold` | Accented labels |
| `--font-weight-bold` | 700 | `font-bold` | Metric values, key numbers |

## Floor Mode (`.floor-mode`)

Plant-floor tablet displays use larger sizes. Apply `.floor-mode` to `<body>` or a screen wrapper. All type scale classes scale up automatically — no per-component changes needed.

| Normal | Floor |
|---|---|
| text-label (12px) | 16px |
| text-body (14px) | 19px |
| text-sub (16px) | 21px |
| text-head (20px) | 28px |
| text-metric (32px) | 40px |
| text-score (52px) | 62px |

## Rules

- Numeric data: always `display-num` + `tabular-nums` + `font-mono`
- Narrative text: `font-display` for impact, `font-body` for descriptions
- Never set raw `font-size` in component inline styles — use Tailwind scale classes
- Never mix mono and display fonts in the same text element
