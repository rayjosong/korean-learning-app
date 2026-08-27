# Real YouTube smoke strategy

The required CI browser suite uses the `watch-study` fixture and a deterministic player fake. A narrow live smoke should be run manually or on a scheduled deployment check because YouTube iframe availability and captions are external dependencies.

1. Start the app with `pnpm dev`.
2. Open the deployed/local app and paste a known Korean-captioned YouTube URL.
3. Confirm the player loads and the transcript-backed session appears.
4. Select one timestamped sentence and confirm the iframe seeks and pauses.
5. Record the video URL, date, browser, and result in the PR or issue.

Live YouTube is intentionally not part of required pull-request CI.
