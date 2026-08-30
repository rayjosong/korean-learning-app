# Backlog #22: Revisit old content implementation plan

## Status and scope

This plan completes backlog #22, **Revisit old content**. Its product surface is **Study**, with a supporting comparison on **Progress** when a stored revisit result is available. Replay returns the learner to the existing Watch/Study media workspace; it does not create a new top-level destination.

The feature must let a learner return to a video they have studied, replay it in context, and see an honest Then versus Now estimate when two valid observations of that same video exist. It must not turn review recall, a global learner profile, or a difficulty prediction into an unqualified measure of comprehension.

The backlog checkbox remains unchecked during planning. Mark it complete only after every acceptance criterion and the verification gate below pass.

## Existing foundation

The repository already contains a partial implementation from earlier work:

- `packages/learning-engine/src/revisit.ts` defines a pure `ContentProgressSnapshot`, creates a likely-comprehension midpoint from the existing difficulty estimate, and compares two snapshots.
- `packages/storage/src/index.ts` owns the IndexedDB `contentProgressSnapshots` table plus per-video read/write helpers.
- `apps/web/lib/load-revisit-progress.ts` coordinates the storage read, learner-state-based estimate, comparison, and write.
- `apps/web/components/revisit-notice.tsx` renders loading, unavailable, first-visit, and comparison states, including an optional Replay action.
- `apps/web/components/study-session.tsx` currently mounts that notice above the video/transcript workspace.

The remaining work is to validate this foundation against #22, define one meaningful snapshot/capture rule, make prior-study detection and replay reliable, expose the comparison only where evidence supports it, and add the required deterministic browser, visual, and accessibility coverage.

## Product and UX contract

### Information hierarchy

- The Korean video and transcript remain dominant. Revisit guidance is a compact, contextual Study surface, not a dashboard card.
- The first encounter quietly records a baseline. It must not claim improvement.
- On a valid later revisit, show the same video's earlier estimated likely-comprehension range, date, current range, and elapsed time in a clear `Then` / `Now` structure.
- Label the result as an **estimated likely comprehension** comparison. Do not present it as quiz performance, an exact percentage, or a global Korean score.
- `Replay video` is a normal secondary action that routes into the existing media session. It preserves the product loop: Watch -> Study -> Review, rather than adding a separate exercise.
- Progress may surface the latest valid comparison as comprehension-oriented evidence, using the `DESIGN.md` Progress hierarchy. If there is no valid pair, it shows no fabricated comparison or empty zero metric.

### Eligibility and capture semantics

A comparison is eligible only when both snapshots:

1. belong to the same non-empty video ID;
2. have valid captured timestamps in chronological order;
3. were captured at distinct, meaningful study/revisit boundaries;
4. carry a valid likely-comprehension range and source metadata; and
5. are not duplicate renders of the same session.

Define one explicit capture boundary before changing UI. Preferred V0.1 rule: persist the baseline when a learner opens a video in Study for the first time and persist a fresh observation only when that learner deliberately returns through `Replay video` or opens the same video in a later, distinct study session. Do not write a new snapshot merely because React remounted the notice, the assistance setting changed, or unrelated session state refreshed.

Use the latest eligible earlier snapshot as `Then`; use the new snapshot as `Now`. Keep the existing range visible even if the midpoint drives a concise `improved`, `unchanged`, or `lower` summary. An equal or lower estimate must use neutral wording and never frame the learner as failing.

## Architecture and data ownership

Keep the existing boundary:

```text
Study / Progress UI
  -> revisit application use case
  -> learning-engine comparison rules
  -> storage snapshot repository
  -> IndexedDB
```

### Domain: `packages/learning-engine`

- Keep snapshot validation, chronological selection, comparison status, elapsed-time calculation, and estimate presentation inputs pure and deterministic.
- Add guards for invalid IDs, malformed timestamps, reversed/equal timestamps, malformed ranges, duplicate-session snapshots, and equal-midpoint behavior.
- Do not import Dexie, React, Next.js, transcript adapters, or provider code.
- Keep `DifficultyEstimate` as the source of the estimate. Do not introduce a new scoring model, AI call, or SRS rule.

### Storage: `packages/storage`

- Continue owning the `contentProgressSnapshots` table and all Dexie reads/writes.
- Inspect the existing schema/indexes before changing them. Add a new schema version only if the chosen capture identity or query cannot be expressed safely with current `id`, `videoId`, and `capturedAt` indexes; include an upgrade test if a version changes.
- Ensure per-video reads return enough records to select the latest valid earlier snapshot deterministically.
- Keep snapshots and learner data local. Do not include provider configuration or API keys.

### Application: `apps/web/lib`

- Refactor `loadRevisitProgress` into an explicit action/use case with separate read/compare and capture responsibilities if that is needed to prevent render-triggered writes.
- Inject `now` and the capture/session identity for deterministic tests.
- Normalize storage failures to the existing plain, actionable error state.
- Route replay through the existing session/video navigation path; do not let the component construct arbitrary persistence queries or player state.

### UI: `apps/web/components` and `apps/web/app`

- Make the Study notice render a quiet first-visit state only after the baseline succeeds.
- Render a detected revisit with Korean-first media hierarchy intact, a visible non-colour `Then` / `Now` label, date/elapsed context, estimated-range wording, and a secondary Replay control.
- Keep loading and error states compact; errors use `role=alert` and must not imply data loss.
- If exposing the latest result on `/progress`, add it as a restrained `ProgressComparison` section below the existing recent-review-recall evidence, never as equal KPI cards.
- Preserve the current Watch/Study selection, transcript position, explanation, and learner-action behaviors.

## Ordered implementation plan

### 1. Audit and pin the existing behaviour

- Trace all `ContentProgressSnapshot` writers and all ways `StudySession` mounts or changes sessions.
- Confirm whether the current `sessionId` is stable across an intended session and new for a real revisit.
- Document the chosen capture boundary in code comments/tests where future refactors could otherwise regress it.
- Compare the existing notice against the #22 acceptance criteria and `DESIGN.md` Progress reference.

Exit: there is one documented definition of a revisit and no unanswered duplicate-write path.

### 2. Harden the pure comparison contract

- Add/extend unit tests for first visit, distinct later visit, improved/lower/unchanged outcomes, invalid timestamps, ordering, invalid ranges, duplicate identity, and elapsed-day boundaries.
- Select the most recent valid earlier snapshot, not merely the lexicographically last record.
- Keep range data and source metadata in the read model so the view can use honest labels without recomputing rules.

Exit: the domain can decide whether comparison data exists without UI or IndexedDB.

### 3. Make capture and detection reliable

- Ensure the first eligible study visit creates one baseline record.
- Ensure a deliberate later revisit creates exactly one new observation, then compares it with the prior eligible record.
- Prevent passive rerenders, retry UI, and settings changes from creating observations.
- Add storage/application tests for one baseline, retrieval by video, duplicate protection, corrupted records, and controlled write/read errors.

Exit: opening a previously studied video is detectable and cannot inflate history through rendering.

### 4. Complete the Study replay flow

- Show the first-visit state only after the baseline is stored.
- On later visits, render `Then` and `Now` with a date, elapsed time, range, and neutral status copy.
- Make Replay accessible by keyboard and route it through the established workspace entry path with the same video URL/ID.
- Verify replay preserves normal Watch defaults and does not bypass transcript loading, assistance preference, or player error handling.

Exit: a learner can detect prior study, replay the content, and understand the comparison without leaving the canonical media flow.

### 5. Add the restrained Progress evidence (if the existing page has a valid latest pair)

- Extend the progress application read model rather than querying Dexie from a component.
- Render one latest eligible comparison beneath recent recall, or omit the section when no pair exists.
- Match the Warm Korean Editorial reference: whitespace and hairlines, no new dashboard grid, and comparison terminology that says estimate.

Exit: Progress can communicate content-level improvement only when the data supports it.

### 6. Add regression coverage and visual QA

- Add deterministic fixtures for a first visit, valid revisit, lower/unchanged revisit, malformed history, and replay navigation.
- Add component/integration tests for copy, non-colour Then/Now labels, first-visit behaviour, errors, and replay invocation.
- Add Playwright coverage for opening a previously studied fixture, observing the comparison, replaying it, and retaining the normal media workspace.
- Capture Study revisit and populated Progress comparison desktop screenshots only if the Progress surface changes.
- Run axe on the new states and verify keyboard activation, visible focus, landmark order, and non-colour state communication.

Exit: the critical feature is covered without live YouTube, live provider, or clock dependence.

## Acceptance-criteria mapping

| #22 criterion | Planned proof |
| --- | --- |
| Previously studied content detected | Per-video snapshot/history lookup plus application and browser fixture tests. |
| Progress can be compared across time | Pure chronological comparison tests and a rendered valid-pair state. |
| Replay offered | Accessible `Replay video` control and browser route/session assertion. |
| Then vs Now comprehension when data supports it | Valid-pair UI shows date, elapsed time, and estimated likely-comprehension ranges with clear Then/Now labels; first/invalid history renders no comparison claim. |

## Verification gate before completion

Run from the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
```

Also perform rendered desktop QA against the Study and Progress references in `DESIGN.md`; attach screenshots to the implementation PR. Do not use live YouTube or a live AI provider as deterministic proof. A separate real-service smoke check may remain optional and must be reported honestly.

## Out of scope

- A quiz, comprehension test, streak, badge, score, charting library, or new learner model.
- Accounts, cloud sync, analytics, provider calls, or API-key persistence changes.
- A new top-level Revisit destination or a mobile-first redesign.
- Export/import changes owned by #25 and #26.

## Documentation and backlog completion

On the implementation PR, update the appropriate authoritative documents only if the delivered behaviour changes this plan's product, design, architecture, or test contract. Re-read #22's four criteria, run the full verification gate, and only then mark its top-level checkbox in `docs/BACKLOG.md` complete and add QA evidence.
