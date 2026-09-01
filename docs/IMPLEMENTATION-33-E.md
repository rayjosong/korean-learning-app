# #33-E Watch/Study streaming integration and quality gate

## Purpose

Connect resolved language models to the Watch and Study explanation surfaces, render safe streamed states, and establish the browser, visual, and accessibility regression gate.

## Dependencies and parallel boundary

Depends on #33-B's stream contract and #33-D's route-aware model construction. It owns session/explanation hooks, explanation rendering, deterministic stream fixtures, and end-to-end validation. It does not edit storage or provider adapter implementation.

## Interaction contract

```text
select sentence
  -> pause video
  -> show Preparing explanation… + Stop
  -> show natural meaning as it streams
  -> add completed phrase/grammar/nuance units atomically
  -> validate final result and cache

Stop or malformed result
  -> remove transient output
  -> keep selected sentence and media state
  -> show actionable Try again
  -> write no cache record
```

Provider brands must remain confined to Settings. Watch and Study use existing product typography and progressive disclosure.

## Files

| File | Work |
| --- | --- |
| `apps/web/components/study-session.tsx` | Resolve independent sentence and word models, preserve fixture behavior, and pass the streaming state into existing surfaces. |
| `apps/web/lib/use-sentence-explanation.ts` | Add idle/loading/streaming/ready/error state, `AbortController`, `cancel()`, and stale-request protection. |
| `apps/web/lib/use-word-explanation.ts` | Add equivalent streamed word/phrase behavior and final-only persistence. |
| `apps/web/components/sentence-breakdown-popover.tsx` | Render streamed natural meaning and atomic sections; add quiet Stop and accessible retry behavior. |
| `apps/web/components/explanation-panel.tsx` | Render the same contract in Study's persistent surface. |
| `apps/web/lib/fixture-session.ts` | Add deterministic complete, held, malformed, cancelled, and route-metadata stream fixtures. |
| component tests for hooks/surfaces | Test partial rendering, stop, retry, final cache write, and no provider brand. |
| `apps/web/e2e/*` | Add deterministic Settings persistence, streamed explanation, cancellation/no-cache, and next-request-route browser flows. |
| `apps/web/e2e/visual.spec.ts` | Add Settings profile and Watch/Study partial-stream screenshots. |

## Acceptance criteria

- [ ] Watch remains video/transcript-first while a popover streams.
- [ ] Study renders the same explanation state without a second AI request.
- [ ] Stop aborts and leaves no partial cache data.
- [ ] Retry preserves video position and selected sentence.
- [ ] Keyboard, Escape, focus return, contrast, and non-colour state cues remain correct.
- [ ] Deterministic browser, visual, and accessibility checks pass.

## Final integration work

After all packages merge, update `docs/BACKLOG.md`, `docs/ARCHITECTURE.md`, `DESIGN.md`, and `docs/TESTING.md` in one documentation-only commit. Add #33 without changing the historical completion state of #6, #7, #9, or #27.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run the relevant browser E2E, visual, accessibility, and manual live-key smoke checks separately. Live providers must not be required by CI.

