# Backlog #24 - Opinionated recommendation engine implementation plan

## Purpose

Recommend one useful next action from the learner's local evidence and explain why it was chosen.

The V0.1 engine must be deterministic, private, fast, and understandable. It must not call an AI provider, invent learning judgments, or turn Home into a dashboard.

Tracking issue: [#39](https://github.com/rayjosong/korean-learning-app/issues/39)

## Product surface

Home, with application and domain support from the local learner-state stack.

Primary user outcome:

```text
open Home
-> see one recommended next action
-> understand the evidence behind it
-> act through an existing flow or dismiss it
```

## Required source-of-truth reading

Before implementation, read in order:

1. `AGENTS.md`
2. `docs/PRODUCT.md`
3. `DESIGN.md`
4. `docs/ARCHITECTURE.md`
5. `docs/TESTING.md`
6. `docs/BACKLOG.md`

## Current merged baseline

Plan against the current `main` branch after the merged #23 Home implementation.

Existing boundaries to reuse:

- `apps/web/lib/home.ts` owns the Home read model and already has an optional `recommendedContent` seam.
- `apps/web/components/home-surface.tsx` renders Continue, due Review, recent content, and new-content actions.
- `packages/storage/src/index.ts` owns local Dexie access and currently provides learner items, review records, studied content, progress snapshots, and resumable content.
- `packages/learning-engine/src/progress.ts` provides deterministic progress aggregation.
- `packages/learning-engine/src/revisit.ts` provides stored comprehension snapshots and comparison semantics.
- The Review surface already owns review execution and scheduling. The recommendation engine must only link to that flow.
- Deterministic Home fixtures and Playwright E2E, accessibility, and visual suites already exist.

The current `recommendedContent?: HomeContent[]` seam can only represent videos. Backlog #24 needs action types such as Review, Resume, Revisit, and Start new content, plus reason and dismissal metadata. Replace or evolve that seam deliberately instead of forcing every recommendation into `HomeContent`.

## Scope

### In scope

- One primary recommendation at a time.
- Deterministic rule ordering and tie-breaking.
- Reasons derived from local learner evidence.
- Recent recognition/production failures and confidence as review evidence.
- Existing due-review, resume, revisit, and new-content actions.
- Local dismissal with stable recommendation identity.
- Home integration that preserves its calm editorial hierarchy.
- Unit, storage, component, E2E, accessibility, visual, and migration coverage.

### Out of scope

- AI-generated recommendations, summaries, or reasons.
- New recommendation feeds or content discovery services.
- Changing SRS intervals or review outcomes.
- New review modes or filtered review-session behavior unless separately scoped.
- Accounts, cloud sync, analytics, notifications, streaks, XP, or achievements.
- Rebuilding Home, Watch, Study, Review, Progress, or Library.
- Mobile-first redesign.

## Product behavior

### One recommendation, placed in context

Do not add a separate grid of recommendation cards.

The recommendation should enhance the matching existing Home action:

| Recommendation | Existing Home destination | Presentation |
| --- | --- | --- |
| Review due items | Current Home Review disclosure | Add the reason and dismissal control to the review row. |
| Resume content | Current Continue action | Add the reason and dismissal control to the Continue block. |
| Revisit content | Existing video-loading flow | Place one recommended video before recent content with its reason. |
| Start new content | Existing YouTube URL entry | Add the reason near the new-content entry point. |

Only the selected recommendation receives recommendation emphasis. Existing Continue, Review, and Recent sections remain available when their data exists, even when another action is recommended.

### Required action contract

Use a discriminated union owned by the learning/application boundary. Exact names may follow repository conventions, but the behavior must remain explicit:

```ts
type RecommendationAction =
  | { type: "review" }
  | { type: "resume"; videoId: string; sourceUrl: string; positionMs: number }
  | { type: "revisit"; videoId: string; sourceUrl: string }
  | { type: "start-new" };

interface LearningRecommendation {
  fingerprint: string;
  action: RecommendationAction;
  reason: RecommendationReason;
}
```

Keep reason data structured in the domain. Convert it to human-readable copy at the application or presentation boundary so the policy is not coupled to English UI strings.

### V0.1 rule order

Generate eligible candidates and choose the first non-dismissed candidate using this order:

1. **Review due items** when one or more learning items are due.
2. **Resume unfinished content** when a valid resumable item exists.
3. **Revisit old content** when a replayable studied video has a sufficiently old progress snapshot.
4. **Start new content** as the honest fallback.

The fixed order is intentionally simple. Do not add opaque weighted scoring in V0.1.

### Review reason selection

The Review candidate should explain the strongest available evidence without changing review scheduling:

1. Look at completed review records in a documented recent window, recommended as 14 calendar days.
2. Count failures separately for recognition and production.
3. If one mode has at least two recent failures, prefer that weakness in the reason.
4. Break equal failure counts deterministically, recommended as production before recognition because productive recall is the harder skill.
5. Otherwise use the due-item count and overdue status as the reason.

Suggested reason data:

```ts
type RecommendationReason =
  | { code: "recent-review-weakness"; mode: "recognition" | "production"; failures: number; windowDays: 14 }
  | { code: "items-due"; count: number }
  | { code: "unfinished-content"; title?: string }
  | { code: "revisit-ready"; title?: string; elapsedDays: number }
  | { code: "new-content-fallback" };
```

If the current Review entry cannot start a mode-filtered session, the copy must not promise filtering. It may say why Review is recommended while opening the existing mixed/contextual Review flow.

### Resume eligibility

Reuse the existing resume source of truth.

A resume candidate is eligible only when:

- the record is incomplete;
- the source URL is usable;
- the saved position is greater than zero;
- the existing Home loader would surface it as resumable.

Do not create a second resume selection policy inside React.

### Revisit eligibility

Reuse studied-content and content-progress snapshots from backlog #22.

Recommended V0.1 eligibility:

- a replayable studied-content record has a source URL;
- its latest progress snapshot is at least 14 days old;
- it is not the current resume candidate;
- candidates are ordered by oldest eligible snapshot, then `videoId` for deterministic ties.

Do not claim that the learner improved before they reopen the content and a fresh comparison is computed. The reason should say that enough time has passed to check again.

### Start-new fallback

When no stronger candidate exists, recommend starting new Korean content through the existing input. Do not fabricate a video suggestion or call an external content service.

## Recommendation identity and dismissal

### Stable fingerprint

Each recommendation needs an identity derived only from evidence that should make it meaningfully new.

Examples:

```text
review:v1:<due-count>:<latest-due-at>:<weakness-mode>:<latest-review-at>
resume:v1:<video-id>:<resume-updated-at>
revisit:v1:<video-id>:<latest-snapshot-at>
start-new:v1:<local-activity-revision>
```

Use normalized fields and one tested fingerprint builder. Do not use random IDs or render time.

Changing the relevant evidence should produce a new fingerprint. Unrelated UI renders should not.

### Persistence

Add a minimal local record, likely in a Dexie version 11 table:

```ts
interface RecommendationDismissalRecord {
  fingerprint: string;
  dismissedAt: string;
  dismissedUntil: string;
}
```

Recommended behavior:

- a dismissal suppresses the exact fingerprint for seven days;
- new evidence produces a new fingerprint and may surface immediately;
- expired dismissals no longer suppress a candidate;
- the policy then selects the next eligible candidate;
- dismissal never deletes learner, review, resume, or progress data.

Keep time injectable in all domain/application tests.

Add a version 10 -> 11 migration regression that proves all existing tables, AI provider settings, assistance settings, and content resume data survive unchanged.

## Architecture

Required ownership:

```text
Home UI
-> Home/recommendation application use case
-> pure recommendation policy
-> storage read and dismissal adapters
-> Dexie
```

### Learning engine

Add a small recommendation module, for example:

```text
packages/learning-engine/src/recommendation.ts
```

Responsibilities:

- define normalized recommendation inputs and outputs;
- generate candidates;
- select reason data;
- apply fixed priority and deterministic ties;
- build stable fingerprints;
- exclude active dismissals;
- contain no React, Dexie, provider SDK, or wall-clock calls.

### Storage

Add one consistent read helper that gathers the required input in a read transaction where practical:

- learning items, including `nextReviewAt` and confidence;
- recent review records;
- studied content;
- content progress snapshots;
- content resume records;
- recommendation dismissals.

Add a focused write helper for dismissal. React must not access the table directly.

Do not reuse `aiProviderSettings` or another unrelated table for dismissals.

### Application

Evolve `loadHomeSnapshot` or compose it with `loadHomeRecommendation` so Home gets one coherent result.

Responsibilities:

- load normalized local evidence;
- invoke the pure policy with an explicit `now`;
- map structured reasons to concise UI copy;
- return controlled error state;
- persist dismissal through a focused use case;
- reload Home after dismissal and after review completion.

Avoid parallel loaders that can briefly show a recommendation inconsistent with the Home snapshot.

### UI

Update `HomeSurface` to:

- render one recommendation in its matching section;
- show the concrete reason near the action;
- expose a quiet `Dismiss` action with a clear accessible name;
- keep the underlying Home actions available;
- disable only the dismissal control while saving;
- show controlled dismissal failure without removing the recommendation;
- reload recommendation state after review results change.

Do not put recommendation logic, date windows, thresholds, or fingerprint construction in the component.

## Exact copy constraints

Copy must be factual and bounded by stored evidence.

Good patterns:

- `2 production reviews were missed in the last 14 days.`
- `4 phrases are ready for review.`
- `Continue the video you last studied.`
- `It has been 18 days since you studied this video.`
- `Start a new Korean video when nothing is waiting.`

Avoid claims such as:

- `You are weak at production.`
- `This will improve your Korean fastest.`
- `You have mastered recognition.`
- `AI recommends...`

## Deterministic fixture plan

Extend the existing Home fixture system. Pin the clock and IndexedDB seed data.

Required states:

1. due Review with recent production failures;
2. due Review without a recent weakness;
3. no due Review, resumable content available;
4. no due/resume, eligible revisit content;
5. empty learner with Start-new fallback;
6. dismissed first candidate showing the next eligible candidate;
7. dismissal write failure if the fixture boundary supports controlled storage errors.

Do not use live YouTube, an AI provider, or the real wall clock in CI.

## Test plan

### Unit/domain

Cover:

- rule priority across all candidate types;
- due-review eligibility and reason counts;
- 14-day recent-review boundary;
- recognition/production failure separation;
- deterministic tie-breaking;
- resume eligibility and invalid source data;
- revisit age boundary and deterministic ordering;
- honest Start-new fallback;
- fingerprint stability and evidence changes;
- active, expired, and unrelated dismissals;
- no mutation of input collections.

### Storage and migration

Cover:

- consistent recommendation-input read;
- dismissal round-trip;
- replacement/update of the same fingerprint;
- expiry filtering or policy handoff;
- empty database;
- version 10 -> 11 upgrade with existing data preserved;
- provider credentials remain untouched and are never included in recommendation inputs or fingerprints.

### Application

Cover:

- ready result for each recommendation type;
- structured reason to exact truthful copy;
- controlled read failure;
- dismissal persistence and reload;
- a changed input producing a new recommendation;
- no call to `LanguageModel` or provider configuration.

### Component/integration

Cover:

- one recommendation only;
- reason and matching action render together;
- Review recommendation opens the existing Review surfaces;
- Resume and Revisit reuse the existing video-loading path;
- Start-new recommendation focuses or clearly points to the current URL input;
- Dismiss removes the exact recommendation and shows the next candidate;
- dismissal loading and error states;
- Home hierarchy remains intact with and without recommendation data.

### Browser E2E

Add deterministic paths:

```text
open due-review Home fixture
-> recommendation reason names recent production misses
-> activate Review
-> existing contextual/mixed Review surface opens
```

```text
open Home with Review + Resume candidates
-> dismiss Review recommendation
-> Resume becomes recommended
-> reload
-> dismissed Review fingerprint remains suppressed
```

```text
open revisit fixture
-> reason reports elapsed time without claiming improvement
-> activate recommendation
-> existing Watch flow opens the stored video
```

### Accessibility

Run axe on every materially distinct Home recommendation state and verify:

- the recommendation reason is programmatically associated with its action where practical;
- Dismiss has a specific accessible name;
- keyboard order follows the visual hierarchy;
- focus moves predictably after dismissal;
- status/error messages are announced;
- recommendation emphasis does not rely on color alone.

### Visual regression

Add or update reviewed baselines for:

- Home with Review recommendation;
- Home with Resume recommendation;
- Home after dismissal when the next candidate appears;
- empty Home with Start-new fallback if materially different.

Reuse the canonical 1440 x 900 viewport and existing pinned Pretendard font. Do not approve screenshots solely because CI generated them.

## Ordered implementation steps

### Step 1 - Reconcile backlog state and inspect current Home inputs

- Confirm the merged #18, #21, #22, and #23 behavior exists on the implementation branch even if their backlog checkboxes are stale.
- Inspect the version 10 schema and current Home fixtures.
- Record any source data that cannot support the planned rule without broadening scope.

Exit criterion: the implementer documents exact reused records and any justified rule adjustment.

### Step 2 - Add the pure recommendation policy

- Define input/output/reason types.
- Implement candidate generation, fixed priority, tie-breaking, fingerprints, and dismissal filtering.
- Add boundary-focused domain tests.

Exit criterion: pure tests select one deterministic recommendation for every planned state.

### Step 3 - Add storage input and dismissal persistence

- Add the recommendation read adapter.
- Add the version 11 dismissal table and focused write helper.
- Add the version 10 -> 11 preservation test.

Exit criterion: storage tests prove complete input, dismissal behavior, and migration safety.

### Step 4 - Integrate the Home application model

- Replace/evolve the content-only recommendation seam.
- Load Home data and recommendation from one coherent application flow.
- Add reason copy mapping and controlled errors.

Exit criterion: application tests cover every action and dismissal reload without provider calls.

### Step 5 - Render the recommendation in the existing Home hierarchy

- Enhance the matching section instead of adding a dashboard card grid.
- Wire action and dismissal behavior.
- Preserve the new-content entry and all non-recommended Home options.

Exit criterion: component tests prove one reasoned, dismissible recommendation and working existing actions.

### Step 6 - Extend deterministic browser, accessibility, and visual coverage

- Add seeded fixture states.
- Add E2E action/dismissal/reload paths.
- Run axe and keyboard checks.
- Review canonical screenshots against `DESIGN.md`.

Exit criterion: all new browser gates pass deterministically.

### Step 7 - Verify and update authoritative docs

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

Create `docs/QA-24.md` with evidence and embed required screenshots in the implementation PR.

Only check backlog #24 when every criterion and required gate is verified on the latest implementation commit. Do not silently check stale #18, #19, #21, or #22 items as part of #24.

## Acceptance-criteria evidence map

| Backlog criterion | Required implementation and evidence |
| --- | --- |
| Rule-based first | Pure policy with fixed order, deterministic ties, and unit tests. |
| Recommendation includes reason | Structured reason data, exact copy mapping, and component/E2E assertions. |
| Uses recent weaknesses | Separate recent recognition/production failure analysis with pinned-time boundary tests. |
| User can dismiss | Local dismissal use case, persistence/migration tests, component state, and reload E2E. |
| Core prioritization does not require AI | No `LanguageModel` dependency; unit/application tests run without provider settings or network. |

## Regression risks and guards

### Recommendation duplicates existing Home actions

Guard: render the reason in the matching existing section and keep only one recommendation.

### Stale recommendation after review or resume updates

Guard: build fingerprints from relevant evidence and refresh Home after review completion, dismissal, and meaningful Home-state revision.

### Dismissed recommendation immediately returns

Guard: persist exact fingerprint plus expiry and test same-session and reload behavior.

### Dismissal hides useful actions

Guard: dismissal removes recommendation emphasis only. It must not delete or hide the underlying Continue, Review, Recent, or Start-new action.

### UI invents learning policy

Guard: thresholds, windows, priority, ties, and fingerprints stay in the pure recommendation module.

### False claims from sparse evidence

Guard: use counts, windows, and elapsed time. Do not infer mastery, readiness, or guaranteed improvement.

### Migration loses local data or credentials

Guard: version 10 -> 11 migration test preserves every current table and verifies credentials never enter recommendation data.

## Completion report expected from the implementation agent

```text
Backlog item
#24 Opinionated recommendation engine

Status
complete | partial | blocked

Backlog changes
- [ ] -> [x] only after every criterion is verified

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
#25 Export learner data
```
