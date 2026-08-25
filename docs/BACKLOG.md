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

### [ ] #4 YouTube transcript adapter

Acceptance criteria:
- [ ] Behind `TranscriptSource`.
- [ ] Returns normalized transcript segments.
- [ ] Prefers Korean captions.
- [ ] Preserves timestamps.
- [ ] Handles manual captions where available.
- [ ] Handles auto captions where supported.
- [ ] Explicit no-transcript error.
- [ ] Explicit no-Korean-transcript error.
- [ ] Explicit invalid/unsupported-video error.
- [ ] Explicit provider/rate-limit error.
- [ ] Contract/unit tests exist.

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

### [ ] #7 Structured sentence explanation

Acceptance criteria:
- [ ] Returns natural meaning.
- [ ] Returns word/phrase breakdown.
- [ ] Returns grammar explanation.
- [ ] Returns nuance when relevant.
- [ ] Uses structured output.
- [ ] Validated with Zod.
- [ ] Handles contractions.
- [ ] Handles slang/fillers.
- [ ] Handles casual speech.
- [ ] Handles honorifics/speech levels.
- [ ] Default explanation is concise.
- [ ] Tests cover invalid structured output.

Depends on: #6

---

### [ ] #8 Explanation panel

Acceptance criteria:
- [ ] Selected sentence shown.
- [ ] Natural meaning prioritized.
- [ ] Breakdown shown.
- [ ] Grammar shown.
- [ ] Nuance shown when relevant.
- [ ] Loading state.
- [ ] Error state.
- [ ] Integrates from transcript click.
- [ ] Reasonably responsive.

Depends on: #5, #7

---

### [ ] #9 Cache explanations locally

Acceptance criteria:
- [ ] Dexie configured.
- [ ] Explanations persist locally.
- [ ] Refresh preserves explanation.
- [ ] Cached explanation avoids repeat model call.
- [ ] Cache key includes prompt version.
- [ ] Cache can be cleared.
- [ ] API keys are not stored in explanation records.

Depends on: #7, #8

## Milestone 2 — Personal learning state

### [ ] #10 Word / phrase interaction

Acceptance criteria:
- [ ] Learner can select/click Korean word or phrase.
- [ ] Contextual meaning shown.
- [ ] Dictionary form shown when relevant.
- [ ] Source sentence stored.

Depends on: #8, #9

---

### [ ] #11 "I know this" action

Acceptance criteria:
- [ ] Creates/updates learner item.
- [ ] State becomes `known`.
- [ ] Persists locally.
- [ ] UI updates immediately.

Depends on: #10

---

### [ ] #12 "Learn this" action

Acceptance criteria:
- [ ] State becomes `learning`.
- [ ] Source sentence stored.
- [ ] Source video/timestamp stored.
- [ ] Initial review scheduled.

Depends on: #10

---

### [ ] #13 Learning history

Acceptance criteria:
- [ ] Recent explained sentences shown.
- [ ] Recent learning items shown.
- [ ] Source video/timestamp shown when available.

Depends on: #9, #11, #12

## Milestone 3 — Contextual review

### [ ] #14 Review scheduler

Acceptance criteria:
- [ ] Scheduler behind an interface.
- [ ] Success increases interval.
- [ ] Failure shortens interval.
- [ ] Unit tests cover transitions.

Depends on: #12

---

### [ ] #15 Review queue

Acceptance criteria:
- [ ] Due items shown in sensible order.
- [ ] Empty state exists.
- [ ] Session length can be capped.
- [ ] Context sentence displayed.

Depends on: #14

---

### [ ] #16 Cloze review

Acceptance criteria:
- [ ] Uses source sentence.
- [ ] Supports answer reveal.
- [ ] Learner marks success/failure.
- [ ] Confidence updates.

Depends on: #15

---

### [ ] #17 Mixed review modes

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

### [ ] #20 Difficult-content warning

Acceptance criteria:
- [ ] Warning is non-blocking.
- [ ] Learner can continue.
- [ ] Wording is informative, not discouraging.

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
