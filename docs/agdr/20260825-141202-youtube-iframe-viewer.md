---
timestamp: 2026-08-25T14:12:02Z
agent: pi-coding-agent
model: GPT-5
trigger: user-prompt
status: executed
ticket: no-ticket
pr: 14
---

# YouTube IFrame API for the synchronized viewer

> In the context of the first Korean transcript viewer, facing the need to seek a YouTube video and read its current playback position, I decided to use the official YouTube IFrame Player API to achieve synchronized transcript interaction, accepting an external client-side script dependency.

## Context

- The viewer must render a YouTube video, seek when a transcript segment is clicked, and identify the segment at the current playback position.
- The feature must remain dependency-free at the application level and must not add AI or persistence work.
- The existing architecture keeps provider-specific content handling outside domain packages; the viewer receives normalized segment data as props.

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| YouTube IFrame Player API | Provides `seekTo` and `getCurrentTime`, supports playback control, and uses YouTube's supported embed surface. | Loads an external script and requires client-only initialization. |
| Plain YouTube iframe with `postMessage` | Small initial implementation and no API script loader. | Does not provide a reliable response path for current playback time, so active-segment tracking would be incomplete. |

## Decision

Chosen: **YouTube IFrame Player API**, because it exposes both seeking and current-time inspection needed by the acceptance criteria without adding a third-party package.

## Consequences

- Segment clicks can seek and start playback, while a polling loop maps playback time to the active segment.
- The viewer waits for the client-side API to load and reports a controlled error if it cannot load.
- A future content-loading use case can provide real transcript segments without changing the viewer boundary.

## Artifacts

- `apps/web/components/video-transcript-viewer.tsx`
- `apps/web/lib/transcript.ts`
- `docs/BACKLOG.md` item #5
