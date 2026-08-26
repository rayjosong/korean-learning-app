---
timestamp: 2026-08-26T11:46:17Z
agent: gemini-cli
model: gemini-3.7-flash
session: 01a03dab-395c-7468-8b8f-d166e7701f9e
trigger: user-prompt
status: executed
ticket: no-ticket
---

# YouTube Caption Fallback via InnerTube get_panel

> In the context of Korean learning transcript acquisition, facing YouTube's server-side blockages or empty body responses on the legacy GET `/api/timedtext` timed-text endpoint, I decided to implement a server-side POST fallback to InnerTube's official `/youtubei/v1/get_panel` API utilising page-extracted player context and transcript parameters to achieve stable, high-fidelity Korean transcript retrieval, accepting string-based timestamp parsing to milliseconds.

## Context

- We need to fetch Korean subtitles/transcripts for authentic YouTube videos like `Jd3h9if8OzQ` to feed our synchronized transcript viewer and study tools.
- YouTube now blocks or returns empty bodies (`Content-Length: 0`, HTTP 200) on many legacy `timedtext` API requests from non-browser/Node server environments.
- Traditional workarounds either require browser cookie extraction (which violates privacy/session boundaries) or complex client-side Player Attestation/Proof of Token (PO Token/`pot`) generation, which is fragile and difficult to maintain server-side.
- This solution must work inside `packages/content` using only native/ambient environments and without introducing external heavy dependencies.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Option A**: Legacy `timedtext` GET request with simulated headers | Minimal code change, maintains XML/JSON3 parser. | Fails completely on modern protected videos (returns 200 with an empty body even with fake user-agents, referers, and client parameters). |
| **Option B**: InnerTube POST `/youtubei/v1/get_panel` with page-extracted params | Highly stable, bypasses legacy `timedtext` restrictions, does not require attestation (`pot` token), retrieves translated and original tracks reliably. | Returns complex nested panel JSON structure rather than XML/JSON3; timestamps are in string format (e.g., `"0:02"`) needing custom ms parsing; requires a fallback parser. |

## Decision

Chosen: **Option B (InnerTube POST get_panel fallback)**, because it is the only robust server-side method that successfully retrieves Korean transcript segments from Node without requiring third-party libraries, browser sessions, cookies, or complex PO Token attestation generation.

## Consequences

- **What this makes easier**: We can now reliably load transcripts for modern protected videos like `Jd3h9if8OzQ` and others.
- **What this makes harder**: We maintain two transcript schemas: standard `json3`/`XML` for legacy videos and `engagementPanelSectionListRenderer` for modern/protected videos.
- **Risk carried, and what would trigger revisiting this**: If YouTube changes the DOM layout of `PAmodern_transcript_view` or alters the `/get_panel` payload structure, our parser might need updating. A parsing error or failure to find the transcript block in production would trigger a revisit.

## Artifacts

- Implementation: `packages/content/src/youtube-transcript.ts`
- Tests: `packages/content/test/youtube-transcript.test.mjs`
