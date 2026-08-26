---
timestamp: 2026-08-26T15:00:34Z
agent: pi-coding-agent
model: gpt-5.6-sol
trigger: user-prompt
status: executed
ticket: no-ticket
---

# Sequence the cross-surface visual-system refinement

> In the context of an unfinished Watch/Study workspace and a partial light-theme migration, facing a choice between expanding #29 or tracking the remaining cross-surface work separately, I decided to add backlog #32 after #29 and before #30/#31 to achieve a stable visual foundation with clear completion criteria, accepting one additional backlog item and dependency boundary.

## Context

- `DESIGN.md` already defines the Warm Korean Editorial visual direction and semantic colour roles.
- Backlog #29 owns the shared Watch/Study structure and remains incomplete.
- Home, Review, Progress, and Settings also need the same token, contrast, surface, and depth rules without broadening #29 beyond its media-workspace contract.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Expand #29 to cover every surface | One backlog item; Watch/Study and styling land together | Mixes media-workspace behavior with unrelated surfaces and makes #29 harder to verify and complete |
| Add #32 after #29 and before #30/#31 | Keeps #29 focused; establishes a shared visual foundation before more UX work; gives the overhaul explicit acceptance criteria | Adds a backlog item and requires sequencing work across two items |
| Defer #32 until after #31 | Styles more finished surfaces in one pass | Leaves current contrast and consistency problems in place and lets new features build on mixed visual primitives |

## Decision

Chosen: **Add #32 after #29 and before #30/#31**, because the repository rules require refinements to use a new backlog item, while the unfinished #29 workspace must stabilize before its visual system becomes the basis for every product surface.

## Consequences

- #29 retains ownership of Watch/Study structure and session behavior.
- #32 owns semantic token adoption and cross-surface visual consistency.
- #30 and #31 can build on the consolidated visual system.
- The visual overhaul starts only after #29, so urgent isolated contrast bugs may still need targeted fixes before #32 begins.

## Artifacts

- GitHub issue: https://github.com/rayjosong/korean-learning-app/issues/65
- Backlog item: `docs/BACKLOG.md` #32
- Visual source of truth: `DESIGN.md`
