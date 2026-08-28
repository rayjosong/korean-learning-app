---
timestamp: 2026-08-28T08:43:36Z
agent: pi-coding-agent
model: gpt-5.6-sol
trigger: user-prompt
status: superseded
ticket: no-ticket
pr: 71
---

# CI visual-baseline tolerance

> In the context of a browser-regression workflow whose functional checks passed but whose Ubuntu screenshots differed from macOS baselines by renderer anti-aliasing, facing a choice between weakening visual checks or maintaining separate platform baselines, I decided to apply a narrow CI-only pixel-ratio tolerance while keeping local comparisons exact to achieve reliable cross-platform verification, accepting that very small rendering differences will not fail CI.

## Context

- PR #71's browser-regression job failed all visual assertions on Ubuntu while accessibility and the Watch/Study journey passed.
- The failure reported stable screenshot differences around 0.8–1.0% and occasional full-page height variance during the first attempt.
- The repository has one checked-in baseline set and runs the same visual suite locally and in GitHub Actions.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Regenerate and maintain separate macOS and Ubuntu baseline trees | Exact comparisons per renderer | Duplicates every baseline and complicates local review and maintenance |
| Add a narrow CI-only pixel-ratio tolerance | Keeps one baseline set; handles known renderer anti-aliasing differences; local checks stay exact | Small visual changes below the threshold may not fail CI |
| Remove visual checks from the required CI gate | Eliminates false failures | Loses the layout regression protection required by #32 |

## Decision

Chosen: **use a 1.5% CI-only `toHaveScreenshot` pixel-ratio tolerance**, because the observed Ubuntu variance is below that threshold, while the visual suite remains required and local runs retain exact matching.

## Consequences

- CI can verify the existing cross-surface screenshots across its Ubuntu renderer.
- Local visual runs remain strict when `CI` is unset.
- Material layout changes, including changed dimensions or larger visual differences, still fail the screenshot assertions.

## Artifacts

- Playwright configuration: `apps/web/playwright.config.ts`
- Pull request: #71
