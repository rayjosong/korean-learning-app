# Backlog #29 rendered QA

Date: 2026-08-27
Source: merged #58 / PR #68 deterministic browser run, with checked-in baseline closure in PR #70
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

PR #70 turns the reviewed Watch default, Watch selected-sentence, and Study selected-sentence states into strict Playwright pixel baselines. The fixture intentionally avoids live YouTube and live AI provider dependencies. The separate real-browser smoke strategy, including the required YouTube checks, is documented in docs/REAL-BROWSER-SMOKE.md.

The deterministic fixture gate and documented external smoke strategy satisfy the #29 QA closure criteria. A live YouTube result is intentionally not represented as a CI result because it would make the regression gate dependent on external content and provider availability.
