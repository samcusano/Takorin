#!/usr/bin/env node
/**
 * token-audit.js — Takorin Design System Token Audit
 *
 * Scans all CSS and JSX/JS files for hardcoded visual values and suggests
 * the correct design token for each violation.
 *
 * Exit codes:
 *   0  — zero errors (warnings may exist)
 *   1  — one or more errors found
 *
 * Run: node scripts/token-audit.js
 * CI:  node scripts/token-audit.js --ci   (suppresses color output)
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, relative } from 'path'

const ROOT = new URL('..', import.meta.url).pathname
const IS_CI = process.argv.includes('--ci')

// ── Terminal color helpers ───────────────────────────────────────────────────
const c = IS_CI
  ? { red: s => s, yellow: s => s, gray: s => s, bold: s => s, green: s => s, cyan: s => s }
  : {
      red:    s => `\x1b[31m${s}\x1b[0m`,
      yellow: s => `\x1b[33m${s}\x1b[0m`,
      gray:   s => `\x1b[90m${s}\x1b[0m`,
      bold:   s => `\x1b[1m${s}\x1b[0m`,
      green:  s => `\x1b[32m${s}\x1b[0m`,
      cyan:   s => `\x1b[36m${s}\x1b[0m`,
    }

// ── Token suggestion map ─────────────────────────────────────────────────────
// Maps known raw values to their correct token. Approximate matches welcome.
const COLOR_MAP = {
  // Surfaces
  '#0B0F18': '--color-stone',
  '#131A26': '--color-stone-2',
  '#1B2538': '--color-stone-3',
  '#263042': '--color-stone-4 or --color-rule',
  '#1A2335': '--color-rule-2',
  // Text
  '#EDE4CB': '--color-ink',
  '#9B9070': '--color-ink-2',
  '#7A8EA8': '--color-muted',
  '#4A5D74': '--color-dim',
  // Status
  '#5FA877': '--color-ok',
  '#3A9E6F': '--color-ok',
  '#C98E2A': '--color-warn',
  '#D4913A': '--color-warn',
  '#DE6C4E': '--color-danger',
  '#E55':    '--color-danger',
  '#EE5555': '--color-danger',
  // Accents
  '#4B9CE4': '--color-signal',
  '#2A6AAD': '--color-signal-dark',
  '#7BBDEE': '--color-signal-light',
  '#C4844E': '--color-context',
  '#7C86E8': '--color-deep',
  '#3BBFDA': '--color-stream',
  '#7B6E64': '--color-ink-2 (warm mid-tone)',
  // Sidebar
  '#080D16': '--color-sidebar',
  '#0E1520': '--color-sidebar-2',
  '#152030': '--color-sidebar-3',
  '#1C2A40': '--color-sidebar-border',
  '#6A88A8': '--color-sidebar-ghost',
}

const SHADOW_MAP = {
  '0 4px 20px rgba(0,0,0,0.45)': '--shadow-raise',
  '0 1px 4px rgba(0,0,0,0.30)':  '--shadow-card',
  '0 2px 12px rgba(0,0,0,0.40)': '--shadow-overlay',
  '0 2px 12px rgba(0,0,0,0.12)': '--shadow-overlay',
  '0 16px 48px rgba(0,0,0,0.5)': '--shadow-modal',
  '0 16px 48px rgba(0,0,0,0.50)':'--shadow-modal',
  '0 4px 16px rgba(0,0,0,0.10)': '--shadow-raise (light theme)',
  '0 1px 3px rgba(0,0,0,0.08)':  '--shadow-card (light theme)',
  '2px 4px 12px rgba(0,0,0,0.12)': '--shadow-overlay',
}

const CUBIC_MAP = {
  'cubic-bezier(0.19, 0.91, 0.38, 1)': '--ease-enter',
  'cubic-bezier(0.19,0.91,0.38,1)':    '--ease-enter',
  'cubic-bezier(0.42, 0, 1, 1)':        '--ease-exit',
  'cubic-bezier(0.42,0,1,1)':           '--ease-exit',
  'cubic-bezier(0.42, 0, 0.58, 1)':     '--ease-inout',
  'cubic-bezier(0.42,0,0.58,1)':        '--ease-inout',
  'cubic-bezier(0.16, 1, 0.3, 1)':      '--ease-spring',
  'cubic-bezier(0.16,1,0.3,1)':         '--ease-spring',
  'cubic-bezier(0.25, 0.1, 0.25, 1)':  '--ease-standard',
  'cubic-bezier(0.25,0.1,0.25,1)':     '--ease-standard',
  'cubic-bezier(0, 0, 1, 1)':           '--ease-linear',
  'cubic-bezier(0,0,1,1)':              '--ease-linear',
  'cubic-bezier(0, 0, 0.2, 1)':         '--ease-standard (approx)',
}

function suggestColor(raw) {
  const normalized = raw.replace(/\s+/g, '').toUpperCase()
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    if (k.toUpperCase().replace(/\s+/g, '') === normalized) return v
  }
  return null
}

// ── Detection patterns ───────────────────────────────────────────────────────

// Errors: hardcoded colors and raw rgba in visual properties
const ERROR_PATTERNS = [
  {
    name: 'Hardcoded hex color',
    // Match hex colors NOT inside a CSS var() fallback (e.g. var(--x, #000))
    regex: /(?<!var\([^)]*,\s*)(#[0-9a-fA-F]{3,8})\b/g,
    severity: 'error',
    suggest: m => suggestColor(m[1]) ? `Use ${suggestColor(m[1])}` : 'Add to tokens.css then use var(--color-X)',
  },
  {
    name: 'Raw rgba() without CSS var',
    // rgba() that doesn't reference a CSS variable
    regex: /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)(?!\s*\/)/g,
    severity: 'error',
    suggest: m => 'Use rgb(var(--color-X-rgb) / alpha) instead',
  },
  {
    name: 'Raw rgb() without CSS var',
    regex: /\brgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g,
    severity: 'error',
    suggest: m => 'Use var(--color-X) or rgb(var(--color-X-rgb) / alpha)',
  },
]

// Warnings: raw durations, raw cubic-bezier, raw box-shadow
const WARN_PATTERNS = [
  {
    name: 'Raw cubic-bezier (should use --ease-*)',
    regex: /(cubic-bezier\([^)]+\))/g,
    severity: 'warning',
    suggest: m => {
      const normalized = m[1].replace(/\s+/g, '')
      for (const [k, v] of Object.entries(CUBIC_MAP)) {
        if (k.replace(/\s+/g, '') === normalized) return `Use var(${v})`
      }
      return 'Define in tokens.css as --ease-X then use var(--ease-X)'
    },
  },
  {
    name: 'Raw ms duration (should use --dur-*)',
    // Raw transition/animation duration like 500ms (not inside a var())
    regex: /(?<!var\([^)]*)\b(\d+)ms\b/g,
    severity: 'warning',
    suggest: m => {
      const map = { 50: '--dur-instant', 100: '--dur-fast', 200: '--dur-quick', 300: '--dur-standard', 500: '--dur-data', 6000: '--dur-live', 9000: '--dur-atmo' }
      return map[parseInt(m[1])] ? `Use var(${map[parseInt(m[1])]})` : 'Define in tokens.css as --dur-X then use var(--dur-X)'
    },
  },
  {
    name: 'Raw box-shadow value',
    regex: /box-shadow:\s*([^;'"}\n]+(?:rgba?\([^)]+\))[^;'"}\n]*)/g,
    severity: 'warning',
    suggest: m => {
      const val = m[1].trim()
      const match = SHADOW_MAP[val]
      return match ? `Use var(${match})` : 'Use --shadow-card, --shadow-raise, --shadow-overlay, or --shadow-modal'
    },
  },
]

// ── File collection ──────────────────────────────────────────────────────────

const SCAN_EXTENSIONS = new Set(['.css', '.scss', '.jsx', '.js'])
const IGNORE_PATHS = [
  'node_modules', 'dist', '.git', 'scripts', // don't audit the audit script
  '.agents',     // third-party agent scripts, not Takorin source
  'agents',      // agent scripts
  'skills',      // skill scripts
  'tailwind.config.js',  // Tailwind config must define raw values — it IS the token layer
  'src/tokens.css',      // source of truth — raw values are expected
  'src/lib/tokens.js',   // JS mirror of color tokens — raw values are expected
  'src/data',            // data constants — colors here drive chart components
]

function shouldIgnore(filePath) {
  const rel = relative(ROOT, filePath)
  return IGNORE_PATHS.some(p => rel.startsWith(p) || rel === p)
}

function collectFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (shouldIgnore(full)) continue
    const stat = statSync(full)
    if (stat.isDirectory()) results.push(...collectFiles(full))
    else if (SCAN_EXTENSIONS.has(extname(full))) results.push(full)
  }
  return results
}

// ── Audit runner ─────────────────────────────────────────────────────────────

function auditFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const findings = []

  const patterns = [...ERROR_PATTERNS, ...WARN_PATTERNS]

  for (const pattern of patterns) {
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]

      // Skip lines with explicit ignore annotation
      if (line.includes('token-audit: ignore')) continue

      // Skip lines that are comments
      const trimmed = line.trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue

      // Skip lines that are inside CSS var() definitions (they're token declarations)
      if (trimmed.includes(':root') || trimmed.match(/^--[a-z]/)) continue

      // For JSX: skip AVATAR_PALETTE (boring-avatars needs actual hex colors)
      if (line.includes('AVATAR_PALETTE')) continue

      // Skip duration warnings inside @keyframes blocks (animation-specific timings are fine)
      const isInKeyframe = lines.slice(Math.max(0, lineIdx - 15), lineIdx).some(
        l => l.trim().startsWith('@keyframes')
      )
      // For CSS files: skip raw ms warnings inside @keyframes and animation shorthand
      if (isInKeyframe && filePath.endsWith('.css') && pattern.name === 'Raw ms duration (should use --dur-*)') continue

      // For CSS files in animation: blocks, raw box-shadow inside @keyframes is intentional
      if (isInKeyframe && filePath.endsWith('.css') && pattern.name === 'Raw box-shadow value') continue

      // For CSS: skip fallback values inside var() — e.g. var(--x, #000)
      const searchLine = line

      let match
      pattern.regex.lastIndex = 0
      while ((match = pattern.regex.exec(searchLine)) !== null) {
        const col = match.index + 1
        const suggestion = pattern.suggest(match)
        findings.push({
          file: relative(ROOT, filePath),
          line: lineIdx + 1,
          col,
          severity: pattern.severity,
          name: pattern.name,
          raw: match[0],
          suggestion,
          lineText: line.trim(),
        })
      }
    }
  }

  return findings
}

// ── Main ─────────────────────────────────────────────────────────────────────

const files = collectFiles(ROOT)
const allFindings = []

for (const file of files) {
  const findings = auditFile(file)
  allFindings.push(...findings)
}

const errors   = allFindings.filter(f => f.severity === 'error')
const warnings = allFindings.filter(f => f.severity === 'warning')

// Group by file for cleaner output
const byFile = {}
for (const f of allFindings) {
  ;(byFile[f.file] ??= []).push(f)
}

console.log('\n' + c.bold('Token Audit — Takorin Design System'))
console.log(c.gray('──────────────────────────────────────────────\n'))

if (allFindings.length === 0) {
  console.log(c.green('✓ Zero violations. Design token hygiene is clean.\n'))
  process.exit(0)
}

for (const [file, findings] of Object.entries(byFile)) {
  console.log(c.bold(file))
  for (const f of findings) {
    const sev = f.severity === 'error' ? c.red('ERROR  ') : c.yellow('WARN   ')
    console.log(`  ${sev} ${c.gray(`${f.line}:${f.col}`)}  ${f.raw}`)
    console.log(`         ${c.gray(f.name)}`)
    console.log(`         ${c.cyan('→')} ${f.suggestion}`)
    console.log(`         ${c.gray(f.lineText.slice(0, 100))}`)
    console.log()
  }
}

console.log(c.gray('──────────────────────────────────────────────'))
console.log(`${c.bold('Results:')}  ${c.red(`${errors.length} error(s)`)}  ${c.yellow(`${warnings.length} warning(s)`)}`)

if (errors.length > 0) {
  console.log(c.red('\n✗ Errors found. Resolve all errors before committing.\n'))
  process.exit(1)
} else {
  console.log(c.yellow('\n⚠ Warnings found. Review before committing.\n'))
  process.exit(0)
}
