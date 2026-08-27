# Backlog #29 rendered QA

Date: 2026-08-27
Source: merged #58 / PR #68 deterministic browser run
Viewport: 1280px desktop fixture session

## Verified

| State | Result |
| --- | --- |
| Watch default | Pass: video and Korean transcript are the dominant workspace |
| Watch selected sentence | Pass: selection is visible, playback is paused by the fixture controller, and contextual explanation is anchored in transcript flow |
| Study selected sentence | Pass: selected Korean sentence, persistent explanation, and nearby transcript context remain visible |
| Watch → Study → Watch | Pass: Playwright golden path passes and the player container remains singular |
| Accessibility | Pass: axe checks and Escape/focus keyboard checks pass |
| Long transcript fixture | Pass: 24 timestamped segments remain navigable without replacing the workspace |

## Evidence

- qa/29d/watch-default.png
- qa/29d/watch-selected.png
- qa/29d/study-selected.png

The fixture intentionally avoids live YouTube and live AI provider dependencies. The separate smoke strategy is documented in docs/REAL-BROWSER-SMOKE.md.

## Remaining before marking #29 complete

- Convert the reviewed states into checked-in Playwright pixel baselines for the intended canonical viewport matrix.
- Run and record the documented real-YouTube smoke check.
- Reconcile the remaining unchecked #29 acceptance criteria against the real deployed/local app, not only the fixture.

Therefore docs/BACKLOG.md remains unchecked.
