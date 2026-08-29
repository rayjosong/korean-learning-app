# Backlog #18 - Simple learner profile implementation plan

## Assignment

- Canonical backlog: `#18 Simple learner profile` in `docs/BACKLOG.md`.
- Product area: learner model / supporting Progress data, currently rendered as a learner-profile utility inside the learning workspace.
- Dependencies: #11, #12, and #17. #17 is complete on `main` after PR #79.
- Status: planning only. Do not mark #18 or any acceptance criterion complete from this PR.

## Important starting point

#18 is **not greenfield**.

PR #44 (`feat: add simple learner profile`) already merged the first implementation in commit `51cada3baa65ae337c3c9de139412698e4cf0266`. The current repository already contains:

- `packages/learning-engine/src/profile.ts`
  - pure learner-profile aggregation;
  - known / learning counts;
  - recognition / production confidence summaries;
  - normalized grammar exposure counts;
  - speech-level exposure bands.
- `packages/storage/src/learner-profile.ts`
  - reads learner items and cached explanation evidence behind the storage boundary.
- `apps/web/lib/load-learner-profile.ts`
  - application use case that combines storage evidence with the pure aggregator.
- `apps/web/components/learner-profile-panel.tsx`
  - loading, error, empty, and populated learner-profile states.
- tests in:
  - `packages/learning-engine/test/profile.test.mjs`;
  - storage tests for learner-profile input;
  - `apps/web/components/learner-profile-panel.test.tsx`.

PR #44 intentionally left the backlog unchecked because its completion gate was not fully closed out. Its implementation CI passed, but the PR explicitly omitted a Playwright diagnostic. Since then, the canonical visual system and browser regression infrastructure have evolved substantially through #29 and #32.

Therefore the correct task is:

```text
current implementation
-> audit against current product / architecture / testing rules
-> repair only real gaps
-> add current browser / visual / a11y evidence where needed
-> document QA
-> mark #18 complete only after every criterion is verified
```

Do **not** rewrite the learner profile from scratch just because the backlog item is unchecked.

## Product contract

The learner profile is a small, local, explainable read model of what the app currently knows about the learner.

It exists to support later decisions such as difficulty estimates, progress, recommendations, and export. It is not a gamification dashboard and it must not pretend to know more than the stored evidence supports.

The intended mental model is:

```text
saved learner items
+ review confidence
+ observed grammar in inspected content
+ observed speech levels
        ↓
local explainable learner snapshot
        ↓
future difficulty / progress / recommendation features
```

Rules:

1. Use persisted learner evidence; do not call an AI model to generate the profile.
2. Keep recognition and production confidence separate.
3. Grammar and speech-level data describe **observed exposure**, not proven mastery.
4. Unknown / absent evidence must remain visibly unknown rather than being converted into a fake zero-skill judgment.
5. The profile must remain deterministic for the same local data.
6. React must not query Dexie tables directly.
7. Do not create a new top-level navigation destination for #18. `Progress` owns the eventual learner-facing progress destination in #21.
8. Keep the profile useful to downstream domain logic rather than coupling it to one current UI card.

## Acceptance criteria interpretation

The backlog acceptance criteria are intentionally small. Implement and verify them literally before expanding scope.

### 1. Known vocabulary summary

Required meaning:

- count saved learner items whose state is `known`;
- exclude `unknown` and `learning` items from the known count;
- repeated encounters of the same learner item must not inflate the vocabulary count;
- empty state should report zero without implying a failure.

Current likely implementation: `LearnerProfile.knownCount` from `aggregateLearnerProfile`.

### 2. Learning vocabulary summary

Required meaning:

- count saved learner items whose state is `learning`;
- exclude `known` and `unknown`;
- use learner-item identity, not encounter count.

Current likely implementation: `LearnerProfile.learningCount`.

### 3. Grammar item summary

Required meaning:

- summarize grammar forms already observed in structured sentence explanations;
- normalize whitespace and obvious duplicate labels;
- expose occurrence counts so downstream features can reason about repeated exposure;
- do not label an observed grammar form as "known" or "mastered" unless a future learner-state model explicitly supports that distinction.

Current likely implementation: `GrammarFormSummary[]` sourced from cached explanation grammar entries.

### 4. Recognition confidence summary

Required meaning:

- aggregate `recognitionConfidence` from persisted saved learner items;
- keep the scale bounded to the domain's 0-100 confidence contract;
- ignore unsaved/unknown items for the learner summary;
- when there are no eligible items, return an explicit empty value such as `average: null`, not a misleading 0% average.

Current likely implementation: `ConfidenceSummary` in `aggregateLearnerProfile`.

### 5. Production confidence summary

Same contract as recognition confidence, using `productionConfidence` independently.

Production confidence must not be inferred from recognition confidence.

### 6. Speech-level familiarity supported

Required meaning:

- collect structured speech-level observations from explanations when present;
- normalize repeated labels;
- summarize repeated exposure deterministically;
- clearly communicate that the current familiarity bands describe exposure, not mastery.

The current `exposed | familiar | well-exposed` bands are acceptable if they remain deterministic and are presented as exposure evidence.

## Architecture contract

Preserve the repository's canonical boundary:

```text
UI
 -> application use case
 -> pure learner-profile aggregation
 -> storage read adapter
 -> Dexie
```

Concrete ownership should remain approximately:

```text
apps/web/components/learner-profile-panel.tsx
        ↓
apps/web/lib/load-learner-profile.ts
        ↓
packages/learning-engine/src/profile.ts
        ↑
packages/storage/src/learner-profile.ts
        ↓
ExplanationDatabase
```

Responsibilities:

### `packages/learning-engine`

Own:

- deterministic aggregation;
- normalization rules;
- confidence summary semantics;
- speech-level exposure-band semantics;
- output types used by downstream features.

Must not depend on React, Dexie, browser APIs, or model providers.

### `packages/storage`

Own:

- reading the persisted evidence required by the profile;
- converting storage records into domain input;
- keeping Dexie details out of application/UI code.

Do not add a new persisted learner-profile table unless a concrete performance or historical-snapshot requirement appears. #18 is naturally a derived read model from existing local data.

### `apps/web/lib`

Own:

- application orchestration;
- controlled load/error result;
- no profile-domain calculations that should live in `learning-engine`.

### UI

Own:

- truthful rendering of empty/loading/error/populated states;
- current Warm Korean Editorial styling;
- accessible semantic grouping.

The UI must not become the source of truth for confidence calculations or exposure bands.

## Ordered implementation / verification plan

### Phase 1 - Reconcile the existing implementation with current `main`

Before changing code:

1. Read `AGENTS.md`, `docs/PRODUCT.md`, `DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, and the #18 section in `docs/BACKLOG.md`.
2. Rebase the implementation branch on current `main`.
3. Inspect the merged #18 starting point from PR #44 and all later edits that touched:
   - learner profile;
   - learning item confidence;
   - structured grammar / speech-level explanation output;
   - visual-system utilities;
   - browser fixtures.
4. Map each of the six acceptance criteria to current code and tests before writing new behavior.

Exit condition:

- a criterion-by-criterion audit identifies exactly which items are already satisfied and which, if any, have real gaps.

### Phase 2 - Harden the pure learner-profile contract

Review `aggregateLearnerProfile` and its tests.

Verify at minimum:

- known and learning items are counted by learner item, not encounters;
- `unknown` items do not contaminate saved-profile summaries;
- recognition and production values stay separate;
- confidence input is bounded before averaging;
- zero eligible items produces `{ count: 0, average: null }`;
- grammar labels normalize whitespace and duplicate forms;
- empty grammar labels are discarded;
- speech-level labels normalize consistently;
- exposure bands have explicit deterministic thresholds;
- output ordering is deterministic when counts tie.

If the existing tests already prove these behaviors, do not rewrite them. Add only missing edge cases.

Exit condition:

- all domain semantics needed by #18 are directly protected by deterministic tests.

### Phase 3 - Verify the storage evidence boundary

Review `getLearnerProfileInput` and its storage tests.

Verify:

- learner items come from the canonical `learningItems` table;
- grammar evidence comes from stored structured sentence explanations rather than UI text scraping;
- speech-level evidence is included only when the structured value is present/non-empty;
- API credentials and provider settings never enter the learner-profile model;
- empty databases produce an empty valid input;
- duplicate explanation records behave according to the intended exposure model and are documented.

Important design decision:

The current profile counts grammar/speech observations from cached explanations. Treat these as **encounter/exposure evidence**. Do not silently reinterpret them as unique knowledge state.

Exit condition:

- one storage read produces complete domain input without React or direct component access to Dexie.

### Phase 4 - Verify the application and UI states

Review `loadLearnerProfile` and `LearnerProfilePanel`.

Required states:

1. loading;
2. controlled load error;
3. fully empty learner profile;
4. populated profile with known + learning counts;
5. no-review confidence state (`No reviews yet` or equivalent truthful copy);
6. populated recognition and production confidence;
7. grammar observations;
8. speech-level exposure with explicit non-mastery copy.

The current visual hierarchy should remain supporting rather than turning the learning workspace into a KPI dashboard.

Do not add gamification, streaks, XP, rankings, or a generic analytics grid.

Exit condition:

- component tests protect all materially different rendering states.

### Phase 5 - Add / confirm browser, visual, and accessibility evidence

PR #44 predated the current browser regression gate, so this phase is important even if no runtime behavior changes.

Use deterministic fixtures. Do not depend on live YouTube or AI providers.

Browser checks should prove on a populated fixture that:

- the learner-profile region becomes visible through the current utility/workspace path;
- known and learning totals are rendered from seeded local data;
- recognition and production summaries remain distinct;
- grammar and speech-level summaries render;
- the profile refreshes after a learner/review state change if the current UX promises live refresh.

Empty fixture should prove:

- a new learner sees a calm empty state;
- no fake confidence percentage is rendered.

Accessibility:

- axe passes for populated and empty learner-profile states as part of the current utility surface;
- headings/regions are understandable;
- information is not communicated by color alone.

Visual:

- inspect the profile inside the existing #32 utility baseline at 1440x900;
- if the existing `32-utilities-guidance-1440.png` baseline clearly covers the complete learner-profile state, reuse it and document that evidence;
- otherwise add a focused learner-profile screenshot baseline rather than relying on an incidental partial capture.

Do not update screenshot baselines simply to silence a failure. Review any change against `DESIGN.md`.

Exit condition:

- current user-visible behavior has deterministic browser, visual, and accessibility evidence appropriate to its risk.

### Phase 6 - Full verification and backlog closeout

Run from repository root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
```

Then create `docs/QA-18.md` containing:

- implementation/audit commit;
- criterion-by-criterion evidence;
- exact test files / browser cases;
- visual baseline(s) reviewed;
- accessibility evidence;
- command results;
- any limitations that remain.

Only after all six criteria are genuinely verified:

- change top-level `#18` from `[ ]` to `[x]`;
- mark all six acceptance criteria `[x]`;
- link `IMPLEMENTATION-18.md` and `QA-18.md` from the backlog.

If any criterion fails, keep #18 unchecked and record the exact remaining gap.

## Acceptance mapping

| #18 criterion | Primary implementation evidence | Required verification |
| --- | --- | --- |
| Known vocabulary summary | `LearnerProfile.knownCount` | Domain test + populated component/browser assertion |
| Learning vocabulary summary | `LearnerProfile.learningCount` | Domain test + populated component/browser assertion |
| Grammar item summary | `GrammarFormSummary[]` from stored explanation grammar | Normalization/dedup domain test + storage test + rendered assertion |
| Recognition confidence summary | `recognitionConfidence` summary | Domain boundary/empty tests + rendered assertion |
| Production confidence summary | `productionConfidence` summary | Separate-confidence domain test + rendered assertion |
| Speech-level familiarity supported | `SpeechLevelSummary[]` exposure bands | Domain threshold tests + storage extraction + non-mastery UI assertion |

## Regression risks

### Counting encounters as vocabulary

Risk: a word seen multiple times could inflate known/learning totals.

Protection: learner counts must derive from unique `LearningItem` rows, not context or encounter rows.

### Treating exposure as mastery

Risk: repeated grammar/speech observations could be presented as "known" skill.

Protection: use exposure/count language and keep mastery out of #18.

### Mixing confidence channels

Risk: production practice could accidentally inflate recognition or vice versa.

Protection: keep fields separate end-to-end and retain #17 domain tests as upstream regression coverage.

### Stale profile after learner actions

Risk: the panel may show old values after save/review actions.

Protection: confirm the existing revision/refresh wiring in a browser or component integration test.

### UI becomes a generic dashboard

Risk: later progress work could pull #18 into KPI-card styling.

Protection: keep #18 as a compact evidence surface/read model and let #21 own the canonical Progress composition.

### Derived data becomes persisted unnecessarily

Risk: adding a learner-profile table creates migration/staleness problems without a need.

Protection: derive from canonical persisted evidence for #18; introduce snapshots only in a future feature that explicitly requires historical comparison.

## Out of scope

Do not add as part of #18:

- video difficulty scoring (#19);
- Progress dashboard composition (#21);
- Then-vs-Now comprehension comparison (#22);
- recommendation prioritization changes (#24);
- export/import (#25/#26);
- new AI-generated learner judgments;
- CEFR/TOPIK level estimation;
- XP, streaks, achievements, or ranking;
- accounts/cloud sync;
- a new top-level Learner Profile page;
- advanced learner model / FSRS.

## Required implementation PR report

The implementation/closeout PR should end with:

```text
Backlog item
#18 Simple learner profile

Status
complete | partial | blocked

Backlog changes
- [ ] -> [x] only if all six criteria are verified

Verification
- tests: pass/fail/not run
- browser E2E: pass/fail/not run
- visual regression: pass/fail/not run
- accessibility: pass/fail/not run
- typecheck: pass/fail/not run
- lint: pass/fail/not run
- build: pass/fail/not run
- UX/rendered flow: pass/fail/not applicable

Files changed
- exact paths

Existing implementation reused
- PR #44 / merge commit 51cada3baa65ae337c3c9de139412698e4cf0266

Remaining
- none, or exact gap

Recommended next item
#19 Video difficulty estimate or #21 Progress dashboard, according to dependency/order decisions on current main
```

## Completion principle

The backlog checkbox is stale, but stale documentation alone is not proof of completion.

The implementation agent should first prove that the existing #18 behavior still satisfies the current product contract. If it does, the correct implementation may be a small verification/QA closeout rather than new feature code.