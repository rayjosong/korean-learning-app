---
timestamp: 2026-08-26T15:40:06Z
agent: pi-coding-agent
model: gpt-5.6
trigger: user-prompt
status: executed
ticket: "#65"
---

# Cross-surface semantic token layer

> In the context of migrating every user-facing surface to the Warm Korean Editorial system, facing three viable ways to encode the DESIGN.md palette, I decided to extend the existing Tailwind theme with named semantic colour tokens (plus four WCAG-AA state inks) and migrate all sixteen files off legacy dark-theme utilities, rather than the uncommitted raw-hex approach or a CSS-variable layer, accepting that the four added in-family shades must be documented back into DESIGN.md.

## Context

- Issue #65 / backlog #32 requires named semantic tokens covering canvas, surfaces, text, borders, actions, selection, playback, success, warning, and error states.
- An uncommitted local migration (preserved on `local/wip-visual-migration`) hard-coded raw hex values per component; it satisfied the palette but not the named-token or consistency criteria.
- The repository uses Tailwind v3 with an empty theme extension and no component library.
- DESIGN.md's palette has no AA-safe text variants: primary #C7654C is 3.89:1 on white and jade #4F8373 is 4.35:1, both below the 4.5:1 small-text threshold the backlog demands for state text.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Raw hex utilities per component (the WIP approach) | Already partially done; zero config | Fails the named-token criterion; repeats literals across 16 files; drift-prone |
| CSS custom properties in globals.css | Single source; runtime theme-able | Dark mode is out of scope; utilities still need Tailwind mapping to be ergonomic |
| Extend tailwind.config.ts with semantic token names | Named tokens become normal utilities; no dependency; opacity modifiers work; one audit point | Four in-family shades (primary-deep, jade-deep, error, warning) extend the documented palette |

## Decision

Chosen: **extend `tailwind.config.ts` with semantic tokens named after the DESIGN.md palette** (`canvas`, `surface*`, `ink*`, `hairline*`, `primary*`, `jade*`, `highlight*`), adding `primary-deep` #9C4630, `jade-deep` #3E6A5C, `error` #A03722, and `warning` #8A6510 as AA-safe text inks in the same warm families. Solid CTAs use `primary-hover` #B75943 with white text (4.64:1). The four new shades are documented in DESIGN.md's colour system so the document stays authoritative.

## Consequences

- All 16 legacy-styled files now use the same token vocabulary; a single audit (`rg 'slate-|sky-|emerald-|rose-|amber-|#[0-9A-Fa-f]'`) stays clean at the token definition only.
- Selected transcript rows (persimmon soft + 2px left accent + `aria-pressed`) and playing rows (warm highlight soft + semibold timestamp + `aria-current`) are distinct without colour alone, asserted in component tests and verified in a real browser.
- The WIP branch remains preserved but is superseded; its raw-hex work is not merged.
- Visual-regression protection remains at the component layer (token assertions) plus the temporary Playwright harness, per the repo convention recorded in `20260826-140636-watch-study-regression-gate.md`; permanent screenshot-baseline CI is still future work.

## Artifacts

- GitHub issue #65: https://github.com/rayjosong/korean-learning-app/issues/65
- Before/after screenshots: qa/screenshots/32/
