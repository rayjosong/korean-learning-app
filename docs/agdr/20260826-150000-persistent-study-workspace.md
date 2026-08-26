---
timestamp: 2026-08-26T15:00:00Z
agent: codex
model: gpt-5
trigger: user-prompt
status: executed
ticket: no-ticket
pr: 62
---

# Persistent Study workspace

> In the context of adding Study mode to the shared Watch session, facing the risk of duplicate players and lost inspection state, I decided to keep one parent-owned player/session and switch only the presentation, accepting a small amount of mode-specific layout code.

## Context

- Issue #57 requires Study to preserve the Watch session and provide persistent sentence inspection.
- The existing viewer can receive a player from `StudySession`, but also created its own player internally.
- The existing mode callback cleared the selected sentence and learner state.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| Add a separate Study player/session | Isolated implementation | Duplicates media state and risks reloads or divergent selection state |
| Keep the shared player/session and render a Study layout | Preserves continuity and existing hooks | Requires a focused Study presentation branch in the viewer |

## Decision

Chosen: **shared player/session with a mode-specific layout**, because the architecture and issue require Watch and Study to be two presentations of the same media session.

## Consequences

- Mode switches preserve selected sentence, explanation, learner state, and player instance.
- Study navigation seeks and pauses, leaving explicit playback to the learner.
- Future cross-mode polish can refine the shared presentation without introducing another state boundary.

## Artifacts

- GitHub issue #57
