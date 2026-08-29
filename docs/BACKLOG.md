# BACKLOG.md

## Rules

- The top-level checkbox is the canonical completion state.
- A top-level item may be checked only when every acceptance criterion is checked and verified.
- Agents must follow `/AGENTS.md`.
- User-facing work must also follow `/DESIGN.md`.
- Multiple agents must work on different assigned items.
- Work in dependency order unless explicitly overridden.
- If newer product/design direction refines an already-completed feature, keep the historical item complete and create a new refinement item for the remaining delta.

## Milestone 0 — Project foundation

### [x] #1 Initialize monorepo

Acceptance criteria:
- [x] Next.js app runs locally.
- [x] TypeScript strict mode enabled.
- [x] Tailwind configured.
- [x] pnpm workspace configured.
- [x] lint script exists and passes.
- [x] typecheck script exists and passes.
- [x] test script exists and passes.
- [x] CI runs lint, typecheck, and tests.

Depends on: none

---

### [x] #2 Define domain models

Acceptance criteria:
- [x] `TranscriptSegment` defined.
- [x] `VideoContent` defined.
- [x] `SentenceExplanation` defined.
- [x] `LearningItem` defined.
- [x] `LearningContext` defined.
- [x] Types exported from owning packages.
- [x] Domain packages have no UI dependencies.

Depends on: #1

## Milestone 1 — First magical moment

> Paste a Korean YouTube video, click one sentence, understand it.

### [x] #3 YouTube URL parser

Acceptance criteria:
- [x] Supports `youtube.com/watch?v=...`.
- [x] Supports `youtu.be/...`.
- [x] Invalid URLs return a useful error.
- [x] Unit tests cover supported formats.

Depends on: #1, #2

---

### [x] #4 YouTube transcript adapter

Acceptance criteria:
- [x] Behind `TranscriptSource`.
- [x] Returns normalized transcript segments.
- [x] Prefers Korean captions.
- [x] Preserves timestamps.
- [x] Handles manual captions where available.
- [x] Handles auto captions where supported.
- [x] Explicit no-transcript error.
- [x] Explicit no-Korean-transcript error.
- [x] Explicit invalid/unsupported-video error.
- [x] Explicit provider/rate-limit error.
- [x] Contract/unit tests exist.

Depends on: #2, #3

---

### [x] #5 Video + transcript viewer

Acceptance criteria:
- [x] Video renders.
- [x] Timestamped transcript renders.
- [x] Clicking segment seeks video.
- [x] Current segment can be identified from playback position.
- [x] Long transcripts remain usable.
- [x] No AI is required for this feature.

Depends on: #3, #4

---

### [x] #6 AI provider interface

Acceptance criteria:
- [x] `LanguageModel` interface defined.
- [x] OpenAI-compatible provider implemented first.
- [x] BYO API key supported.
- [x] Custom base URL supported where practical.
- [x] Provider code does not leak into UI.
- [x] Invalid model output becomes a controlled error.
- [x] Secrets are never logged.

Depends on: #1, #2

---

### [x] #7 Structured sentence explanation

Acceptance criteria:
- [x] Returns natural meaning.
- [x] Returns word/phrase breakdown.
- [x] Returns grammar explanation.
- [x] Returns nuance when relevant.
- [x] Uses structured output.
- [x] Validated with Zod.
- [x] Handles contractions.
- [x] Handles slang/fillers.
- [x] Handles casual speech.
- [x] Handles honorifics/speech levels.
- [x] Default explanation is concise.
- [x] Tests cover invalid structured output.

Depends on: #6

---

### [x] #8 Explanation panel

Acceptance criteria:
- [x] Selected sentence shown.
- [x] Natural meaning prioritized.
- [x] Breakdown shown.
- [x] Grammar shown.
- [x] Nuance shown when relevant.
- [x] Loading state.
- [x] Error state.
- [x] Integrates from transcript click.
- [x] Reasonably responsive.

Note: this records the original explanation UI. The newer canonical Watch/Study interaction is tracked in #29 rather than rewriting completed history.

Depends on: #5, #7

---

### [x] #9 Cache explanations locally

Acceptance criteria:
- [x] Dexie configured.
- [x] Explanations persist locally.
- [x] Refresh preserves explanation.
- [x] Cached explanation avoids repeat model call.
- [x] Cache key includes prompt version.
- [x] Cache can be cleared.
- [x] API keys are not stored in explanation records.

Depends on: #7, #8

## Milestone 2 — Personal learning state

### [x] #10 Word / phrase interaction

Acceptance criteria:
- [x] Learner can select/click Korean word or phrase.
- [x] Contextual meaning shown.
- [x] Dictionary form shown when relevant.
- [x] Source sentence stored.

Depends on: #8, #9

---

### [x] #11 "I know this" action

Acceptance criteria:
- [x] Creates/updates learner item.
- [x] State becomes `known`.
- [x] Persists locally.
- [x] UI updates immediately.
- [x] Action appears in the same word/phrase explanation card.
- [x] After saving, the card shows a persistent confirmation with an `Undo` action.
- [x] Confirmation remains until the learner selects another word or phrase.
- [x] `Undo` removes the saved state and restores the appropriate action.
- [x] Existing `learning` items offer "I know this" instead of duplicate save actions.

Depends on: #10

---

### [x] #12 "Learn this" action

Acceptance criteria:
- [x] State becomes `learning`.
- [x] Source sentence stored.
- [x] Source video/timestamp stored.
- [x] Initial review scheduled.
- [x] Action appears in the same word/phrase explanation card.
- [x] The clicked word or phrase/form is saved as the learner item.
- [x] Dictionary form is stored as supporting metadata when available.
- [x] Repeated encounters reuse the learner item and add source contexts.
- [x] Existing `known` items offer "Learn this again".
- [x] After saving, the card shows a persistent confirmation with an `Undo` action.

Depends on: #10

---

### [x] #13 Learning history

Acceptance criteria:
- [x] Recent explained sentences shown.
- [x] Recent learning items shown.
- [x] Source video/timestamp shown when available.

Depends on: #9, #11, #12

## Milestone 3 — Contextual review

### [x] #14 Review scheduler

Acceptance criteria:
- [x] Scheduler behind an interface.
- [x] Success increases interval.
- [x] Failure shortens interval.
- [x] Unit tests cover transitions.

Depends on: #12

---

### [x] #15 Review queue

Acceptance criteria:
- [x] Due items shown in sensible order.
- [x] Empty state exists.
- [x] Session length can be capped.
- [x] Context sentence displayed.

Depends on: #14

---

### [x] #16 Cloze review

Acceptance criteria:
- [x] Uses source sentence.
- [x] Supports answer reveal.
- [x] Learner marks success/failure.
- [x] Confidence updates.

Depends on: #15

---

### [x] #17 Mixed review modes

Acceptance criteria:
- [ ] Recognition mode.
- [ ] Production mode.
- [ ] Cloze mode.
- [ ] Review type stored.
- [ ] Recognition/production confidence tracked separately.

Depends on: #16

## Milestone 4 — Difficulty and progress

### [ ] #18 Simple learner profile

Acceptance criteria:
- [ ] Known vocabulary summary.
- [ ] Learning vocabulary summary.
- [ ] Grammar item summary.
- [ ] Recognition confidence summary.
- [ ] Production confidence summary.
- [ ] Speech-level familiarity supported.

Depends on: #11, #12, #17

---

### [ ] #19 Video difficulty estimate

Acceptance criteria:
- [ ] Approximate difficulty shown.
- [ ] Approximate likely comprehension shown.
- [ ] Estimate uses learner state when available.
- [ ] New-learner fallback exists.
- [ ] Difficult content remains accessible.

Depends on: #18

---

### [x] #20 Difficult-content warning

Acceptance criteria:
- [x] Warning is non-blocking.
- [x] Learner can continue.
- [x] Wording is informative, not discouraging.

Depends on: #19

---

### [ ] #21 Progress dashboard

Acceptance criteria:
- [ ] Known items.
- [ ] Learning items.
- [ ] Review success.
- [ ] Explanation frequency.
- [ ] Content studied.
- [ ] Comprehension-oriented information is visually prioritized over vanity metrics.
- [ ] Layout follows `DESIGN.md` rather than a generic KPI-card dashboard.

Depends on: #18

---

### [ ] #22 Revisit old content

Acceptance criteria:
- [ ] Previously studied content detected.
- [ ] Progress can be compared across time.
- [ ] Replay offered.
- [ ] Comparison can communicate `Then` vs `Now` comprehension when data supports it.

Depends on: #19, #21

## Milestone 5 — Product guidance

### [x] #23 Continue-learning home screen

Acceptance criteria:
- [x] Resume unfinished/recent video.
- [x] Due review surfaced.
- [x] Recent content surfaced.
- [x] Recommended content can be surfaced when recommendation data exists.
- [x] New-content entry point exists.
- [x] Home mixes continuation, review, and content discovery in one calm hierarchy.
- [x] Home answers "What should I do next?" and does not become a generic metrics dashboard.
- [x] Desktop layout follows `DESIGN.md` reference hierarchy.

Depends on: #13, #15

---

### [ ] #24 Opinionated recommendation engine

Acceptance criteria:
- [ ] Rule-based first.
- [ ] Recommendation includes reason.
- [ ] Uses recent weaknesses.
- [ ] User can dismiss.
- [ ] Core prioritization does not require AI.

Depends on: #18, #23

## Milestone 6 — Portability

### [ ] #25 Export learner data

Acceptance criteria:
- [ ] Versioned JSON format.
- [ ] Learner items included.
- [ ] History included.
- [ ] Review state included.
- [ ] API keys excluded.

Depends on: #18

---

### [ ] #26 Import learner data

Acceptance criteria:
- [ ] Zod validation.
- [ ] Corrupt files safely rejected.
- [ ] Conflict behavior documented.
- [ ] Schema version checked.

Depends on: #25

## Milestone 7 — Open-source deployment

### [ ] #27 Persistent AI provider configuration

Acceptance criteria:
- [x] AI provider settings are stored in IndexedDB through `@korean-learning/storage`.
- [x] The stored profile supports provider type, model, optional base URL, and API key.
- [x] The default profile is restored after refresh and browser restart.
- [x] AI explanations use the restored profile without requiring re-entry.
- [x] Settings can be edited and saved from a dedicated AI settings surface.
- [x] The API key can be removed explicitly.
- [x] API keys are not written to explanation, learner, history, or export records.
- [x] API keys are never logged.
- [x] The UI explains that browser persistence is local convenience, not a secure secret vault.
- [x] Missing or invalid settings produce a controlled, actionable error.
- [x] Existing users with in-memory settings continue to work during the session.
- [x] IndexedDB schema migration from the current version is tested.
- [x] Unit tests cover save, reload, update, removal, and missing-settings behavior.
- [x] User-visible settings states have component tests.
- [x] Browser verification confirms settings survive reload.

Remaining: keep the top-level item unchecked until the default `pnpm build` command passes; the Webpack production-build fallback passes, while Turbopack currently fails with an environment-level port-permission panic.

Depends on: #6, #9

---

### [ ] #28 Self-hosted deployment AI defaults

Acceptance criteria:
- [ ] A self-hosted deployment can configure a default OpenAI-compatible endpoint through environment variables.
- [ ] Deployment configuration is never exposed in exportable learner data.
- [ ] Users can use deployment defaults without entering an API key.
- [ ] User-local BYOK settings override deployment defaults.
- [ ] Missing deployment configuration produces a clear setup message.
- [ ] Documentation covers environment variables and secret handling.

Depends on: #27

## Milestone 8 — Canonical desktop learning UX

> Consolidate existing capabilities into the desktop-first Watch -> Study -> Review experience defined by `PRODUCT.md` and `DESIGN.md`.

### [x] #29 Watch / Study media workspace

Acceptance criteria:
- [x] Desktop Watch layout uses persistent video + Korean transcript as dominant surfaces.
- [x] Watch is the default mode when opening a video.
- [x] Guided Watch does not persistently show English translation.
- [x] Clicking a transcript sentence pauses playback automatically.
- [x] Selected sentence opens an anchored contextual breakdown popover/overlay in Watch.
- [x] Explanation preserves nearby transcript context.
- [x] Natural meaning is prioritized over literal translation.
- [x] Meaningful phrase chunks precede morphology-first decomposition.
- [x] Grammar, nuance, and examples use progressive disclosure.
- [x] Learner can switch Watch/Study without losing video/transcript context.
- [x] Study gives persistent space to selected sentence and deeper explanation.
- [x] `Learn this` / `I know this` remain available in relevant phrase context.
- [x] Saving shows low-friction confirmation without a configuration modal.
- [x] Long transcripts remain usable.
- [x] Keyboard/focus behavior and selected/current-playback states are accessible.
- [x] Rendered desktop flow is verified against `DESIGN.md` ASCII references.

Depends on: #5, #8, #10, #11, #12

Verified through merged #58 / PR #68 deterministic browser gate, checked-in visual baselines, rendered QA evidence in `docs/QA-29D.md`, and the documented separate real-YouTube smoke strategy.

---

### [x] #30 Assistance levels

Acceptance criteria:
- [x] Supports `full`, `guided`, and `immersion`.
- [x] Guided is default.
- [x] Assistance changes presentation, not learner knowledge state.
- [x] Full makes translation/help easier to reveal while keeping Korean primary.
- [x] Guided keeps Korean first and reveals concise help after interaction.
- [x] Immersion is Korean-only by default and requires intentional requests for English help.
- [x] No assistance level proactively pauses playback because content appears difficult.
- [x] Preference persists locally.
- [x] Provider settings remain separate from assistance settings.

Implementation plan: [IMPLEMENTATION-30.md](IMPLEMENTATION-30.md). Verification evidence: [QA-30.md](QA-30.md).

Depends on: #29

---

### [ ] #31 Original-context video review

Acceptance criteria:
- [ ] Review resolves stored source video, transcript segment, and timestamp when available.
- [ ] Review attempts to present/replay a short source clip around the learned context.
- [ ] Korean sentence/phrase is shown before answer reveal.
- [ ] Learner recalls meaning before reveal.
- [ ] Reveal shows natural meaning and useful source context.
- [ ] Learner can mark at least `Again` / `Got it` or equivalent failure/success.
- [ ] Scheduler updates remain independent from clip playback success.
- [ ] If clip playback is unavailable, review falls back to sentence + source timestamp/context.
- [ ] Existing cloze behavior is not silently removed without documented replacement/compatibility behavior.
- [ ] Rendered Review flow is verified against `DESIGN.md`.

Depends on: #15, #29

---

### [x] #32 Cross-surface visual system consistency

Apply the existing `DESIGN.md` Warm Korean Editorial direction consistently across Home, Watch, Study, Review, Progress, and Settings. This is a visual-system refinement, not a new product direction.

GitHub issue: [#65](https://github.com/rayjosong/korean-learning-app/issues/65)

Acceptance criteria:
- [x] Named semantic tokens cover canvas, surfaces, text, borders, primary actions, selection, current playback, success/known, warning, and error states.
- [x] User-facing components use semantic tokens or documented design-system utilities instead of mixing legacy dark-theme `slate`, `sky`, `emerald`, and repeated raw hex colours.
- [x] Watch keeps the video and Korean transcript visually dominant, with English and supporting guidance subordinate.
- [x] Selected and currently playing transcript sentences remain visually distinct and are not communicated by colour alone.
- [x] Persimmon is reserved for primary actions, focus, selection, and learning emphasis; jade is reserved for success/known states; warm yellow is reserved for current playback or temporary highlights.
- [x] Revisit, difficulty, review, progress, history, provider settings, and learner-profile surfaces share the same light-theme text, surface, border, radius, and depth rules.
- [x] Cards and shadows follow `DESIGN.md`: whitespace and hairlines provide normal grouping, while stronger shadows are limited to temporary overlays/popovers.
- [x] Loading, empty, success, warning, and error states meet WCAG AA contrast where applicable and retain clear non-colour cues.
- [x] Existing Watch/Study session, transcript, explanation, learning-action, review, progress, and settings behavior does not regress during the visual migration.
- [x] Deterministic visual coverage protects Home, Watch default, Watch selected sentence, expanded explanation, Study, long transcript, compact desktop, Review, Progress, and Settings states where implemented.
- [x] Accessibility verification covers contrast, visible focus, keyboard operation, and selected-versus-playing state communication.
- [x] Rendered desktop flows are inspected against the canonical `DESIGN.md` references.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass before the item is marked complete.

Completed: deterministic visual and accessibility coverage is recorded in [QA-32.md](QA-32.md). The suite retains the three #29 reviewed baselines and adds the #32 state matrix. Fixture dates, transcript lengths, learner data, loading/error transitions, and the local Pretendard font are pinned for repeatable captures. Utilities remain collapsed by default.

Implementation plan:
1. Reconcile any in-progress palette migration and preserve unrelated work.
2. Promote the existing `DESIGN.md` palette into reusable semantic tokens and state styles.
3. Complete Watch, including transcript, playback/selection states, mode controls, and contextual explanation.
4. Complete Study, including persistent explanation, nearby context, learning actions, and feedback states.
5. Migrate Review, Progress, history, difficulty/revisit guidance, learner profile, and Settings to the same system.
6. Remove or document remaining direct colour values and legacy dark-theme utilities.
7. Add deterministic visual and accessibility coverage, then run the full verification gate.

Depends on: #29

## Later — not V0.1

- AI conversation missions.
- Post-conversation correction and retry.
- Pronunciation flagging only when misunderstanding is likely.
- Rich recommended Korean content feed beyond the V0.1 home guidance surface.
- Browser extension.
- Music/lyrics ingestion.
- Native mobile app.
- Mobile-first redesign beyond functional responsive web.
- Optional sync.
- More AI providers.
- Advanced learner model / FSRS.

## Current product integration priority

Foundational capabilities exist, but they still need to become one coherent learning experience:

```text
#29 Watch / Study media workspace
 -> #32 Cross-surface visual system consistency
 -> #30 Assistance levels
 -> #31 Original-context video review
```

Continue other unblocked work according to dependencies. Do not mark UX refinement complete merely because older underlying capabilities already exist.
