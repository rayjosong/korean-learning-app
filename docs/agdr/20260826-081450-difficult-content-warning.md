---
timestamp: 2026-08-26T08:14:50Z
agent: pi-coding-agent
model: active-llm
trigger: user-prompt
status: executed
ticket: no-ticket
---

# Difficult-content warning boundary

> In the context of showing the existing deterministic video-difficulty estimate, facing the risk that a demanding video could discourage or block study, I decided to add a pure challenging-band policy and an inline dismissible warning in the web layer to inform the learner while keeping study controls usable, accepting that the threshold remains intentionally coarse until richer progress signals exist.

## Context

- Backlog #20 requires a non-blocking warning for unusually demanding content.
- `packages/learning-engine` already owns the difficulty estimate; React must not duplicate its scoring thresholds.
- The transcript viewer and explanation controls must remain mounted and usable.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| Render a modal gate around the study session | High visibility; forces acknowledgement | Blocks the required study flow and makes challenge feel punitive |
| Add an inline warning driven by a learning-engine predicate | Preserves the existing viewer, is testable, and keeps policy out of React | Uses the current coarse `challenging` band until the estimator gains more signals |
| Show a warning for every intermediate or challenging estimate | Simpler and more cautious | Produces noisy warnings and weakens the meaning of “unusually demanding” |

## Decision

Chosen: **Inline warning driven by the learning-engine predicate**, because the existing estimate already has a documented `challenging` band and the issue explicitly requires immediate continuation without a modal or disabled controls.

## Consequences

- The warning can be unit-tested independently of UI scoring and is automatically reset when a new video remounts the estimate component.
- Learners can dismiss the notice for the current video without persistent storage or changing learner data.
- The coarse band may need a later policy update if difficulty estimates become more granular.

## Artifacts

- Issue: #35 — Backlog #20 Difficult-content warning
