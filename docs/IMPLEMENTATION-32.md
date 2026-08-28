# Backlog #32 — Cross-surface visual consistency implementation plan

## Assignment and status

- Canonical backlog: [#32 Cross-surface visual system consistency](BACKLOG.md#32-cross-surface-visual-system-consistency).
- Tracking issue: [GitHub #65](https://github.com/rayjosong/korean-learning-app/issues/65). GitHub #32 is an unrelated, closed PR.
- Baseline inspected: `main` at `5ceb4bfcb7ce5c197a1a85fa46bf1b2841752634` (2026-08-27).
- Status: planning complete; product backlog #32 remains **partial and unchecked**.
- Dependency: backlog #29 is complete on this baseline. Recheck the starting branch before implementation.
- Implementation branch: `agent/32-cross-surface-visual-system`; this planning change uses `agent/32-cross-surface-implementation-plan`.

This plan describes the remaining work, not a second palette migration. Preserve completed acceptance criteria and existing behavior; verify them again on the final integrated branch. This documentation PR neither implements the remaining work nor certifies the existing UI.

Before implementation, read in order: [AGENTS.md](../AGENTS.md), [PRODUCT.md](PRODUCT.md), [DESIGN.md](../DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [TESTING.md](TESTING.md), and [BACKLOG.md](BACKLOG.md). Those documents remain authoritative; this plan is the execution guide for #32.

## 1. Reconciled starting point

| Area | What is committed now | Consequence for implementation |
| --- | --- | --- |
| Visual language | Warm Korean Editorial tokens in `apps/web/tailwind.config.ts`; light canvas in `apps/web/app/globals.css`; AA state inks documented in DESIGN.md | Reuse and audit the existing tokens. Do not replace them with another theme or repeat the original sixteen-file migration. |
| Typography | Canonical Pretendard Variable; global CSS imports the version-pinned v1.3.9 dynamic-subset stylesheet from jsDelivr | A pinned URL does not eliminate network failure or fallback-font screenshots. Make font delivery deterministic before approving baselines. |
| Watch / Study | Shared session and contextual inspector already exist; #29 is complete | Preserve pause/seek, selection, player identity, phrase actions, progressive disclosure, and mode continuity. |
| Supporting surfaces | Cloze Review, Progress, history, profile, and provider settings render inside the collapsed `Workspace Utilities & Settings` disclosure | Test the actual reachable panels. Do not invent routes or build unfinished product modes. |
| Browser infrastructure | Root E2E/a11y/visual scripts, Playwright config, fake player, and `browser-regression` CI job already exist | Extend this suite rather than establishing a second browser harness. |
| Executable visual coverage | `apps/web/e2e/visual.spec.ts` contains exactly three screenshot tests: Watch default, Watch selected, and Study selected | Keep these tests and add the missing matrix below. A 24-segment fixture alone is not a dedicated long-transcript or compact-layout assertion. |
| Screenshot locations | Executable baselines currently resolve to `qa/29d/`; historical #32 before/after evidence is under `qa/screenshots/32/` | Evidence images are not regression tests. Do not copy historical PNGs into baseline slots without rendering and reviewing the same state. |

The older issue description and semantic-token decision record describe the state before the permanent #29 browser gate landed. Preserve historical records; use the current source, this plan, and the updated backlog note for execution. No open PR was found during this planning audit; check again before claiming implementation ownership.

## 2. Scope and invariants

Affected surfaces: **Home, Watch, Study, Review, Progress, Settings**, including their existing history, learner-profile, difficulty, revisit, cache, loading, and feedback UI.

In scope:

- Fill gaps in deterministic visual coverage and accessibility checks.
- Stabilize existing fixtures, fonts, dates, persistence, and asynchronous state readiness.
- Correct only demonstrated #32 visual inconsistencies needed to satisfy DESIGN.md.
- Document the final evidence and acceptance mapping.

Out of scope:

- New navigation destinations, a complete continue-learning Home (#23), assistance-level behavior (#30), original-video review (#31), or unfinished Progress product behavior (#21).
- A new palette, typeface, styling framework, component library, dark theme, or mobile redesign.
- Learner-state rules, review scheduling, provider logic, transcript parsing, schema changes, or unrelated refactors.

Keep Korean primary: transcript around 18px / 475 / 1.70, focused Study sentence around 26px / 550 / 1.60, and quieter English assistance. Use DESIGN.md's spacing, radius, and depth rules. Video and transcript dominate Watch; the inspector stays contextual; Study retains the same media session. Utilities remain collapsed initially and all existing capabilities stay reachable.

Use persimmon for action/focus/selection/learning, jade for known/success, and warm highlight for playback. Selection and playback must remain independently visible when they refer to different rows, and understandable without color. Check the combined selected-and-playing state too.

## 3. Ordered implementation work

### Step 1 — Reproduce and record the current baseline

1. Start from the latest main, read the required documents, confirm #29, and inspect any active #32 branch/PR. Preserve unrelated local changes.
2. Run the existing verification commands in section 6 before editing. Record the starting SHA, tool versions, failures, and existing screenshot coverage. Do not attribute an existing failure to new work.
3. Render Home and the fixture session at 1440×900; record the three existing baseline states at their current configured 1280×720 viewport as well.
4. Audit semantic colors and typography in the actual product files:

   ```bash
   rg -n --glob '*.{css,ts,tsx}' 'slate-|sky-|emerald-|rose-|amber-|#[0-9A-Fa-f]{3,8}' apps/web/app apps/web/components apps/web/tailwind.config.ts
   rg -n --glob '*.{css,ts,tsx}' 'shadow-|rounded-|font-|text-' apps/web/app apps/web/components
   ```

5. Classify results by role. Palette definitions in the Tailwind config are expected; per-component raw color exceptions need an explicit reason. Do not make a brittle source-string test the sole visual guard.
6. Inventory existing component tests and keep their behavioral assertions.

**Exit:** a dated baseline/coverage inventory, reproducible starting failures if any, and an explicit list of missing states. No acceptance checkboxes change.

### Step 2 — Make fixture rendering deterministic

Primary files: `apps/web/e2e/fixture.ts`, `apps/web/lib/fixture-session.ts`, and `apps/web/playwright.config.ts`; touch the loader/session only if a small fixture seam is necessary.

- Reuse `openFixture`, `FixturePlayer`, and the existing fixture language model. The fake records player state/commands; it must not implement selection or learning rules.
- Keep the default 24-segment fixture compatible with current tests. Add named scenarios only where needed: long transcript, deferred/error explanation, and persisted learner/review/progress/settings data.
- Use a fresh browser context per test. Seed through existing application/storage helpers or an isolated test-only adapter; never put direct Dexie writes or new learning rules in UI components.
- Fix dates, locale (`en-SG`), timezone, and seed values before app initialization. Control Date without accidentally stopping the polling/timers needed for playback. Use fixed IDs, due dates, review records, and source contexts.
- Generate realistic Review/Progress data through existing boundaries. Do not fake UI output merely to make the screenshot look populated. Use only synthetic provider credentials and never call a real model endpoint.
- For loading/error screenshots, hold a request or fake promise until the test releases it; reject once for retry coverage. Do not race a screenshot against an arbitrary timeout.
- Wait for database hydration, intended text/state, player readiness, and font readiness. Disable animation/caret noise for capture, without hiding real layout or feedback.

**Font decision:** prefer locally bundled, version-pinned Pretendard assets with their license, using the same font in product and tests. This is delivery hardening of the existing typeface, not a font redesign. If retaining the CDN in production, intercept its CSS/font requests with pinned local assets in browser tests and separately verify production delivery. Confirm the actual Korean and Latin glyph faces loaded; `document.fonts.ready` alone can resolve after a font failure. Do not approve fallback-font baselines.

**Exit:** repeated clean-context captures produce stable images without live YouTube, live AI, or runtime font-network dependencies.

### Step 3 — Extend the existing screenshot suite

Extend `apps/web/e2e/visual.spec.ts`; reuse helpers from `fixture.ts`. Keep baseline names unique.

- Retain the three 1280×720 #29 snapshots and their paths. Do not migrate unrelated baselines just for tidiness.
- The current `snapshotPathTemplate` is `../../qa/29d/{arg}{ext}`. Add uniquely named #32 baselines under this existing layout (for example `32-home-1440.png`) unless an explicitly reviewed config change preserves all existing lookups.
- Add explicit 1440×900 and 1024×768 viewports for the matrix. These are fixed test viewports, not new product breakpoints.
- Use full-page or workspace screenshots for composition and locator screenshots for the opened supporting panels. Scroll a panel into view before capture; a hidden or clipped element is not evidence.
- Each canonical state gets fresh setup and an observable readiness assertion before its screenshot.
- Keep traces and actual/expected/diff artifacts. Never generate or accept new baselines automatically in CI.

| Required state | Deterministic setup and capture | Observable contract |
| --- | --- | --- |
| Home, 1440×900 | Open `/` with fresh storage; capture current entry surface | Warm canvas, readable mixed typography, usable URL entry; do not claim #23's future Home exists. |
| Watch default, 1440×900 | Open fixture, no selection, utilities collapsed | Video/Korean transcript dominate; English is not persistently exposed. |
| Watch selected, 1440×900 | Select `fixture-2`, wait for explanation and paused player | Anchored inspector; Korean first; non-color selected cue distinct from playback. |
| Watch expanded, 1440×900 | Expand the implemented grammar/nuance controls after selection | Detail remains readable and contextual, with no clipped actions or permanent third panel. |
| Study selected, 1440×900 | Select the same sentence in Watch, then switch to Study | Same sentence/video context, persistent explanation, no duplicated player. |
| Study nearby navigation | Move to another sentence using the implemented control | Focused sentence and nearby context update without remounting the session. |
| Long transcript, 1440×900 | Scroll the existing long fixture to a distant sentence; diverge playback and selection | Scroll remains usable; inspection does not fight playback; selected/playing and combined states are distinguishable. |
| Compact workspace, 1024×768 | Open selected Watch and Study states | Functional fallback, no horizontal overflow, obscured controls, or clipped inspector. |
| Review | Open utilities; seed due items; capture before/after reveal, plus empty state | Existing Cloze Review remains usable and source context remains readable; no claim that #31 is done. |
| Progress | Open utilities; seed known/learning items and review history; capture populated and empty states | Consistent surfaces and hierarchy; truthful values. Do not invent comprehension comparisons. |
| Settings | Open utilities; capture ready/missing and saved synthetic-profile states | Quiet forms, readable notice, visible focus, actionable controls, and preserved save/reload/remove behavior. |
| Utilities and guidance | Capture opened disclosure with profile/history and seeded difficulty/revisit guidance | Consistent palette/radius/depth; working capabilities preserved; no dominant utility panel in initial Watch. |
| Loading and error | Defer then fail transcript/explanation requests; capture visible states and retry result | Stable layout, readable status/error text, non-color cues, and recovery without unnecessary session reset. |
| Learning feedback | Save a phrase, mark known as supported, inspect confirmation and Undo | Persimmon/jade roles, readable feedback, and operable contextual actions. |

For small/mobile widths, perform a functional overflow and primary-action reachability check without turning this into a mobile design project. Add a screenshot only if needed to guard a demonstrated regression.

**Exit:** every state above has executable coverage or a specific recorded non-applicability reason. “Where implemented” applies only to genuinely absent product capabilities; it does not excuse missing tests for existing panels. Screenshot changes are reviewed against DESIGN.md, not merely accepted as current output.

### Step 4 — Fix demonstrated inconsistencies and preserve behavior

Use the matrix to drive the smallest necessary corrections:

| Surface / concern | Primary files to inspect |
| --- | --- |
| Tokens, font loading, shell | `apps/web/tailwind.config.ts`, `apps/web/app/globals.css`, `apps/web/app/layout.tsx`, `apps/web/app/page.tsx` |
| Content entry and status | `apps/web/components/study-session-loader.tsx` |
| Watch / Study / inspector | `video-transcript-viewer.tsx`, `sentence-breakdown-popover.tsx`, `explanation-panel.tsx`, `study-session.tsx` in `apps/web/components/` |
| Review | `apps/web/components/cloze-review-panel.tsx`; inspect `review-queue-panel.tsx` only where used |
| Supporting panels | `progress-dashboard.tsx`, `learning-history-panel.tsx`, `learner-profile-panel.tsx`, `ai-provider-settings.tsx` in `apps/web/components/` |
| Guidance | `difficult-content-warning.tsx`, `video-difficulty-estimate.tsx`, `revisit-notice.tsx` in `apps/web/components/` |

Inspect hover, focus, disabled, selected, playing, loading, empty, warning, error, and success states. Recheck actual foreground/background combinations, not just token names. Prefer neutral text over inventing another semantic shade.

Preserve existing controls and data boundaries. Do not build new destinations to make screenshot setup easier. If an inherited product gap is outside #32, record it against its owning backlog item rather than silently implementing it or changing that item's completion state.

**Exit:** every production change has a specific visual/contrast defect, a focused regression check, and reviewed before/after evidence.

### Step 5 — Extend accessibility and interaction coverage

Extend `apps/web/e2e/a11y.spec.ts` and `watch-study.spec.ts`; extend existing adjacent component tests only for meaningful gaps.

- Scan Home, selected/expanded Watch, selected Study, and opened Review/Progress/Settings with axe. Scan visible state variants where their text/background changes.
- Verify keyboard selection, mode switching, progressive disclosure, learning actions/Undo, utility disclosure, and Settings controls. Verify Escape, sensible focus return, and no non-modal focus trap.
- Assert playback pause/seek and selection separately; check one player remains across modes. Preserve source context and selected sentence.
- Test a sentence whose selection differs from playback, plus the coincident state. Verify ARIA state and visible non-color cues.
- Keep explanation retry, review reveal/rating, and Settings save/reload/remove working through existing application boundaries.
- Do not weaken contrast rules, exclude whole panels, or blanket-update baselines to hide failures.

**Exit:** the visual changes preserve existing journeys; automated scans and explicit keyboard checks cover the changed states.

### Step 6 — Verify CI and prepare completion evidence

Reuse `.github/workflows/ci.yml`. The current `test:e2e` runs all files under `e2e`, including a11y and visual, and CI also invokes those scripts separately. Do not assume the gates are disjoint or redesign CI as part of this task. If command routing changes are necessary, prove that no test or required job is dropped.

Run section 6, inspect the final rendered states, and review every intentional pixel difference. Record results in a new `docs/QA-32.md` with the final SHA, scenario/viewport, test name, image path, result, and deviations. Store new before/after human-review evidence in a dated subdirectory of `qa/screenshots/32/`; preserve historical images.

Embed before/after images directly in the implementation PR for at least Watch default, selected/paused inspector, expanded detail, Study, long transcript, compact fallback, and utilities; include Review/Progress/Settings evidence too. Review these for hierarchy, type, semantic color use, spacing, and depth.

After a CI failure, read the failing log/artifacts, fix the root cause, push, and wait for green checks on the latest commit. Branch protection is a separate repository setting: do not claim it is enabled merely because the workflow runs. The inspected main branch was unprotected; ask the maintainer to require stable checks rather than silently changing repository policy.

**Exit:** all #32 criteria have current evidence and latest-commit CI passes. Only then may the implementation agent check the remaining visual criterion and the top-level #32 item. Do not merge without the user's explicit request.

## 4. Acceptance criteria to evidence mapping

Numbers below follow the thirteen criteria in BACKLOG.md; the backlog text remains authoritative.

| Criterion | Required completion evidence |
| --- | --- |
| 1. Semantic token coverage | Token audit against DESIGN.md and actual state usage; no second palette. |
| 2. Semantic utilities instead of legacy colors | Scoped audit with documented exceptions, plus rendered-state checks. |
| 3. Watch media / Korean dominance | Reviewed 1440px default and selected screenshots. |
| 4. Selection / playback distinction | Divergent and coincident-state browser assertions, keyboard/ARIA checks, screenshots. |
| 5. Accent roles | Reviewed selected, playing, learning, known, and feedback states. |
| 6. Shared supporting-surface rules | Opened Review/Progress/Settings/profile/history/guidance evidence. |
| 7. Restrained cards and shadows | Desktop/compact visual review; no heavy persistent panel shadows. |
| 8. Readable loading / empty / feedback states | Deterministic state captures, contrast scans, visible status/error cues. |
| 9. No behavioral regression | Existing unit/component suite plus Watch/Study, retry, learning, review, and settings browser checks. |
| 10. Deterministic visual coverage | Executable screenshot assertions and reviewed baselines for the section 3 matrix, passing in CI. This remains unchecked today. |
| 11. Accessibility | Axe results plus explicit focus, keyboard, and state-communication checks. |
| 12. Rendered desktop inspection | Dated QA-32 record comparing the actual final UI with DESIGN.md. |
| 13. Baseline verification | Passing lint/typecheck/test/build and latest-commit CI evidence. |

## 5. Suggested review sequence

Keep one owner and one implementation branch for #32. Use reviewable commits in this order:

1. Fixture/font determinism and baseline inventory.
2. Missing visual/a11y/behavior coverage with reviewed snapshots.
3. Only required UI corrections with paired before/after evidence.
4. QA record and final backlog update after verification.

Steps can iterate when a new test exposes a real defect. Do not mark #32 complete between commits. If work is interrupted, leave an exact failing-command/state handoff and keep the top-level item unchecked.

## 6. Verification commands

Use the repository's configured Node 22 and pnpm 11.19.0 environment. Install dependencies using the repository's current setup, then install Chromium:

```bash
pnpm --filter @korean-learning/web exec playwright install --with-deps chromium
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
```

For intentionally reviewed visual changes only:

```bash
pnpm --filter @korean-learning/web exec playwright test e2e/visual.spec.ts --update-snapshots
pnpm test:visual
```

Generate baselines in the same Linux/Chromium/font environment used by CI. Repeat visual verification from clean contexts to detect state leakage. Do not use retries, sleeps, larger pixel tolerances, or masked product content as substitutes for deterministic fixtures.

Run the repository's `.agents/skills/e2e-python-playwright` diagnostic when relevant for rendered UI inspection and obey its temporary-file cleanup rules. Follow [REAL-BROWSER-SMOKE.md](REAL-BROWSER-SMOKE.md) for separate real-YouTube verification; report omitted or blocked live smoke honestly rather than equating a fake player with real integration success.

## 7. Documentation and handoff rules

This planning PR changes only this plan and the #32 remaining-work/plan text in BACKLOG.md. It preserves every checkbox and all unrelated backlog content.

The implementation PR should update:

- `docs/QA-32.md`: new verification/evidence record.
- `docs/BACKLOG.md`: accurate remaining work; completion only after all gates pass.
- `docs/TESTING.md`: only if fixture conventions, commands, or baseline workflow materially change.
- `DESIGN.md`: only to document an approved visual-rule change, not to excuse a mismatch.
- Product/architecture docs only if an explicitly authorized change actually affects those contracts.

Use “Related to #65” in the planning PR; do not auto-close the issue for a plan. The eventual completion PR must include AGENTS.md's full report: backlog/status, checkbox changes, every verification layer, files changed, remaining work, and next item. After #32 is verified, the documented integration priority is **#30 Assistance levels**.
