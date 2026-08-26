# #58 desktop Watch/Study QA

Captured with the deterministic browser flow using a mocked transcript and AI provider at a 1440px desktop viewport.

- watch-default.png — Watch is the initial mode with Korean transcript visible.
- watch-inspector.png — selecting a sentence pauses inspection and shows natural meaning plus phrase chunks.
- study.png — the selected sentence and saved phrase remain available in Study.
- watch-closed.png — returning to Watch and dismissing inspection leaves the transcript context usable.

The YouTube iframe is intentionally blocked in this deterministic check; the player surface remains visible and its failure state is local/actionable. A live YouTube smoke check was not run because external network access is unavailable in this environment.
