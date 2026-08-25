---
timestamp: 2026-08-25T15:32:03Z
agent: pi-coding-agent
model: unknown
session: unknown
trigger: user-prompt
status: executed
ticket: no-ticket
---

# YouTube timed-text transcript adapter

In the context of completing backlog item #4, facing the need to load Korean captions without coupling the UI to a provider, I decided to use a concrete YouTube timed-text adapter behind `TranscriptSource` and call it through a server-side Next route to achieve a real URL-to-transcript study flow, accepting that the timed-text endpoint is a provider-specific integration that may need replacement if YouTube changes its response format.

## Context

- The architecture requires transcript acquisition to remain behind a replaceable adapter.
- The product requires manual Korean captions where available, auto captions where supported, timestamps, and explicit failure states.
- The repository already has `TranscriptSource`, normalized domain segments, and unit-testable injected providers; adding a dependency would increase the integration surface without helping the current vertical slice.

## Options

| Option | Pros | Cons |
|--------|------|------|
| YouTube timed-text endpoint behind `YouTubeCaptionProvider` | No new dependency or credential; supports track discovery and JSON3 timestamps; easy to mock in contract tests | Provider-specific XML/JSON parsing may need maintenance if YouTube changes the endpoint |
| YouTube Data API captions endpoints | Official API surface and documented authentication | Requires API credentials/quota and does not fit the local-first, no-account V0.1 flow as directly |
| Third-party transcript service/package | Could abstract endpoint quirks and reduce parser code | Adds a vendor or dependency, creates another failure/billing boundary, and weakens control over error mapping |

## Decision

Use `YouTubeTimedTextProvider` for track listing and JSON3 caption retrieval. `YouTubeTranscriptSource` retains language selection, manual-over-auto preference, normalization, and domain errors. A server-side `/api/transcript` route constructs the adapter and the client loader only sends a video URL, keeping provider-specific code out of React and avoiding browser cross-origin concerns.
