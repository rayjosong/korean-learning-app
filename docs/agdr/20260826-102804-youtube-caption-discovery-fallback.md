---
timestamp: 2026-08-26T10:28:04Z
agent: pi-coding-agent
model: active-llm
trigger: user-prompt
status: executed
ticket: no-ticket
---

# YouTube caption discovery fallback

> In the context of loading Korean YouTube transcripts, facing the legacy timed-text track-list endpoint returning an empty response for videos that still expose captions in YouTube’s watch page, I decided to fall back to the watch page’s embedded caption tracks to achieve reliable caption discovery, accepting dependence on YouTube page structure.

## Context

- Video Jd3h9if8OzQ exposes an authored English transcript in YouTube, but the legacy /api/timedtext?type=list response is empty.
- The content package must keep provider-specific parsing behind YouTubeCaptionProvider and must not silently treat non-Korean captions as Korean.
- The existing adapter has no third-party transcript dependency and already fetches caption tracks server-side.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Keep the legacy timed-text track-list endpoint only | Smallest code change; simple response format | Produces false NO_TRANSCRIPT results when YouTube exposes captions through newer page data |
| Parse captionTracks from the YouTube watch page as a fallback | Uses the same caption URLs YouTube exposes to its player; preserves the existing provider interface and dependency-free design | Depends on YouTube’s embedded player response shape |
| Add a third-party transcript library | Could absorb YouTube protocol changes | Adds a dependency and another provider abstraction without solving the immediate adapter contract directly |

## Decision

Chosen: **Parse watch-page caption tracks as a fallback**, because the live failing video demonstrates that the legacy discovery endpoint can be empty while YouTube still exposes caption metadata, and the fallback can reuse the existing timestamp parser and Korean-track selection.

## Consequences

- Caption discovery now works when the legacy track-list endpoint is empty but the watch page contains tracks.
- Track identifiers carry the watch-page caption URL, while legacy XML tracks retain the existing parameter-based fetch behavior.
- YouTube page markup changes may require parser maintenance; the fallback is covered by a fixture-based regression test.

## Artifacts

- Branch: https://github.com/rayjosong/korean-learning-app/tree/agent/4-youtube-caption-fallback