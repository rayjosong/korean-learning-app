# Backlog #21: Progress dashboard implementation plan

## Status and scope

This plan completes the remaining product and verification work for backlog #21 on the Progress surface.

PR #49 already merged the local data foundation:

- a pure progress aggregator in packages/learning-engine/src/progress.ts;
- a consistent Dexie read in packages/storage/src/index.ts;
- studied-content persistence;
- loading, error, empty, and populated component states;
- deterministic unit and storage tests.

PR #32 later restyled the small Progress panel and added populated/empty visual coverage. The current panel is still inside the collapsed Workspace Utilities & Settings area of an active Watch/Study session. It presents every value as an equal KPI card. That does not yet satisfy the canonical top-level Progress information architecture or the comprehension-first hierarchy in PRODUCT.md and DESIGN.md.

This implementation must:

- create the canonical desktop-first Progress destination;
- preserve and extend the existing local-only data foundation;
- make evidence from review and recall visually primary;
- keep counts and activity as supporting context;
- avoid claiming a direct comprehension measurement that the app does not have;
- avoid implementing backlog #22's Then vs Now content comparison early;
- remove the duplicate dashboard from collapsed Watch/Study utilities once the top-level destination exists.

This is a refinement of merged work, not a rewrite of PR #49 and not a new analytics system.

## Product surface

Surface: Progress.

The page answers:

> What evidence shows that my Korean is improving?

It does not answer What should I do next? That remains Home. It also does not become an administration or analytics dashboard.

## Dependencies and boundaries

- Backlog #18 is complete and provides the learner-state/confidence foundation required by #21.
- Backlog #19 is still incomplete. #21 must not depend on unfinished difficulty-estimate behavior.
- Backlog #22 owns revisiting old content and Then vs Now comprehension comparisons. #21 may leave a calm explanatory empty/future state, but must not fabricate or re-label review success as measured content comprehension.
- Backlog #32 is complete. The Progress page must reuse its semantic tokens, local Pretendard font, accessibility rules, and deterministic browser infrastructure.
- All data stays local in IndexedDB. No analytics service, account, cloud sync, AI request, or provider credential belongs in this feature.

## Current implementation baseline

### Reuse

- packages/learning-engine/src/progress.ts owns deterministic progress aggregation.
- packages/storage/src/index.ts owns the consistent read across learningItems, reviewRecords, explanations, and studiedContent.
- apps/web/lib/load-progress-snapshot.ts is the application boundary between storage and the view.
- apps/web/components/progress-dashboard.tsx already models loading, ready, empty, and error states.
- apps/web/lib/fixture-session.ts seeds learner, review, explanation, and studied-content data.
- apps/web/e2e/visual.spec.ts already captures the legacy populated and empty utility panel.

### Replace or refine

- apps/web/app/page.tsx renders Progress as a disabled navigation label.
- apps/web/components/study-session.tsx mounts Progress inside collapsed workspace utilities.
- ProgressDashboardView renders a grid of equal metric cards, which conflicts with the comprehension-first hierarchy.
- Review success is currently all-time. The page needs explicit wording and a documented time scope so the number cannot be mistaken for current content comprehension.
- There is no canonical /progress route, page-level empty state, navigation behavior, or direct browser journey.

## Information hierarchy

The canonical populated desktop page should use this order:

1. Page title and a short local-data explanation.
2. Primary learning evidence: recent review recall with successful/total denominator and explicit time window.
3. Supporting learning state: known and learning phrase counts.
4. Learning activity: explanations requested and distinct content studied.
5. A restrained note that content-level Then vs Now comparisons appear only when enough revisit data exists; #22 owns that behavior.

The empty page should explain how progress evidence is created and provide one useful path back to learning. It must not render five prominent zero cards.

Do not add:

- XP, streaks, levels, badges, ranks, goals, or celebratory effects;
- generic charting dependencies for a handful of sparse values;
- fake trend arrows or percentages without a valid baseline;
- a single composite score;
- provider-branded AI language;
- English or Korean content that competes with the actual learning evidence.

## Metric definitions

All definitions must be encoded in pure aggregation tests and reflected in UI copy.

### Recent review recall

- Primary measure on the page.
- Count successful and total review records within a fixed 30-day rolling window ending at now.
- Show both numerator and denominator, for example 8 of 10 recalled (80%).
- If there are no reviews in the window, show No recent reviews rather than 0%.
- Label this as review recall or review success, never as total Korean comprehension.
- Keep an all-time total only if it adds quiet context and does not compete with the recent result.

### Known items

- Count saved learner items whose current state is known.
- Label them phrases and words, or learned items, so the UI does not imply a full vocabulary-size estimate.

### Learning items

- Count saved learner items whose current state is learning.
- Do not include due-review count unless it is already available through the same coherent snapshot and remains secondary; due work belongs primarily on Home and Review.

### Explanation activity

- Count persisted sentence explanations created in the last seven days, preserving the existing deterministic boundary behavior.
- Describe this as activity, not improvement. A high count can mean curiosity or difficulty.

### Content studied

- Count unique non-empty video IDs in studiedContent.
- Do not count repeated sessions as new content.
- If recent titles/last-studied dates are shown, derive them from existing stored records without adding a schema migration.

### Time and invalid records

- Pass now into the domain aggregator.
- Include records exactly on the lower boundary and at now.
- Exclude future-dated and invalid timestamps from rolling windows.
- Never divide by zero or show false precision.

## Architecture and ownership

Keep the flow:

Progress page UI
  -> progress load use case
  -> pure progress aggregation
  -> storage snapshot query
  -> Dexie tables

### Domain

packages/learning-engine/src/progress.ts:

- owns metric definitions, time windows, counting, denominators, and empty semantics;
- returns a presentation-ready read model without JSX or Dexie imports;
- remains deterministic for a supplied now value;
- must not import provider, transcript, Next.js, or browser modules.

### Storage

packages/storage/src/index.ts:

- continues to read source records in one read transaction;
- must not calculate percentages or presentation labels;
- should not add a new Dexie version unless a demonstrated requirement cannot be met from existing tables;
- must preserve provider settings, assistance settings, learner data, review data, and content history.

### Application

apps/web/lib/load-progress-snapshot.ts:

- coordinates the storage read and domain aggregation;
- normalizes errors into actionable UI state;
- accepts an injected now for deterministic tests;
- contains no React rendering.

### UI

- Add a top-level /progress route and a client boundary that creates/closes the local database safely.
- Refactor ProgressDashboardView into domain-specific sections rather than generic repeated Metric cards.
- Reuse a shared primary-navigation component if needed to make Progress a real link on both Home/Watch and Progress without duplicating navigation markup.
- Keep Library, Review, and Settings placeholders unchanged unless their existing routes are already available. Do not broaden this task into navigation work for unrelated surfaces.
- Remove the nested ProgressDashboard from Workspace Utilities & Settings after the canonical route is reachable.
- The page reads through the application loader; UI components never query Dexie directly.

## Canonical states

### Populated

- Progress navigation link has an active non-color cue.
- Recent review recall is the first and strongest evidence block.
- The denominator and 30-day scope are visible.
- Known/learning counts sit together as supporting learner state.
- Explanation activity and content studied have quieter typography.
- Copy states that data is local to this browser/device.

### No recent reviews, other activity exists

- Do not show 0%.
- Explain that reviews create recall evidence.
- Preserve known, learning, explanation, and content activity below.

### Fully empty

- Show one coherent empty state, not a wall of zero cards.
- Explain that learning phrases, requesting explanations, studying content, and completing reviews will build the page.
- Provide a normal link back to Home or Continue learning.

### Loading

- Preserve page hierarchy with a calm status/skeleton.
- Do not flash a misleading all-zero ready state before IndexedDB loads.

### Error

- Use role=alert with a plain local-data error message and Retry action.
- Do not expose adapter stack traces or imply learner data was deleted.

## Ordered implementation plan

### 1. Pin and test the read model

- Extend ProgressSnapshot with the explicitly scoped recent-review summary.
- Preserve known, learning, explanation, and unique-content metrics.
- Add tests for 30-day boundaries, future/invalid dates, empty denominators, mixed outcomes, duplicate content, and current-state counts.

Exit: pure tests define every user-visible number and no metric depends on UI code.

### 2. Confirm the storage and application seams

- Reuse getProgressSnapshotInput and loadProgressSnapshot.
- Add application tests for ready/error behavior and injected time if absent.
- Add no schema version unless inspection proves an existing table cannot support the page.

Exit: one coherent local snapshot reaches the view through the application boundary.

### 3. Create the canonical route and navigation

- Add /progress using the existing Next.js App Router.
- Make Progress a real primary-navigation link from the existing shell.
- Mark the active destination semantically and visually without relying only on color.
- Ensure direct reload at /progress works.

Exit: Progress is reachable without opening a video or expanding workspace utilities.

### 4. Implement the comprehension-first page hierarchy

- Replace the equal KPI grid with the hierarchy defined above.
- Keep review recall primary and label it honestly.
- Place counts/activity in secondary editorial groupings with whitespace and hairlines.
- Implement loading, no-recent-review, fully empty, and error states.
- Remove the duplicate nested Progress panel from StudySession.

Exit: the rendered page follows DESIGN.md's Progress reference and cannot be mistaken for a generic SaaS dashboard.

### 5. Add deterministic fixtures and component coverage

- Add route-level populated, partial, empty, loading, and error fixture states.
- Reuse seeded IndexedDB records and the pinned browser clock.
- Avoid live YouTube and live provider requests.
- Cover semantic headings, labels, denominator copy, empty guidance, retry, and active navigation.

Exit: component/integration tests prove all meaningful page states and UI/storage collaboration.

### 6. Add browser, visual, and accessibility protection

- Add a direct Home/Watch -> Progress navigation journey and direct /progress reload.
- Capture populated and empty canonical desktop screenshots at 1440 x 900.
- Add a compact desktop check if layout wrapping changes below the canonical width.
- Run axe on populated and empty states.
- Verify keyboard navigation, Retry, focus visibility, landmark order, and active-link semantics.
- Replace or retire the legacy utility-panel screenshots so duplicate visual contracts do not remain.

Exit: the canonical route, not the collapsed legacy panel, owns Progress regression coverage.

### 7. Verify and close the backlog item

- Inspect rendered screenshots against PRODUCT.md and DESIGN.md.
- Run every standard and browser gate.
- Add docs/QA-21.md with acceptance evidence and screenshot references.
- Embed populated and empty screenshots directly in the implementation PR description.
- Mark #21 and all criteria complete only after every criterion passes on the final branch state.

Exit: #21 has implementation, evidence, and green CI; #22 remains separate.

## Expected file map

Likely updates:

- packages/learning-engine/src/progress.ts
- packages/learning-engine/test/progress.test.mjs
- packages/storage/src/index.ts only if the read shape needs adjustment
- packages/storage/test/progress.test.mjs only for storage behavior changes
- apps/web/lib/load-progress-snapshot.ts
- apps/web/lib/load-progress-snapshot.test.mjs
- apps/web/components/progress-dashboard.tsx, or a clearer Progress-surface component name
- apps/web/components/progress-dashboard.test.tsx
- apps/web/components/study-session.tsx
- apps/web/app/progress/page.tsx
- apps/web/app/page.tsx and/or a shared primary-navigation component
- apps/web/lib/fixture-session.ts
- apps/web/e2e/fixture.ts
- apps/web/e2e/progress.spec.ts or the existing focused browser specs
- apps/web/e2e/visual.spec.ts
- apps/web/e2e/a11y.spec.ts
- apps/web/e2e/visual.spec.ts-snapshots for intentional reviewed baselines
- docs/QA-21.md
- docs/BACKLOG.md after verification

The implementer must re-inspect main before editing and adjust this list to current ownership. Do not create files only to match the plan.

## Verification matrix

| Contract | Unit | Component/integration | E2E | Visual | A11y |
| --- | --- | --- | --- | --- | --- |
| Recent review recall and denominator | required | required | required | required | label semantics |
| Known and learning current-state counts | required | required | required | required | headings/read order |
| Seven-day explanation activity | required | required | required | supporting | label semantics |
| Unique content studied | required | required | required | supporting | label semantics |
| Empty/no-review semantics | required | required | required | required | required |
| Loading/error/retry | boundary | required | required | as useful | required |
| Top-level navigation and direct reload | not applicable | optional | required | required | required |
| Comprehension-first visual hierarchy | not applicable | semantic assertions | required | required | reading order |

## Acceptance-criteria mapping

| Backlog #21 criterion | Required evidence |
| --- | --- |
| Known items | Pure current-state count test, rendered label/value, populated browser assertion. |
| Learning items | Pure current-state count test, rendered label/value, populated browser assertion. |
| Review success | Fixed-window boundary tests, successful/total denominator, honest no-review state, populated/partial browser assertions. |
| Explanation frequency | Seven-day deterministic boundary tests and supporting activity copy. |
| Content studied | Unique-video deduplication test and rendered count; repeat sessions do not inflate it. |
| Comprehension-oriented information is visually prioritized over vanity metrics | Recent recall evidence is the primary page block; counts/activity are secondary; no XP, streak, composite score, or false comprehension label. Verified by rendered review and screenshot. |
| Layout follows DESIGN.md rather than a generic KPI-card dashboard | Canonical Progress route screenshot, editorial grouping with whitespace/hairlines, limited card use, semantic tokens, local Pretendard, and explicit visual QA. |

## Regression risks and guards

- Misleading percentage from tiny or stale samples: show numerator, denominator, and fixed window; use a no-reviews state.
- False comprehension claim: call the primary metric review recall/success; reserve content-level Then vs Now for #22.
- Duplicate Progress surfaces drifting: remove the collapsed workspace copy when the route lands.
- IndexedDB load flash: use a real loading state rather than an initial zero snapshot.
- Time-dependent flakes: inject now and pin the Playwright clock.
- Fixture writes racing the page read: seed before the route loader resolves and wait on observable ready state.
- Accidental schema churn: prefer existing tables and add no migration without a demonstrated data need.
- Visual regression masked by baseline updates: inspect and explain intentional screenshots; do not blindly regenerate.
- Watch/Study regression from utility removal: retain existing Watch/Study behavioral and visual gates.

## Required final verification

Run from the repository root:

    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build
    pnpm test:e2e
    pnpm test:a11y
    pnpm test:visual

Also perform rendered desktop review against DESIGN.md and record populated/empty screenshots in docs/QA-21.md and the implementation PR body.

Live YouTube or live AI-provider smoke testing is not required for #21 because the page reads local persisted data and must have no external-service dependency. If implementation changes a shared live-content seam, document and run the applicable smoke check separately.

## Completion rule

Keep backlog #21 unchecked until the canonical route, all seven criteria, full CI/browser gate, accessibility checks, visual QA, and screenshot evidence pass on the latest commit. Planning completion alone does not change any checkbox.
