---
timestamp: 2026-09-01T14:51:20Z
agent: pi-coding-agent
model: GPT-5
trigger: user-prompt
status: change-note
ticket: no-ticket
pr: 104
---

# Refresh PR 104 settings snapshots

Regenerated the two settings visual-regression baselines after PR #104 expanded the AI provider settings surface.

The browser regression job was failing because the committed snapshots still described the previous, shorter settings panel.

**Verified by:** targeted settings visual tests; full browser suite; lint. Typecheck and unit tests are blocked locally by unrelated untracked test files in the shared workspace.
