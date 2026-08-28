# TESTING.md

## Purpose

This document defines the canonical regression-prevention and verification strategy for the Korean Learning App.

The product contains interaction-heavy behavior that cannot be protected by unit tests alone: synchronized video/transcript state, Watch/Study mode transitions, contextual overlays, learner-state actions, persistence, accessibility, and visual layout. Verification therefore uses multiple layers, each protecting a different class of failure.

`AGENTS.md` defines when agents must run verification. This document defines **what kinds of tests should exist, what they protect, and how to decide where a regression belongs**.

---

## 1. Testing philosophy

Prefer the smallest reliable test that proves the observable behavior.

Use this hierarchy:

```text
Pure domain behavior
        -> unit test
Component collaboration
        -> component/integration test
Critical user journey
        -> Playwright end-to-end test
Visual/layout contract
        -> Playwright screenshot regression
Accessibility semantics
        -> automated a11y + keyboard checks
External browser integration
        -> small real-service smoke test
```

Do not try to prove everything through browser E2E tests. Browser tests should protect the critical product journeys and integration seams; domain edge cases should remain in fast deterministic tests.

A bug fix must add a regression test at the lowest layer that would have caught the bug, plus a higher-level test only when the failure crosses component or browser boundaries.

---

## 2. Required layers

### 2.1 Unit tests

Use unit tests for pure or mostly pure behavior, including:

- transcript/timestamp calculations;
- active-segment resolution;
- learner-state transitions;
- review scheduling;
- phrase/context normalization;
- assistance-mode presentation rules when modeled as pure logic;
- cache-key or persistence helpers;
- reducers/state machines that coordinate Watch/Study state;
- error normalization and boundary validation.

Unit tests should be fast, deterministic, and independent of DOM/browser behavior.

Do not use unit tests as the only proof for user-visible interactions such as playback pause, focus return, overlays, responsive layout, or Watch/Study continuity.

---

### 2.2 Component / integration tests

Use component or integration tests for observable collaboration between UI/application pieces.

Examples:

- clicking a transcript sentence requests `seekTo` + `pause` and updates selected-sentence state;
- current playback segment and learner-selected sentence remain distinct;
- sentence inspector renders after selection and closes without clearing unrelated session state;
- `Learn this` updates the rendered learner state and shows low-friction confirmation;
- Watch -> Study preserves the selected sentence and current media position;
- cached explanation is reused rather than triggering unnecessary loading behavior;
- error -> retry recovers locally without resetting the entire workspace.

Prefer testing public behavior and rendered state. Avoid asserting internal hook names, private implementation details, or arbitrary component structure.

---

### 2.3 End-to-end browser tests

Use Playwright for a **small set of critical golden-path journeys**.

The goal is not a huge E2E suite. The goal is confidence that the real product wiring still works.

Canonical desktop Watch/Study journey:

```text
open fixture video/session
-> Watch is default
-> transcript renders
-> select sentence
-> player seeks and pauses
-> contextual inspector appears
-> save a phrase
-> confirmation appears
-> switch to Study
-> selection and player context persist
-> navigate sentence context
-> switch back to Watch
-> session context persists
-> close inspector
-> resume playback
```

Other high-value journeys:

- explanation failure -> retry without session reset;
- persistence survives reload where the feature promises persistence;
- long transcript remains usable while playback and inspection diverge;
- review journey using stored original context when implemented;
- provider/settings flows that are required for explanations.

Keep E2E tests deterministic wherever possible by using fixtures and fakes for external services.

---

### 2.4 Visual regression tests

Use Playwright screenshots to protect the canonical UI contract in `DESIGN.md`.

Recommended baseline states:

1. Home desktop canonical state;
2. Watch default;
3. Watch selected sentence + paused player + inspector;
4. Watch progressive detail expanded;
5. Study with selected sentence;
6. Study after nearby-sentence navigation;
7. Review canonical state when #31 exists;
8. Progress canonical state when #21 exists;
9. important loading/error states that materially affect layout.

For backlog #29 specifically, at minimum protect Watch default, Watch inspector, Study, long transcript, and compact-desktop fallback.

Visual tests should use deterministic content, fonts, viewport sizes, time, and animation settings where practical.

A screenshot baseline must not be updated merely because a test failed. The PR must explain why the visual difference is intentional and confirm it still follows `DESIGN.md`.

---

### 2.5 Accessibility regression tests

Automated accessibility checks should complement, not replace, keyboard/manual verification.

Use automated checks such as axe-core in Playwright for canonical user-facing screens when practical.

Protect at least:

- accessible names/roles for controls;
- invalid ARIA patterns;
- obvious contrast violations;
- duplicate IDs / structural violations detected by the tool;
- modal/non-modal semantics where relevant.

Keyboard checks should verify observable interactions that automated scanners cannot prove:

- transcript sentences can be reached and activated;
- Watch/Study control is operable by keyboard;
- `Escape` dismisses the Watch inspector;
- focus returns to a sensible trigger/nearby element;
- non-modal inspector does not trap focus;
- progressive-disclosure controls are reachable;
- learner actions and Undo are operable;
- selected vs currently-playing transcript state is not communicated by color alone.

---

### 2.6 Real external-integration smoke tests

Most CI tests must not depend on live YouTube, live AI providers, or other unstable external services.

However, mocks cannot prove that browser integration with an external system still works. Keep a **very small smoke layer** for that purpose.

For YouTube, a smoke check may verify with a known suitable fixture video:

```text
player loads
-> transcript/caption-backed session is available
-> one timestamp interaction works
-> pause/seek behavior is observable
```

Do not make the full PR test suite dependent on live provider availability.

If live integration is too unstable or requires secrets, run it separately from the deterministic required CI gate (for example scheduled, manual, or post-deploy), and make failures visible/actionable.

---

## 3. Deterministic fixtures

Prefer fixed fixtures for ordinary CI.

Suggested fixture categories:

```text
test/fixtures/
  video-short.json
  transcript-short-ko.json
  transcript-long-ko.json
  transcript-no-captions.json
  explanation-success.json
  explanation-error.json
  learner-state.json
  review-context.json
```

The exact directory may follow existing repository conventions; the important requirement is that canonical regression tests do not rely on network responses changing underneath them.

The web browser suite uses named query fixtures through `apps/web/e2e/fixture.ts` and `apps/web/lib/fixture-session.ts`: `watch-study`, `long`, `populated`, `loading`, and `error`. These fixtures pin the browser date, use the local Pretendard font, and seed IndexedDB when learner-state coverage is needed. The loading fixture is released by an explicit test event, and the error fixture uses the deterministic model failure path.

Fixtures should represent real product edge cases:

- short and long transcripts;
- nearby sentence context;
- Korean casual speech / phrase chunks;
- no transcript / provider error;
- cached vs uncached explanation;
- known / learning / unsaved phrase state.

---

## 4. Player abstraction for testability

UI behavior should depend on a narrow player contract rather than directly requiring a live YouTube iframe in every test.

Conceptually:

```ts
interface PlayerController {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  getCurrentTime(): number;
}
```

The real YouTube adapter implements the contract. Tests use a deterministic fake/spied controller.

This allows component/integration tests to assert observable commands such as:

```text
select transcript sentence
-> seekTo(timestamp)
-> pause()
```

without loading the network iframe.

Do not duplicate product playback rules inside the fake. The fake records commands/state; the application code remains responsible for behavior.

---

## 5. Canonical regression matrix for Watch / Study

Backlog #29 is especially sensitive to cross-surface regressions. Protect these behaviors across the appropriate layers:

| Behavior | Unit | Component/integration | E2E | Visual | A11y |
| --- | --- | --- | --- | --- | --- |
| Watch is default | optional | yes | yes | yes | — |
| active vs selected sentence are distinct | yes | yes | yes | yes | yes |
| sentence click seeks + pauses | — | yes | yes | — | keyboard equivalent |
| inspector opens/closes without session reset | — | yes | yes | yes | yes |
| phrase-first explanation hierarchy | optional | yes | yes | yes | — |
| Learn/I know + confirmation/Undo | domain rules | yes | yes | optional | yes |
| Watch -> Study preserves context | state/reducer | yes | yes | yes | yes |
| Study -> Watch preserves context | state/reducer | yes | yes | yes | yes |
| long transcript does not fight inspection | helper logic if any | yes | yes | yes | — |
| explanation error -> retry | boundary logic | yes | yes | optional | yes |
| desktop viewport hierarchy | — | — | yes | yes | — |

Not every cell must contain a separate test if one test covers multiple behaviors cleanly. The matrix describes risk coverage, not a quota.

---

## 6. CI policy

The current baseline verification remains:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

As browser regression tooling is implemented, add explicit scripts rather than hiding expensive browser tests inside an ambiguous `pnpm test` command.

Target command shape:

```bash
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
```

Exact script names may change when implementation lands, but CI and `AGENTS.md` must make the required checks explicit.

For user-facing backlog work, required CI should eventually gate merge on:

```text
lint
+ typecheck
+ unit/component tests
+ build
+ required deterministic E2E golden paths
+ required accessibility checks
+ required visual regression checks
```

Live external-service smoke tests may remain a separate non-deterministic gate unless they can be made sufficiently reliable.

---

## 7. CI artifacts and failure diagnosis

Browser test jobs should upload useful artifacts on failure, including where supported:

- Playwright HTML report;
- trace;
- screenshot diff / actual / expected;
- failure screenshots;
- relevant browser logs.

Agents must inspect these artifacts before changing product code or test baselines.

Do not repeatedly rerun a deterministic failure without understanding the root cause.

---

## 8. Flake policy

A flaky required test is a product-engineering problem, not normal noise.

Do not solve flakiness by:

- adding arbitrary sleeps;
- broad retries that hide deterministic failures;
- weakening assertions until the test passes;
- deleting the test without replacement;
- depending on changing external data in deterministic CI.

Prefer:

- deterministic fixtures;
- waiting for observable application state;
- controlled clocks/animations;
- stable locators based on roles/names/test IDs where appropriate;
- separating live-provider smoke tests from deterministic gates.

If a test is temporarily quarantined, the PR must document why, what risk becomes uncovered, and the follow-up work required.

---

## 9. Branch protection / merge policy

Once the browser regression jobs exist and are stable, configure repository branch protection/rulesets so required checks must pass before merge.

Tests that are not required checks are advisory only and can be accidentally bypassed.

At minimum, critical deterministic CI checks for `main` should be required.

Agents must not merge around a failing required regression test by changing workflow configuration unless the workflow itself is the assigned bug and the protection remains equivalent or stronger.

---

## 10. PR expectations for user-facing changes

A user-facing PR should state:

- which product surface/mode changed;
- what regression risk was introduced;
- which unit/component/E2E/visual/a11y tests protect the new behavior;
- which canonical `DESIGN.md` screenshot/reference states were checked;
- any omitted browser/live integration verification and why;
- whether screenshots or Playwright artifacts are attached.

For bug fixes, name the regression test that would fail before the fix.

---

## 11. Backlog #29 completion gate

Backlog #29D is the final integrated regression gate for the desktop Watch/Study workspace.

29D must not treat `pnpm test` alone as sufficient evidence.

Before top-level backlog #29 can be completed, 29D must verify the merged 29A/29B/29C behavior with layered coverage that includes:

- unit tests for newly introduced pure state/logic;
- component/integration coverage for player + transcript + inspector + learner interactions;
- deterministic Playwright golden-path coverage for Watch <-> Study;
- screenshot/visual regression coverage for canonical desktop states;
- accessibility scans plus keyboard/focus verification;
- a documented real-browser YouTube smoke check where practical;
- standard lint/typecheck/test/build verification.

If the repository does not yet have the required E2E/visual/a11y infrastructure, 29D owns establishing the minimum infrastructure needed to provide this gate rather than claiming #29 complete without it.

---

## 12. One-line rule

When choosing a test, ask:

> **What is the cheapest deterministic test that would fail if the user-visible contract regressed?**

Then add higher-level browser coverage only where the behavior depends on real component, layout, focus, persistence, or integration wiring.
