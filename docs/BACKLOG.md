# BACKLOG.md

## Rules

- The top-level checkbox is the canonical completion state.
- A top-level item may be checked only when every acceptance criterion is checked and verified.
- Agents must follow `/AGENTS.md`.
- Multiple agents must work on different assigned items.
- Work in dependency order unless explicitly overridden.

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

Depends on: #18

---

### [ ] #22 Revisit old content

Acceptance criteria:
- [ ] Previously studied content detected.
- [ ] Progress can be compared across time.
- [ ] Replay offered.

Depends on: #19, #21

## Milestone 5 — Product guidance

### [ ] #23 Continue-learning home screen

Acceptance criteria:
- [ ] Resume unfinished video.
- [ ] Due review surfaced.
- [ ] Recent content surfaced.
- [ ] New-content entry point exists.

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

## Later — not V0.1

- AI conversation missions.
- Post-conversation correction and retry.
- Pronunciation flagging only when misunderstanding is likely.
- Recommended Korean content feed.
- Browser extension.
- Music/lyrics ingestion.
- Mobile app.
- Optional sync.
- More AI providers.
- Advanced learner model / FSRS.

## Recommended first implementation order

`#1 -> #2 -> #3/#6 -> #4/#7 -> #5 -> #8 -> #9`

After #9, stop and use the product on a real Korean video before expanding scope.
