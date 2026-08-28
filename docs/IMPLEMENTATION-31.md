# Backlog #31 - Original-context video review implementation plan

## Assignment

- Canonical backlog: [#31 Original-context video review](BACKLOG.md#31-original-context-video-review).
- Product surface: Review.
- Dependency: #29 is complete. Rebase the implementation branch on the latest merged `main` before coding.
- Status: planning only. This document does not complete any #31 criterion.

## Product contract

Review should preserve the source where a learner met a phrase. The canonical flow is:

```text
due learning item
-> resolve its most recent usable source context
-> show short source-video clip and Korean prompt
-> learner recalls
-> explicit reveal of natural meaning and source context
-> Again or Got it
-> persist review outcome and scheduling change
```

Rules:

1. Korean sentence or phrase is visible before answer reveal. English meaning is not.
2. A playable source clip is preferred, never required for a valid review.
3. Missing, stale, unavailable, or failed playback must fall back to Korean sentence plus source timestamp/context.
4. Playback failure cannot prevent Again/Got it, learner-state updates, or the next due item.
5. Review outcomes remain deterministic in `packages/learning-engine`; React components do not calculate schedules or write Dexie tables.
6. No live YouTube or provider dependency belongs in deterministic CI. Use the existing fake-player and fixture seams.
7. Do not remove the existing cloze flow without an explicit compatibility path. It stays available as an alternate exercise while source-context review is introduced.

## Current starting point

| Area | Current responsibility | #31 change |
| --- | --- | --- |
| `LearningItem` | Stores context ids and next review timestamp. | Remains learner-state source of truth. |
| `LearningContextRecord` | Stores video, transcript segment, sentence, and time range. | Add read/query helpers to resolve a review context. |
| `ReviewRecord` | Persists mode/outcome/time. | Preserve it and record source-context review outcomes. |
| `DeterministicReviewScheduler` | Calculates next review date. | Reuse through an application use case. |
| `ClozeReviewPanel` | Existing Review UI. | Preserve as compatible alternate/fallback, not silently replace. |
| Player hook/fixture | Owns video player commands and deterministic fake player. | Add a bounded review-clip adapter seam rather than direct player SDK use in panel code. |

## Architecture

```text
Review UI
-> review-session application use case
-> learning-engine scheduler + storage interfaces
-> Dexie storage / player adapter
```

Create a small application boundary, for example `apps/web/lib/review-session.ts`, with explicit operations:

```ts
loadNextContextualReview(database, now)
revealReviewAnswer(session)
completeContextualReview(database, { itemId, outcome, now })
```

It resolves the due item, selects a context deterministically, invokes the existing scheduler, persists the updated item and `ReviewRecord`, and returns presentation data. It must not call an AI provider.

Storage additions belong in `packages/storage`. Add only the helpers needed to:
- list a learning item's contexts;
- resolve the newest usable context deterministically;
- persist the review outcome atomically with the updated item;
- preserve the existing cloze record semantics.

If a schema change is required, increment Dexie once and add a real migration test from the current schema version. Do not add a schema version just for derived UI state.

## Context selection and fallback

Choose the most recently created context for a due item that has:
- non-empty video id;
- transcript segment id;
- Korean sentence;
- non-negative start and end times where end is after start.

Use an explicit bounded clip window:
- preferred: source segment start through end;
- if the duration is too short, pad before/after within non-negative bounds;
- cap the review clip at 20 seconds;
- do not seek outside source bounds supplied by the adapter.

Presentation states:

| State | Visible content | Available action |
| --- | --- | --- |
| Loading | Korean phrase/sentence and quiet loading state | Skip only if no due item can resolve |
| Recall | Korean prompt, source title/timestamp, clip if available | Reveal answer |
| Revealed | Korean prompt, natural meaning, source timestamp/context | Again, Got it |
| Playback unavailable | Korean prompt, source timestamp/context, compact non-blocking notice | Reveal, Again, Got it |
| Context missing | Existing cloze-compatible review or explicit no-context fallback | Complete review without clip |
| Empty queue | Existing calm empty state | Return to learning |

Do not expose raw player/provider errors. The fallback notice should say that the source clip is unavailable and preserve the timestamp for manual return to the video.

## Ordered implementation

### 1. Establish contracts

- Inspect current `ClozeReviewPanel`, review storage tests, fixtures, player hook, and e2e review scenarios.
- Add pure tests for context ranking, clip bounds, and fallback decision.
- Define a typed `ContextualReviewSession` with item, context, reveal state, and playback availability.

Exit: no UI change; behavior is deterministic and testable.

### 2. Add storage and application use case

- Add storage read helpers for an item's contexts and an atomic completion helper.
- Keep `putReviewRecord`, learner item update, and schedule result in one transaction.
- Reuse `DeterministicReviewScheduler` and `applyReviewOutcome`.
- Test success and failure outcomes, mode, next due date, record persistence, missing context, and idempotent empty queue behavior.

Exit: a caller can complete a contextual review without React or a real player.

### 3. Add source-clip adapter

- Introduce an adapter interface owned by the application layer, not the UI:
  `loadClip({ videoId, startTimeMs, endTimeMs })`, `play()`, `pause()`, `status`.
- Reuse the existing YouTube player where possible; do not create a second provider-specific player implementation.
- Bound seeking, avoid autoplay on entering Review, and make every error recoverable.
- Add a fake adapter to the fixture boundary with observable load/seek/play calls.

Exit: source playback is replaceable and independently testable.

### 4. Build the Review surface

- Add a domain-specific contextual review panel adjacent to the existing cloze panel.
- Recall state is Korean-first. Reveal is explicit and keyboard-operable.
- Show source timestamp as a link/action back to Watch when a source session is available.
- Show Again/Got it only after reveal, then advance cleanly without duplicate persistence.
- Preserve desktop editorial hierarchy: media/context first, one clear recall action, restrained supporting copy.
- Keep mobile functional without redesigning the desktop Review experience.

Exit: the full preferred flow works with a fixture video and the no-clip fallback stays usable.

### 5. Regression coverage and QA

Unit and storage:
- context ranking, clip bounds, scheduler transitions, atomic persistence, unavailable/missing context.
Component:
- Korean-before-reveal, reveal content, outcome actions, local error notice, cloze compatibility.
Browser:
- due item -> contextual clip -> reveal -> Got it -> next item;
- Again updates schedule and stays independent of playback;
- unavailable player still completes review;
- source timestamp returns to the correct Watch segment when session is available;
- no-context item uses its documented fallback.
Accessibility:
- focus starts on the Korean recall prompt/reveal action;
- reveal state is announced;
- keyboard reaches playback, reveal, Again, and Got it;
- axe passes on recall, revealed, unavailable-clip, and empty states.
Visual:
- 1440x900 recall, revealed, and unavailable-clip states;
- 1024x768 no-overflow assertion;
- review screenshots must preserve Warm Korean Editorial hierarchy.

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
```

Create `docs/QA-31.md` only after the final implementation commit is green. It must map every backlog criterion to tests and rendered QA. Embed the requested screenshots directly in the implementation PR description.

## Acceptance mapping

| #31 criterion | Required proof |
| --- | --- |
| Resolves video, segment, timestamp | Storage/application test and fixture browser assertion. |
| Attempts short source clip | Fake adapter call assertion and review screenshot. |
| Korean before reveal | Component, E2E, accessibility assertion. |
| Learner recalls before reveal | Explicit recall state and no outcome buttons before reveal. |
| Reveal has natural meaning/context | Component/E2E assertion. |
| Again/Got it | Application outcome tests and browser advance flow. |
| Scheduler independent of clip | Unavailable-player E2E plus pure scheduler test. |
| Playback fallback | No-clip panel state and browser assertion. |
| Cloze not silently removed | Existing cloze tests retained; explicit coexistence/fallback test. |
| Rendered Review verified | Reviewed screenshots, visual regression, and QA-31 evidence. |

## Out of scope

Do not add accounts, cloud sync, new SRS algorithms, AI-generated review prompts, native mobile, or a general video-editor/timeline feature. Do not change Watch/Study semantics except the narrow source-return integration.

## Required implementation PR report

```text
Backlog item
#31 Original-context video review

Status
complete | partial | blocked

Verification
- tests
- browser E2E
- visual regression
- accessibility
- typecheck
- lint
- build
- UX/rendered flow

Files changed
- exact paths

Remaining
- none, or exact gap

Recommended next item
#33 ...
```
