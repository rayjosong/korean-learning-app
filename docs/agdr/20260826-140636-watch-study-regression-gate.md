---
timestamp: 2026-08-26T14:06:36Z
agent: pi-coding-agent
model: gpt-5.6
trigger: user-prompt
status: executed
ticket: "#58"
---

# Watch/Study regression gate

> In the context of integrating the desktop Watch and Study workspace, facing regressions that unit tests cannot detect across transcript selection, focus, scrolling, and mode continuity, I decided to combine focused component assertions with a deterministic temporary Playwright journey and reviewed QA screenshots to achieve layered coverage without adding a permanent browser dependency, accepting that the browser check must be rerun through the repository E2E harness rather than as a standard pnpm CI script.

## Context

- Issue #58 (29D) requires a final integration and accessibility pass over the merged #29A–#29C workspace.
- The repository has fast Node component tests and a documented temporary Python/Playwright harness, but no checked-in Playwright dependency or browser scripts.
- The affected UI must keep selected and active transcript state distinct, preserve inspection context, and remain usable with long transcripts.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Add a permanent Playwright dependency and CI suite | Durable browser gate and standard CI command | Adds dependency/tooling scope and browser installation requirements not present in the repository |
| Use focused component assertions plus the existing temporary Playwright harness | Matches current repository tooling, keeps CI deterministic, and covers real browser wiring during the integration pass | Browser verification is not a checked-in CI job yet |

## Decision

Chosen: **focused component assertions plus the existing temporary Playwright harness**, because the repository explicitly provides that harness for real-browser verification and the current package scripts have no Playwright runtime; the change adds durable low-level regression coverage while documenting and capturing the browser evidence.

## Consequences

- Active-segment auto-scroll no longer steals the learner’s view while a sentence is selected.
- Study transcript items expose valid list semantics and selected state through aria-pressed.
- Future work can promote the temporary flow into permanent CI once browser infrastructure is intentionally added.
- The PR must state that live YouTube smoke and standard test:e2e/test:a11y/test:visual scripts remain unavailable in this repository/environment.

## Artifacts

- GitHub issue #58: https://github.com/rayjosong/korean-learning-app/issues/58
- QA screenshots: qa/screenshots/58/
