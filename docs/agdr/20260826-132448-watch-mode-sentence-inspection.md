---
timestamp: 2026-08-26T13:24:48Z
agent: pi-coding-agent
model: gemini-3.7-flash
session: 01a03e35-8023-7b26-9982-3a06b1c20573
trigger: user-prompt
status: executed
ticket: no-ticket
---

# Watch Mode Sentence Inspection

> In the context of designing the Watch-mode media workspace for inspecting sentence breakdowns, facing the risk of popover clipping inside overflow-scroll containers and browser autoplay race conditions when the player is not ready, I decided to implement an inline-expanding popover layout within the transcript flow and a pending-action cue hook in useYouTubePlayer to achieve fully robust layout containment and deterministic seek-and-pause controls, accepting a slightly taller transcript layout during active inspection.

## Context

- We are implementing Backlog #29 work package 29B ("Watch-mode sentence inspection") in the desktop media workspace.
- Clicking a Korean transcript sentence must pause playback and open a contextual breakdown popover/overlay showing the natural meaning, phrase chunks, progressive grammar/nuance, and learner actions.
- The transcript container has `max-h-[28rem] overflow-y-auto`. Any absolutely positioned floating tooltip or card placed inside this container would get clipped or cut off by the container's overflow boundaries unless we use expensive portal portals or viewport math.
- The YouTube iframe player is loaded asynchronously. If a learner clicks a sentence *before* the Player API is initialized (`isReady === false`), the seek-and-pause action is lost, or it defaults to autoplay upon loading, which contradicts our pause-on-inspection requirement.

## Options Considered

### Option A: Viewport-floating absolute popover (using React Portal)
Mount the popover outside the scroll container (e.g. at the `body` level) and compute coordinate positioning relative to the selected segment button.
- **Pros:** True floating tooltip aesthetic.
- **Cons:** High complexity to manage scroll-repositioning, boundary collision detection, and window resize hooks. Adds substantial JS overhead.

### Option B: Inline expanding card nested in the transcript container
Render the card dynamically within the same flex/block flow right below the selected segment button inside the scroll container.
- **Pros:** Extremely robust. Naturally pushes down nearby items without layout jumps or page clipping. Perfect collision containment (handled natively by browser scroll). Preserves transcript scroll context. Low JS footprint. Highly keyboard accessible.
- **Cons:** Increases the height of the scrollable transcript area during sentence inspection.

| Option | Pros | Cons |
|--------|------|------|
| Option A | Floating tooltip aesthetic | Complex viewport coordinate math, high JS overhead, portal boundary issues. |
| Option B | Zero clipping risk, natural scroll integration, simple focus management | Temporary taller transcript layout. |

## Decision

Chosen: **Option B**, because it provides 100% deterministic clipping prevention inside the overflow-y-scroll transcript panel, matches the reference layout in `DESIGN.md`, and allows a highly accessible implementation without adding third-party portal/floating libraries.

Additionally, we decided to introduce `pendingPlayStateRef` inside the `useYouTubePlayer` hook to capture any pending pause or play commands issued while `isReady` is false, applying them atomically along with any pending seeks once `onReady` fires.

## Consequences

- **Easier:** No overflow clipping or viewport coordinate math issues. Focus return is trivial since the popover element is structurally nested under the active transcript button.
- **Harder:** The transcript sidebar scrolls down slightly to accommodate the inline popover height.
- **Risks:** (None identified; the layout behavior is fully native and verified to work correctly on Chrome/Safari/Firefox).

## Artifacts

- Implementation PR: GitHub #56
- Component: `apps/web/components/sentence-breakdown-popover.tsx`
- Integration: `apps/web/components/video-transcript-viewer.tsx` and `apps/web/components/study-session.tsx`
