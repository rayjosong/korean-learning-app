---
timestamp: 2026-08-25T16:51:30Z
agent: pi-coding-agent
model: glm-5.1
session: 01a039cb-058b-7f27-badb-e0a3b04b4d54
trigger: user-prompt
status: change-note
ticket: no-ticket
---

# Implement "I know this" learner action (backlog #11)

Implements backlog #11 by executing the recorded decision in `20260825-163730-word-phrase-learner-item-flow.md`: inline action in the word card, clicked surface form as learner-item identity, dictionary form as metadata, repeated encounters reusing one item with accumulating source contexts, persistent confirmation with `Undo`.

The state transition is a pure function in `@korean-learning/learning-engine`, persistence is Dexie tables in `@korean-learning/storage`, and the web layer only orchestrates — no new architectural decision beyond the record above. Also completes the untracked, non-compiling #10 work-in-progress found in the tree (word explanation cache, prompt, clickable breakdown) whose regression is documented in the PR.

Housekeeping in the same PR: committed `pnpm-lock.yaml` (manifest changes required it; CI already installs with `--no-frozen-lockfile`) and ignored the local `.pnpm-store/`.

**Verified by:** `pnpm -r test` (72 tests), `pnpm -r typecheck`, `pnpm -r lint`, `pnpm build`
