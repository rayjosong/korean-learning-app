# Backlog #30 - Assistance levels implementation plan

## Assignment and status

- Canonical backlog: [#30 Assistance levels](BACKLOG.md#30-assistance-levels).
- Tracking issue: none exists as of the inspected baseline. Do not confuse backlog #30 with a GitHub issue or pull request numbered 30.
- Baseline inspected: `main` at `18e8ed564ac56dc2f79dd6b511ece3d32bd9a793` (2026-08-28).
- Status: planning complete; product backlog #30 remains unchecked.
- Dependency: backlog #29 is complete. Backlog #32 is also complete and its visual regression gate must remain intact.
- Implementation branch: `agent/30-assistance-levels`; this planning change uses `agent/30-assistance-levels-implementation-plan`.
- Product surfaces: Watch, Study, and Settings. The quiet control belongs in the shared Watch/Study workspace bar; persistence belongs behind the Settings/storage boundary.

This is a planning-only change. It does not implement assistance behavior, does not certify any acceptance criterion, and must not mark #30 complete.

Before implementation, read in order: [AGENTS.md](../AGENTS.md), [PRODUCT.md](PRODUCT.md), [DESIGN.md](../DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [TESTING.md](TESTING.md), and [BACKLOG.md](BACKLOG.md). Those documents remain authoritative; this plan is the execution guide for #30.

## 1. Inspected starting point

| Area | Current implementation | Consequence for #30 |
| --- | --- | --- |
| Workspace control | `VideoTranscriptViewer` renders a read-only `Assistance: Guided` label in the shared Watch/Study bar. | Replace this exact placeholder with one accessible control. Do not add a second control elsewhere in the media workspace. |
| Session ownership | `StudySession` owns Watch/Study mode, selected sentence, player coordination, explanations, and the shared `ExplanationDatabase`. | Let `StudySession` own the hydrated assistance preference and pass it down. Do not create a global state store. |
| Watch presentation | `SentenceBreakdownPopover` shows natural English meaning and phrase meanings after intentional sentence selection; Grammar, Nuance, and Examples are collapsed. | This is the canonical Guided baseline and must remain the default behavior. |
| Study presentation | `ExplanationPanel` persistently shows the selected Korean sentence and structured English explanation in Study mode. | Apply the same assistance policy to Study without creating another model request or another explanation state. |
| Explanation pipeline | One structured explanation is requested/cached and reused across Watch and Study. Cache identity is based on prompt version and sentence, not presentation. | Assistance must only change visibility. It must not change prompts, cache keys, provider selection, or create duplicate calls. |
| Provider settings | `AiProviderSettings` persists credentials in the `aiProviderSettings` Dexie table through `@korean-learning/storage/ai-settings`. | Store assistance in a different record/table and helper module. Never add assistance fields to provider credentials. |
| Database | `ExplanationDatabase` is at version 8. There is no general preference or assistance table. | Add a version 9 schema containing a dedicated `assistanceSettings` table and test upgrade from version 8. |
| Regression suite | Component tests cover the read-only Guided label and current explanation hierarchy. Playwright covers Watch/Study continuity, visual states, and accessibility. | Replace the placeholder assertion and extend the existing suite. Do not establish another browser harness. |
| Deterministic fixtures | `openFixture` and `seedFixtureStorage` provide fixed player, explanation, learner, provider, and visual states. | Seed assistance through the storage helper and clear it between scenarios so tests cannot leak preferences. |

The current Guided presentation is already valid behavior. The implementation should preserve it first, then add Full and Immersion as presentation variants around the same selected sentence, explanation object, learner state, and media session.

## 2. Product behavior contract

### 2.1 Shared rules for every level

These invariants are non-negotiable:

1. Opening a video still defaults to Watch.
2. Before learner interaction, Watch shows video, Korean transcript, playback state, and the quiet assistance control. No level permanently adds English translations to every transcript row.
3. Assistance never pauses playback because content appears difficult. The existing pause occurs only when the learner intentionally activates a transcript sentence.
4. Korean remains the first and strongest content in Watch and Study.
5. The selected sentence, current playback sentence, learner knowledge state, review schedule, and provider configuration do not change when the assistance level changes.
6. The same structured explanation and cache entry are reused at every level. Switching level must not issue another model request when the explanation is already loading, ready, cached, or failed.
7. Grammar, nuance, morphology, and examples remain subordinate to the Korean sentence. Examples are always explicitly requested.
8. Switching level preserves the selected segment, current player instance, playback position/state, active Watch/Study mode, word selection, and saved learner action where practical.
9. A failed preference write is local to the control. It must not reset the media session or erase provider settings.

### 2.2 Exact visibility matrix

The implementation must use this matrix rather than inventing behavior component by component.

| State | Full | Guided (default) | Immersion |
| --- | --- | --- | --- |
| Watch before selection | Korean transcript only; quiet control visible. | Korean transcript only; quiet control visible. | Korean transcript only; quiet control visible. |
| After intentional sentence selection | Show natural English meaning and phrase meanings. Expand available Grammar and Nuance by default because the learner chose the fuller assistance preference. Keep Examples collapsed. | Preserve current behavior: show natural English meaning and phrase meanings; keep Grammar, Nuance, and Examples collapsed. | Show the selected Korean sentence/context and a clear `Show English help` action. Do not show English meaning, phrase meanings, grammar explanations, nuance, examples, or word-card English by default. |
| Immersion English reveal | Not applicable. | Not applicable. | `Show English help` reveals the Guided presentation for the current selected sentence only. This is ephemeral session state, not a persisted level change. |
| Phrase lookup | Existing phrase buttons and English word card remain available after selection. | Existing phrase buttons and English word card remain available after selection. | Korean phrase chunks may remain visible, but English phrase meanings and the word card appear only after an explicit English-help reveal or an equivalently explicit `Explain in English` action. |
| Study | Selected Korean sentence remains primary; natural meaning, phrases, Grammar, and Nuance are visible by default; Examples remain on demand. | Preserve current selected-sentence hierarchy with natural meaning and phrase breakdown first; deeper sections stay on demand. | Keep the selected Korean sentence and nearby Korean context visible. English explanation stays behind `Show English help`; after reveal, use Guided visibility. |
| Level change while selected | Recompute visible sections from the selected level without changing explanation/session data. | Recompute visible sections from the selected level without changing explanation/session data. | Hide English immediately. A prior Immersion reveal resets when entering Immersion or selecting another sentence. |

Full may show more after intentional sentence selection, but it must not expose permanent transcript translations or make English visually stronger than Korean. The Full preference is persistent consent for fuller post-interaction help; it is not automatic tutoring.

### 2.3 Immersion reveal lifecycle

Use one ephemeral reveal key owned at the shared session/presentation layer:

```text
{ selectedSegmentId, assistanceLevel, englishHelpRevealed }
```

Rules:

- Default `englishHelpRevealed` to false.
- Reset it when the selected sentence changes.
- Reset it when the user changes into Immersion.
- Preserve it when the learner switches Watch <-> Study with the same selected sentence, so the same intentional reveal does not disappear during mode navigation.
- Do not persist it across reloads or sessions.
- Changing from Immersion to Full/Guided ignores the reveal flag because English is visible by policy.

### 2.4 Control behavior and accessibility

Create a domain-named `AssistanceControl`, rendered in the existing workspace bar.

- Options: `Full`, `Guided`, `Immersion` in that order.
- Use a native radio group or equivalent fully keyboard-operable single-select control with an accessible group name `Assistance level`.
- The current option must be communicated semantically, not only by persimmon color.
- Arrow-key navigation, focus indication, and activation must work without hover.
- Include concise accessible descriptions for the options. Do not add long explanatory copy to the compact workspace bar.
- While the saved preference is hydrating, render Guided as the stable fallback and disable mutation or otherwise prevent a late read from overwriting a user change.
- On selection, update presentation immediately, then persist. Announce save failure accessibly and revert to the last persisted value.
- Do not put API-provider wording, provider names, or credential controls in this component.

## 3. Persistence and application boundary

### 3.1 Canonical type and record

Define one type at the storage/application boundary and reuse it:

```ts
export type AssistanceLevel = "full" | "guided" | "immersion";

export interface AssistanceSettingsRecord {
  id: "default";
  level: AssistanceLevel;
  updatedAt: string;
}
```

Do not duplicate string unions across components. If a web-layer alias is useful, re-export the storage type rather than redefining it.

### 3.2 Database version 9

Add a dedicated table to `ExplanationDatabase`:

```ts
assistanceSettings!: Table<AssistanceSettingsRecord, string>;
```

Version 9 must repeat all version 8 stores unchanged and add:

```text
assistanceSettings: "id"
```

No data rewrite is required. Absence of the `default` record means Guided. Do not insert defaults during database construction; resolve the default through the helper so a fresh database and an upgraded database behave identically.

Migration verification must create a real version 8 database, seed at least an AI provider record plus one unrelated learner/explanation record, close it, open it through the version 9 `ExplanationDatabase`, and prove:

- all prior data remains intact;
- the assistance table exists;
- missing preference resolves to Guided;
- saving Full/Immersion works after upgrade;
- provider settings remain unchanged.

### 3.3 Storage helper

Add `packages/storage/src/assistance-settings.ts` and export it as `@korean-learning/storage/assistance-settings`.

Required operations:

```ts
getAssistanceSettings(database)
putAssistanceSettings(database, { level, updatedAt? })
clearAssistanceSettings(database) // useful for tests/reset behavior
```

The helper must validate the runtime value before writing. Invalid or missing stored data must resolve safely to Guided at the application helper, not crash the workspace.

Add `apps/web/lib/assistance-settings.ts` as the application-facing adapter:

```ts
loadAssistanceLevel(database): Promise<AssistanceLevel> // Guided fallback
saveAssistanceLevel(database, level): Promise<void>
```

UI components receive values and callbacks. They must not import Dexie, query a table, or combine provider and assistance writes.

### 3.4 Presentation policy

Add a small pure module, for example `apps/web/lib/assistance-presentation.ts`, that maps level plus Immersion reveal state to explicit booleans:

```ts
interface AssistancePresentation {
  showEnglishMeaning: boolean;
  showPhraseMeanings: boolean;
  expandGrammarByDefault: boolean;
  expandNuanceByDefault: boolean;
  showExamplesByDefault: false;
}
```

Both `SentenceBreakdownPopover` and `ExplanationPanel` must consume this shared policy. Do not embed separate Full/Guided/Immersion condition trees in both components.

The policy is presentation-only. It must not import learning-engine state, AI-provider code, cache logic, or persistence.

## 4. Ordered implementation work

### Step 1 - Establish the baseline and ownership

1. Start from the latest `main`; re-read the six required documents in repository order.
2. Confirm backlog #29 and #32 remain complete and inspect open branches/PRs for #30 ownership.
3. Run the full current gate before editing and record any pre-existing failure:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   pnpm test:e2e
   pnpm test:a11y
   pnpm test:visual
   ```

4. Render the current Guided Watch selected state and Guided Study state. These are behavior/visual baselines, not proof that #30 is implemented.
5. Verify the read-only label still exists and that no other assistance persistence path has landed since this plan.

Exit: current SHA, current verification results, active-work check, and baseline screenshots are recorded. No backlog checkbox changes.

### Step 2 - Add the isolated persistence boundary

Primary files:

- `packages/storage/src/assistance-settings.ts` (new)
- `packages/storage/src/index.ts`
- `packages/storage/package.json`
- `packages/storage/test/assistance-settings.test.mjs` (new)

Implement the canonical type, helper operations, version 9 table, package export, and upgrade test described in section 3.

Test at minimum:

1. absent record -> Guided through the application helper;
2. Full, Guided, and Immersion round-trip;
3. update overwrites the one `default` record;
4. invalid write is rejected;
5. clear returns behavior to Guided;
6. version 8 -> 9 preserves provider and unrelated data;
7. assistance save/remove never changes `aiProviderSettings`.

Exit: persistence is deterministic and independent of provider settings. No UI changes yet.

### Step 3 - Add the pure presentation policy

Primary files:

- `apps/web/lib/assistance-settings.ts` (new)
- `apps/web/lib/assistance-presentation.ts` (new)
- adjacent `.test.mjs` files (new)

Encode the section 2 matrix once. Unit-test every combination of level and Immersion reveal state. Explicitly assert:

- Full expands Grammar/Nuance but not Examples;
- Guided preserves the current meaning + phrase baseline with deeper detail collapsed;
- Immersion hides all English before reveal;
- Immersion reveal equals Guided visibility for the current sentence;
- no policy output mentions or mutates learner state/provider configuration.

Exit: a pure, tested policy defines all visibility decisions before components are edited.

### Step 4 - Hydrate and persist the session preference

Primary file: `apps/web/components/study-session.tsx`.

Add session state equivalent to:

```text
assistanceLevel = guided
persistedAssistanceLevel = guided
assistanceReady = false
assistanceSaveError = undefined
englishHelpRevealed = false
```

On database readiness:

1. load the preference through `loadAssistanceLevel`;
2. apply the stored level;
3. mark hydration complete;
4. ignore a stale async result after unmount/session replacement.

On user change:

1. capture the last persisted value;
2. update the visible level immediately;
3. reset Immersion reveal according to section 2.3;
4. persist through `saveAssistanceLevel`;
5. on success, update the persisted value and clear the error;
6. on failure, restore the last persisted value and announce an actionable local error without resetting video/explanation/learner state.

Pass level, readiness, save error, reveal state, and callbacks into the viewer/presentation boundary. Do not add assistance to `AiSettings`, `createLanguageModel`, or cache construction.

Exit: preference survives a remount/reload and switching it does not recreate the player, explanation model, database, or media session.

### Step 5 - Replace the placeholder and apply the matrix

Primary files:

- `apps/web/components/assistance-control.tsx` (new)
- `apps/web/components/video-transcript-viewer.tsx`
- `apps/web/components/sentence-breakdown-popover.tsx`
- `apps/web/components/explanation-panel.tsx`
- adjacent component tests

Work in this order:

1. Replace only the read-only `Assistance: Guided` block with `AssistanceControl` in the existing workspace bar.
2. Pass the shared presentation policy to Watch and Study.
3. Keep the selected Korean sentence/context visible at every level.
4. Preserve current Guided markup hierarchy and interactions before introducing Full/Immersion branches.
5. In Full, default Grammar and Nuance open only after the explanation is ready; keep Examples closed.
6. In Immersion, render no English text before the explicit reveal. Ensure loading/error UI remains understandable without leaking provider internals; the selected Korean sentence stays present.
7. Add `Show English help` with clear expanded state and keyboard behavior. Preserve the reveal across Watch/Study for the same sentence and reset it for a new sentence.
8. Ensure a level change only recomputes visibility. It must not call `explain`, `explainWord`, `markKnown`, `markLearning`, `seekTo`, `pause`, or `play`.
9. Keep provider settings and utilities unchanged except for any narrowly required accessibility wiring.

Exit: all three levels match the matrix on both Watch and Study while media, explanation, and learner-state behavior remain stable.

### Step 6 - Extend deterministic browser, visual, and accessibility coverage

Primary files:

- `apps/web/lib/fixture-session.ts`
- `apps/web/e2e/fixture.ts`
- `apps/web/e2e/watch-study.spec.ts`
- `apps/web/e2e/a11y.spec.ts`
- `apps/web/e2e/visual.spec.ts`
- reviewed baselines under the existing `qa/29d/` snapshot path

Fixture rules:

- Add an assistance seed option to the existing fixture boundary; do not create production query-parameter behavior.
- Clear `assistanceSettings` with the other fixture tables before seeding.
- Seed through `putAssistanceSettings`, never through direct component state or raw Dexie writes.
- Keep the fixed date, local Pretendard font, fake player, and fake language model.
- Add a fixture model call counter or equivalent observable seam only if needed to prove level switching does not request another explanation.

Required browser scenarios:

1. Fresh database displays Guided.
2. Selecting Full changes the current selected-sentence presentation, reload preserves Full, and the player remains one instance.
3. Selecting Guided preserves the current canonical Watch/Study hierarchy.
4. Immersion selection shows no English before `Show English help`.
5. Immersion reveal displays English, survives Watch -> Study for the same sentence, and resets on a new sentence.
6. Switching Full -> Immersion hides English immediately without changing selected sentence or learner state.
7. Switching any level never seeks, pauses, plays, or invokes the model by itself.
8. Sentence selection still seeks + pauses at every level because selection is learner-driven.
9. Preference reload persists independently of provider settings.
10. A simulated preference-save failure leaves the media session intact and exposes an accessible status/error.

Required accessibility checks:

- The control has one accessible group name and one selected option.
- Keyboard users can reach and change all three options.
- Visible focus meets the existing Warm Korean Editorial treatment.
- Immersion reveal is keyboard operable and exposes its expanded state.
- Axe passes on Full selected Watch, Guided selected Study, and Immersion before/after reveal.
- English-hidden assertions inspect visible/accessibility output, not CSS color alone.

Required reviewed screenshots at 1440x900:

- Full Watch selected;
- Guided Watch selected (existing baseline may be reused only if the rendered output is unchanged);
- Immersion Watch selected before reveal;
- Immersion Watch selected after reveal;
- Full Study selected;
- Guided Study selected;
- Immersion Study selected before reveal;
- assistance control focus/selection state if it is not already clear in the canonical captures.

Add a compact 1024x768 assertion for the three-option control and Immersion reveal. Add a screenshot only if a new distinct layout is required; at minimum prove no overflow or obscured controls.

Never raise pixel tolerance, add sleeps, add broad retries, or update unrelated baselines to make #30 green. Review every changed baseline against DESIGN.md and document intentional differences.

Exit: the exact preference and visibility contracts are protected at the cheapest reliable layer, with browser coverage only for persistence and real interaction wiring.

### Step 7 - Final verification, QA record, and backlog completion

Run from repository root with the repository's Node/pnpm versions:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
```

Also verify from a real browser session:

```text
fresh profile -> Guided
Guided -> Full -> select sentence -> fuller help
reload -> Full remains selected
Full -> Immersion -> English hides
Show English help -> English appears
Watch -> Study -> Watch -> same sentence/player/reveal context
new sentence -> Immersion reveal resets
provider settings remain unchanged
```

Create `docs/QA-30.md` containing:

- final implementation SHA;
- database migration result;
- acceptance-criterion evidence table;
- unit/component/browser/a11y/visual command results;
- screenshot names and viewports;
- explicit confirmation that provider settings, learner state, cache identity, and player identity did not change;
- omitted live verification and why.

Embed rendered screenshots directly in the implementation PR description. Keep #30 and all nine acceptance criteria unchecked until every criterion has current evidence and the latest commit CI is green. Then, and only then, update the top-level checkbox and each verified criterion.

Do not merge without explicit user instruction.

## 5. File-level implementation map

| File | Planned responsibility | Must not contain |
| --- | --- | --- |
| `packages/storage/src/assistance-settings.ts` | Canonical level type, record, validation, get/put/clear helpers. | React, provider credentials, learner transitions. |
| `packages/storage/src/index.ts` | Version 9 table declaration/schema only. | Presentation rules or default UI behavior. |
| `packages/storage/package.json` | Export `./assistance-settings`. | Unrelated dependency changes. |
| `packages/storage/test/assistance-settings.test.mjs` | Round-trip, separation, validation, and v8 -> v9 migration coverage. | TypeScript-only syntax; tests run as `.mjs`. |
| `apps/web/lib/assistance-settings.ts` | Guided fallback and application-facing load/save adapter. | JSX, direct provider writes. |
| `apps/web/lib/assistance-presentation.ts` | Pure visibility matrix. | Dexie, model calls, learner state. |
| `apps/web/components/study-session.tsx` | Hydration, optimistic save/revert, shared reveal lifecycle. | Raw table access, duplicated provider state. |
| `apps/web/components/assistance-control.tsx` | Compact accessible Full/Guided/Immersion selector. | Persistence, model calls, media behavior. |
| `apps/web/components/video-transcript-viewer.tsx` | Render control and pass policy to Watch/Study surfaces. | Assistance persistence or AI calls. |
| `apps/web/components/sentence-breakdown-popover.tsx` | Watch visibility and Immersion reveal UI. | Separate policy logic or storage. |
| `apps/web/components/explanation-panel.tsx` | Study visibility using the same policy/reveal state. | Separate model request or cache. |
| `apps/web/lib/fixture-session.ts` | Deterministic preference seed/clear through storage helper. | Production preference rules. |
| Existing component/E2E specs | Observable matrix, persistence, continuity, keyboard, a11y, and visual protection. | Assertions coupled only to private implementation details. |
| `docs/QA-30.md` | Final evidence and acceptance mapping. | Completion claims before the full gate passes. |

If implementation reveals that one smaller cohesive boundary is clearer, file names may change, but ownership rules and separation above must remain.

## 6. Acceptance criteria to evidence mapping

| Backlog criterion | Required implementation evidence |
| --- | --- |
| Supports Full, Guided, and Immersion | Pure matrix unit tests, accessible control component tests, and browser scenarios for all three in Watch and Study. |
| Guided is default | Fresh-database storage/application test plus fresh-browser assertion before any user preference exists. |
| Assistance changes presentation, not learner knowledge state | Policy purity; browser test preserving selected sentence and saved learner item across level changes; no learning-engine changes. |
| Full makes translation/help easier to reveal while keeping Korean primary | Full selected-state screenshots and assertions: Korean first, meaning/phrases/Grammar/Nuance visible only after selection, Examples still on demand. |
| Guided keeps Korean first and reveals concise help after interaction | Current Guided component hierarchy retained; selected Watch/Study behavioral and visual assertions. |
| Immersion is Korean-only by default and requires intentional English help | Before/after reveal component, browser, accessibility, and screenshot evidence; reveal reset lifecycle assertions. |
| No assistance level proactively pauses playback because content appears difficult | Browser/player-command assertion that level changes do not call seek/pause/play; existing sentence-selection seek+pause test retained for all levels. |
| Preference persists locally | Storage round-trip, v8 -> v9 migration, browser reload, and fresh-session restore evidence. |
| Provider settings remain separate | Dedicated table/module, migration preservation test, and browser assertion that provider profile is unchanged after assistance changes. |

## 7. Regression risks and required guards

| Risk | Guard |
| --- | --- |
| Late hydration overwrites a fast user selection | Disable mutation until hydration or use a revision guard; component/browser test the chosen behavior. |
| Level change triggers another model call because memo dependencies expand | Keep `languageModel` and explanation hooks independent of level; fixture call-count assertion. |
| Immersion English remains in accessible output while visually hidden | Conditionally omit English DOM content before reveal; test visible text and accessibility tree behavior. |
| Watch and Study implement different matrices | Shared pure presentation policy consumed by both; table-driven unit tests. |
| Reveal resets during Watch/Study switching | Own reveal state above both presentations and key it to selected sentence; golden-path assertion. |
| Reveal leaks to a new sentence | Reset on selected-segment change; browser assertion. |
| Migration drops provider or learner data | Real v8 -> v9 upgrade test with seeded unrelated records. |
| Fixture preferences leak between parallel tests | Fresh contexts plus explicit table clear/seed through storage helper. |
| Full overwhelms Korean hierarchy | Reviewed 1440/1024 screenshots; Korean sentence first; no permanent transcript translation; Examples collapsed. |
| Compact workspace control overflows | 1024 assertion and keyboard test; preserve the existing workspace bar hierarchy. |
| Preference save error resets the session | Local error/revert path; assert one player and unchanged selection. |

## 8. Documentation and handoff rules

The implementation PR should update:

- `docs/QA-30.md` with final evidence;
- `docs/BACKLOG.md` only after the complete gate passes;
- `docs/TESTING.md` only if fixture conventions or canonical commands materially change;
- `docs/ARCHITECTURE.md` only if the implemented persistence/presentation boundary differs materially from the already documented assistance-preference boundary;
- `DESIGN.md` or `docs/PRODUCT.md` only if the maintainer explicitly changes the behavior matrix, not to excuse implementation drift.

Do not modify #31, unfinished Progress/Home work, provider defaults, export/import, mobile-first behavior, or learning rules as part of #30.

Suggested reviewable implementation commits:

1. `feat(storage): persist assistance preference separately`
2. `feat(web): add assistance presentation policy and control`
3. `test(web): cover assistance persistence and visibility matrix`
4. `docs: record backlog 30 verification`

## 9. Required implementation PR report

Use the `AGENTS.md` completion format and include at least:

```text
Backlog item
#30 Assistance levels

Status
complete | partial | blocked

Backlog changes
- [ ] -> [x] only after every criterion and gate passes

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

Remaining
- exact gaps, or none

Recommended next item
#31 Original-context video review
```

Planning completion is not product completion. This planning PR must leave every #30 checkbox unchanged and describe implementation as remaining work.
