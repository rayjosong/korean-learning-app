# Backlog #23 - Continue-learning home screen implementation plan

## Purpose

Implement the canonical Home surface described by `docs/PRODUCT.md` and `DESIGN.md`: a calm local-first starting point that answers "What should I do next?" by combining continuation, due review, recent content, and the existing new-video entry point.

This is not a metrics dashboard and must not duplicate existing study, review, or persistence logic.

## Product surface

Home.

Primary user outcome:

```text
open app
-> immediately see the most useful next action
-> resume recent study OR start due review OR reopen recent content OR paste a new video
```

## Current constraints and source-of-truth rules

Follow, in order:

1. `AGENTS.md`
2. `docs/PRODUCT.md`
3. `DESIGN.md`
4. `docs/ARCHITECTURE.md`
5. `docs/TESTING.md`
6. `docs/BACKLOG.md`

Important constraints:

- Desktop web is canonical for V0.1.
- Home must answer "What should I do next?" and must not become a generic KPI-card dashboard.
- Reuse existing local-first storage and application boundaries.
- React must not query or mutate Dexie tables directly.
- Do not add accounts, cloud sync, analytics, streaks, XP, or AI-generated recommendations as part of #23.
- Recommendation data is optional in #23. Backlog #24 owns the recommendation engine.
- Existing Watch / Study / Review behavior must remain unchanged.

## Acceptance criteria

Backlog #23 requires:

- Resume unfinished/recent video.
- Due review surfaced.
- Recent content surfaced.
- Recommended content can be surfaced when recommendation data exists.
- New-content entry point exists.
- Home mixes continuation, review, and content discovery in one calm hierarchy.
- Home answers "What should I do next?" and does not become a generic metrics dashboard.
- Desktop layout follows the `DESIGN.md` Home reference hierarchy.

## Proposed Home hierarchy

Follow the existing `DESIGN.md` reference rather than inventing another dashboard composition:

```text
Home

Greeting / lightweight orientation

Continue learning
[one primary resumable item]

Due review
[review count + direct action]

Recent / recommended content
[small content row]

Start something new
[existing YouTube URL entry point]
```

Priority order:

1. resumable study when one exists;
2. due review when items are due;
3. recent/recommended content;
4. new-video entry point always available.

Do not show empty cards for unavailable sections. Collapse absent sections cleanly.

## Domain and application model

### 1. Define a Home read model

Create a small application-facing read model instead of assembling arbitrary storage records in React.

Suggested shape:

```ts
interface HomeSnapshot {
  resume?: ResumeContent;
  dueReviewCount: number;
  recentContent: RecentContent[];
  recommendedContent?: RecommendedContent[];
}

interface ResumeContent {
  videoId: string;
  sourceUrl: string;
  title?: string;
  lastPositionMs: number;
  durationMs?: number;
  updatedAt: string;
}
```

The exact naming may follow current repository conventions, but the separation is required:

```text
Home UI
-> Home application/use case
-> storage read helpers
-> persisted local data
```

### 2. Reuse existing sources of truth

Before adding persistence, inspect the current merged schema and reuse existing records wherever possible:

- studied content / content history;
- content-progress snapshots;
- learning contexts;
- review queue / due-review records;
- existing video IDs, source URLs, timestamps, and transcript metadata.

Do not add another "recent videos" table if current storage already represents the needed data.

Add persistence only for information that is genuinely missing, such as a resumable playback position or explicit unfinished/completed state.

### 3. Resume semantics

Define an explicit resumable-progress rule.

Recommended V0.1 behavior:

- save playback position only after a video has loaded successfully;
- update progress through a throttled application callback, not every React render;
- identify one most-recent unfinished item for the primary Continue action;
- restoring a video should pass the saved position into the existing media session rather than create a new player path;
- opening a video does not automatically mark it complete;
- completion must be based on a documented rule or remain "recent" if no reliable completion signal exists.

Do not infer completion merely because the learner reached the route once.

### 4. Due-review summary

Reuse the current scheduler / queue logic.

Home only needs enough information to surface the action:

```text
8 phrases ready for review
Review ->
```

Do not duplicate scheduling calculations in Home.

The count and ordering should come from the same domain/application behavior used by the Review surface.

### 5. Recent content

Recent content should be deterministic and local-first.

Recommended ordering:

- most recently studied first;
- deduplicate by video ID;
- exclude the primary resume item from the recent row when that would create obvious duplication;
- keep the displayed list intentionally small.

Each item should route back through the existing video loading flow.

### 6. Recommendation seam

#23 must support recommendation data when it exists, but must not implement backlog #24.

Define a small optional seam such as:

```ts
recommendedContent?: RecommendedContent[]
```

or a compatible application-level input.

When no recommendation provider exists, Home should simply render recent content.

Do not call an AI provider from Home to fill this section.

## Storage changes

First inspect the latest `packages/storage` schema.

If resume state cannot be represented with existing records, add the minimum local record needed, for example:

```ts
interface ContentResumeRecord {
  videoId: string;
  sourceUrl: string;
  lastPositionMs: number;
  durationMs?: number;
  completed: boolean;
  updatedAt: string;
}
```

Requirements for any schema change:

- add the next Dexie schema version;
- preserve all existing tables and data;
- add a migration test from the immediately previous version;
- do not persist credentials or provider settings in Home data;
- do not duplicate existing content metadata unnecessarily.

If the existing schema already supports this information, do not add a migration.

## Web implementation

### Home application use case

Create a focused Home loader, for example:

```text
loadHomeSnapshot(database, now)
```

Responsibilities:

- load the latest resumable content;
- load due-review count from the existing review boundary;
- load recent studied content;
- optionally accept recommendation data;
- normalize storage failures into a controlled result.

It should not own rendering decisions or AI calls.

### Home component

Build a dedicated Home surface rather than placing another utility panel inside the Watch/Study workspace.

Required states:

- brand-new learner;
- resume + due reviews + recent content;
- due reviews only;
- recent content only;
- storage error;
- loading.

The existing new-video input remains available in every usable Home state.

### Navigation

Home actions should reuse existing routes/session loaders:

- Continue -> existing Watch/Study load path with restored timestamp;
- Review -> existing Review surface;
- Recent content -> existing video load path;
- New content -> existing YouTube input flow.

Do not duplicate transcript acquisition, player initialization, or review UI.

## Visual design requirements

Match the canonical Home hierarchy in `DESIGN.md`.

Required visual behavior:

- warm editorial canvas and existing semantic tokens;
- one dominant Continue action when resumable content exists;
- review is an action row, not a KPI tile;
- recent/recommended content is visually secondary;
- whitespace and hairlines instead of a dense card grid;
- Korean/media content remains visually richer than administrative UI;
- no streaks, charts, achievement counters, or generic "stats overview" section;
- desktop 1440-ish canonical state should read clearly without requiring scrolling to discover the primary next action.

## Accessibility

At minimum:

- Home landmarks/headings provide understandable hierarchy;
- Continue, Review, recent content, and new-video actions have clear accessible names;
- keyboard navigation follows visual order;
- focus styles use the current design system;
- sections do not rely on color alone to communicate priority/state;
- loading and errors use appropriate status/alert semantics.

## Deterministic fixtures

Extend the existing fixture system instead of creating a separate browser harness.

Add deterministic Home fixture states, either as named fixtures or seeded variations consistent with current fixture conventions:

1. empty/new learner;
2. resumable content + due reviews + recent content;
3. due review without resumable content;
4. storage/error state if the current fixture infrastructure supports controlled failures.

Pin time and seeded IndexedDB data so ordering and review due state do not flap.

## Test plan

### Unit / domain

Only add pure domain tests if new pure ordering or progress-state logic is introduced.

Cover:

- unfinished/completed selection policy;
- deterministic latest-resume selection;
- recent-content deduplication/order;
- progress clamping / timestamp normalization if needed.

### Storage

Cover:

- resume record round-trip if new persistence is introduced;
- most-recent resumable selection;
- recent-content order and deduplication;
- prior-version migration preserving existing data;
- empty storage;
- controlled storage failure where practical.

### Component / integration

Cover observable Home states:

- empty learner sees new-content entry point;
- primary resume item renders when available;
- due-review count and action render;
- recent content renders without duplicating the primary resume item;
- loading and error states;
- optional recommendations render when supplied and otherwise do not leave an empty placeholder.

### Browser E2E

Add a deterministic Home golden path:

```text
open populated Home fixture
-> Continue learning is primary
-> due review is visible
-> recent content is visible
-> activate Continue
-> existing Watch workspace opens
-> restored playback position is applied
```

Add a new-learner path:

```text
open empty Home fixture
-> no fake metrics/cards
-> new-video entry point is visible and usable
```

If routing to Review is stable in the existing fixture suite, also assert Home -> Review uses the current review flow.

### Visual regression

Add a canonical Home desktop baseline, as requested by `docs/TESTING.md`.

At minimum capture:

- populated Home desktop;
- empty/new-learner Home if materially different.

Do not update baselines solely to make CI green. Review against `DESIGN.md`.

### Accessibility

Run the standard axe/browser accessibility gate on Home and add keyboard checks for the primary actions.

## Ordered implementation steps

### Step 1 - Audit current persistence and routing

Inspect:

- current Home/page composition;
- existing video input/loader;
- studied-content records;
- content progress snapshots;
- review queue loading;
- current browser fixture infrastructure.

Exit criterion: document which existing records are reused and whether a schema change is actually required.

### Step 2 - Add the Home read model and storage/application loader

Implement the minimum data aggregation needed for Home.

Exit criterion: deterministic tests prove resume selection, due count, recent ordering, and empty state without React.

### Step 3 - Add resume persistence only if missing

Wire playback progress through an application boundary and persist it with throttling.

Exit criterion: reload can restore the saved position without direct Dexie access from UI.

### Step 4 - Build the canonical Home surface

Implement the `DESIGN.md` hierarchy and reuse the existing new-video entry path.

Exit criterion: empty and populated component states match the intended hierarchy.

### Step 5 - Wire navigation

Continue, Review, recent content, and new content must enter existing flows.

Exit criterion: no duplicate player, transcript, or review implementation exists.

### Step 6 - Add deterministic browser, a11y, and visual coverage

Extend the current fixture suite and CI gates.

Exit criterion: Home has a stable golden path and canonical screenshot baseline.

### Step 7 - Final verification and backlog update

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

For user-visible work, capture rendered QA screenshots and embed them directly in the implementation PR description.

Only mark #23 complete after every acceptance criterion is verified on the merged implementation state and CI is green.

## Acceptance-criteria evidence map

| Backlog criterion | Required implementation/evidence |
| --- | --- |
| Resume unfinished/recent video | persisted/reused resume state + Home read model + E2E restoring playback position |
| Due review surfaced | reuse existing review queue/scheduler + component/E2E assertion |
| Recent content surfaced | existing studied-content source + deterministic ordering/deduplication tests |
| Recommended content can be surfaced | optional recommendation seam, no #24 engine implementation |
| New-content entry point exists | reuse existing YouTube input in empty and populated Home states |
| Calm mixed hierarchy | component structure + rendered QA against `DESIGN.md` |
| Answers "What should I do next?" | primary Continue/Review ordering and absence of KPI dashboard patterns |
| Desktop layout follows reference | deterministic visual baseline + human QA screenshot review |

## Regression risks

### Duplicate persistence

Risk: creating a new recent-content or video-history table that conflicts with existing studied-content records.

Guard: audit current schema first and reuse current data sources.

### Resume writes becoming noisy

Risk: writing playback progress continuously on every render/time update.

Guard: throttle application-level persistence and write only meaningful position changes.

### Home becoming a dashboard

Risk: exposing every available metric as equal-weight cards.

Guard: enforce the `DESIGN.md` hierarchy and keep Progress metrics on the Progress surface.

### Duplicate media flow

Risk: Continue or Recent creates a second transcript/player implementation.

Guard: route into the existing Watch/Study loader and player session.

### Recommendation scope creep

Risk: implementing #24 rule/AI recommendation behavior while working on #23.

Guard: only define/render an optional recommendation input seam.

### Browser flakiness

Risk: due times and recent ordering depend on wall-clock state.

Guard: pin the fixture clock and seed deterministic IndexedDB data.

## Explicit non-goals

Do not implement in #23:

- recommendation ranking logic from #24;
- accounts or cloud sync;
- library redesign;
- progress dashboard redesign;
- streaks/XP/achievements;
- AI-generated Home summaries;
- mobile-first redesign;
- new transcript/player architecture;
- new review scheduling rules.

## Completion report expected from the implementation agent

```text
Backlog item
#23 Continue-learning home screen

Status
complete | partial | blocked

Backlog changes
- [ ] -> [x] only if every criterion is verified

Verification
- tests: pass/fail/not run
- browser E2E: pass/fail/not run
- visual regression: pass/fail/not run
- accessibility: pass/fail/not run
- typecheck: pass/fail/not run
- lint: pass/fail/not run
- build: pass/fail/not run
- UX/rendered flow: pass/fail

Files changed
- ...

Remaining
- ...

Recommended next item
#24 Opinionated recommendation engine
```
