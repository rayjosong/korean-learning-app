---
timestamp: 2026-08-28T08:26:38Z
agent: pi-coding-agent
model: gpt-5.6-sol
trigger: user-prompt
status: executed
ticket: no-ticket
pr: 71
---

# Deterministic cross-surface visual verification

> In the context of completing backlog #32 across several user-facing surfaces, facing unstable live media/provider dependencies and a need to prove visual and accessibility behavior, I decided to extend the existing Playwright fixture harness with named deterministic scenarios and checked-in screenshots to achieve repeatable regression coverage, accepting additional fixture and QA artifacts in the repository.

## Context

- #32 requires visual and accessibility coverage for Watch, Study, Review, Progress, Settings, utilities, loading, error, and compact desktop states.
- Live YouTube and AI-provider responses are unsuitable as required CI inputs because they can change or require external credentials.
- The repository already uses a fixture player and Playwright baseline screenshots for the #29 Watch/Study gate.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Use live YouTube and AI-provider responses | Closest to production integration | Flaky, network-dependent, and difficult to reproduce in CI |
| Add named deterministic browser fixtures and checked-in screenshots | Repeatable, credential-free, and covers state matrices consistently | Adds fixture maintenance and binary QA artifacts |
| Test only component markup and token definitions | Fast and small diff | Cannot prove browser layout, focus behavior, playback/selection separation, or cross-surface rendering |

## Decision

Chosen: **extend the existing deterministic Playwright harness with named fixtures and checked-in visual evidence**, because it directly exercises the real browser wiring while keeping the required gate stable and credential-free.

## Consequences

- Browser tests cover short/long transcripts, populated/empty utilities, loading/error recovery, and learner feedback with fixed dates and local fonts.
- Accessibility tests verify keyboard behavior, focus, and independent selected-versus-playing state.
- Screenshot updates and `docs/QA-32.md` provide reviewable rendered evidence.
- Live YouTube and AI-provider smoke checks remain separate from the deterministic required gate.

## Artifacts

- Backlog item: `docs/BACKLOG.md` #32
- QA record: `docs/QA-32.md`
- Pull request: #71
