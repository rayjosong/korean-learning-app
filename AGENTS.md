# AGENTS.md

## Purpose

This repository is designed to be built by multiple coding agents without losing product intent, architectural consistency, or backlog accuracy.

`docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and `docs/BACKLOG.md` are authoritative project documents.

## Required reading

Before making changes, every coding agent MUST read, in order:

1. `AGENTS.md`
2. `docs/PRODUCT.md`
3. `docs/ARCHITECTURE.md`
4. `docs/BACKLOG.md`

Do not begin implementation before doing this.

## Source of truth

- `docs/PRODUCT.md` defines what the product should become and what is in/out of scope.
- `docs/ARCHITECTURE.md` defines architectural boundaries and engineering rules.
- `docs/BACKLOG.md` defines implementation order, dependencies, acceptance criteria, and completion state.

If implementation ideas conflict with these documents, follow the documents unless the user's current instruction explicitly overrides them.

## Multi-agent coordination rules

Multiple agents may work in parallel. Avoid duplicate work and unsafe backlog edits.

### Task ownership

1. Work only on the backlog item explicitly assigned to you.
2. If no item is assigned, choose only an unclaimed, unblocked item from the earliest incomplete milestone.
3. Do not start an item whose dependencies are incomplete.
4. Do not opportunistically implement unrelated later backlog items.
5. One agent should own one backlog item at a time.

### Branches

Use one branch per backlog item:

`agent/<backlog-id>-<short-description>`

Examples:

- `agent/3-youtube-url-parser`
- `agent/7-sentence-explanation`

Do not have two agents intentionally work on the same backlog item unless the user explicitly asks for collaboration.

### Backlog writes

`docs/BACKLOG.md` is the canonical progress record.

An agent may mark a backlog item complete only when that same agent has verified every acceptance criterion.

Never mark an item complete merely because code was written.

Never mark unrelated items complete.

If you discover that an already-completed item is broken:
- do not silently uncheck it;
- document the regression in your task/PR;
- fix it if it is required for your assigned work.

### Completion protocol

Before changing an item from `[ ]` to `[x]`:

1. Re-read the item's acceptance criteria.
2. Verify each criterion against the implementation.
3. Run all relevant tests.
4. Run typecheck.
5. Run lint.
6. Run the relevant build when practical.
7. Confirm no required criterion is only partially implemented.

Only then update the backlog checkbox.

If any criterion fails:
- leave the item unchecked;
- state what remains incomplete;
- do not claim completion.

### Partial work

If blocked or partially complete:
- keep the top-level backlog item unchecked;
- check only acceptance criteria that are genuinely satisfied;
- add a short `Blocked:` or `Remaining:` note under the item when useful.

## Required end-of-task report

Every coding agent should finish with:

```text
Backlog item
#<id> <title>

Status
complete | partial | blocked

Backlog changes
- [ ] -> [x] <only when fully verified>

Verification
- tests: pass/fail/not run
- typecheck: pass/fail/not run
- lint: pass/fail/not run
- build: pass/fail/not run

Files changed
- ...

Remaining
- ...

Recommended next item
#<id> <title>
```

## Architecture constraints

UI components must not directly:
- call model-provider SDKs;
- implement learner-state transitions;
- implement SRS scheduling;
- parse provider-specific transcripts;
- write arbitrary persistence logic.

Prefer:

```text
UI
 -> application/use case
 -> domain interface
 -> adapter
```

AI providers, transcript sources, and persistence must remain replaceable behind interfaces.

## Scope discipline

For V0.1, prioritize the vertical slice:

```text
Paste YouTube URL
-> transcript
-> synced transcript viewer
-> click Korean sentence
-> structured contextual explanation
-> local cache
```

Do not add native mobile, accounts, cloud sync, social features, achievements, pronunciation coaching, TOPIK features, or multi-language support unless explicitly requested.

## Code quality

- Keep TypeScript strict.
- Prefer small, testable domain modules.
- Validate external/AI data at boundaries.
- Add tests for new domain behavior.
- Avoid speculative abstractions that are not needed by the current backlog item.
- Keep provider-specific code out of domain packages.
- Never commit secrets or API keys.

## Documentation updates

Update documentation in the same change when implementation materially changes:
- public behavior;
- architecture;
- domain interfaces;
- backlog completion state.

Do not rewrite product direction without explicit instruction.

## Conflict handling

When two agents' changes conflict:
1. preserve the behavior required by `PRODUCT.md`;
2. preserve the boundaries in `ARCHITECTURE.md`;
3. preserve completed acceptance criteria from both tasks;
4. do not mark either task complete until the merged result is re-verified.

The merged branch, not an isolated agent branch, is the final truth.
