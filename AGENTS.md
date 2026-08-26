# AGENTS.md

## Purpose

This repository is designed to be built by multiple coding agents without losing product intent, visual/UX consistency, architectural consistency, or backlog accuracy.

`docs/PRODUCT.md`, `DESIGN.md`, `docs/ARCHITECTURE.md`, and `docs/BACKLOG.md` are authoritative project documents.

## Required reading

Before making changes, every coding agent MUST read, in order:

1. `AGENTS.md`
2. `docs/PRODUCT.md`
3. `DESIGN.md`
4. `docs/ARCHITECTURE.md`
5. `docs/BACKLOG.md`

Do not begin implementation before doing this.

For user-facing work, explicitly identify which product surface/mode the change belongs to before implementation: Home, Watch, Study, Review, Progress, or Settings.

## Source of truth

- `docs/PRODUCT.md` defines what the product should become and what is in/out of scope.
- `DESIGN.md` defines the canonical visual language, UX hierarchy, desktop reference layouts, responsive direction, and user-facing interaction rules.
- `docs/ARCHITECTURE.md` defines architectural boundaries and engineering rules.
- `docs/BACKLOG.md` defines implementation order, dependencies, acceptance criteria, and completion state.

If implementation ideas conflict with these documents, follow the documents unless the user's current instruction explicitly overrides them.

When documents appear inconsistent, do not silently choose whichever is easiest. Preserve product intent first, note the inconsistency in the PR, and update the relevant authoritative document when the user's instruction resolves it.

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

For documentation/design-system changes that are not tied to one numbered backlog item, use a descriptive `agent/docs-...` branch.

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

If product/design direction changes after an older backlog item was completed, do not rewrite history by unchecking the old item. Add a new refinement item describing the delta from the currently shipped behavior.

### Completion protocol

Before changing an item from `[ ]` to `[x]`:

1. Re-read the item's acceptance criteria.
2. Re-read relevant product and design requirements.
3. Verify each criterion against the implementation.
4. Run all relevant tests.
5. Run typecheck.
6. Run lint.
7. Run the relevant build when practical.
8. Confirm no required criterion is only partially implemented.
9. For user-visible work, inspect the actual rendered flow and verify it against `DESIGN.md`.

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
- UX/rendered flow: pass/fail/not applicable

Files changed
- ...

Remaining
- ...

Recommended next item
#<id> <title>
```

## Product UX constraints

The canonical V0.1 experience is desktop-web-first and follows:

```text
WATCH -> STUDY -> REVIEW
```

For user-facing changes:

- Korean content is visually primary; English is assistance.
- Watch defaults to video + Korean transcript.
- Selecting a transcript sentence pauses playback and opens contextual explanation.
- Watch explanations should be contextual overlays/popovers rather than a permanently visible third information panel.
- Study mode may devote persistent space to deeper explanation.
- Prefer meaningful phrase chunks over immediately splitting every sentence into isolated words/morphemes.
- Grammar, nuance, morphology, and examples should use progressive disclosure.
- Review should preserve original video/source context where practical.
- Assistance is learner-driven; do not proactively interrupt playback because something appears difficult.
- Avoid gamification-first patterns, generic SaaS dashboards, excessive cards, and provider-branded AI surfaces.
- Mobile web must remain usable, but do not weaken the canonical desktop workspace solely for mobile parity.

`DESIGN.md` contains the full interaction and visual rules. Do not infer a replacement design language from shadcn, Tailwind, or another component library.

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
-> synced Watch workspace
-> click Korean sentence
-> pause playback
-> contextual structured explanation
-> local cache
-> phrase learning
-> contextual review
```

Do not add native mobile, accounts, cloud sync, social features, achievements, pronunciation coaching, TOPIK features, or multi-language support unless explicitly requested.

Do not broaden a feature into a full mobile redesign while mobile-specific UX remains KIV.

## Code quality

- Keep TypeScript strict.
- Prefer small, testable domain modules.
- Validate external/AI data at boundaries.
- Add tests for new domain behavior.
- Avoid speculative abstractions that are not needed by the current backlog item.
- Keep provider-specific code out of domain packages.
- Never commit secrets or API keys.
- Prefer domain-specific UI components for canonical interactions rather than repeated one-off compositions of generic primitives.

## Documentation updates

Update documentation in the same change when implementation materially changes:
- public behavior;
- UX behavior or canonical screen hierarchy;
- visual/design-system rules;
- architecture;
- domain interfaces;
- backlog completion state.

Use the appropriate source of truth:
- product behavior/intent -> `docs/PRODUCT.md`;
- visual/interaction design -> `DESIGN.md`;
- implementation boundaries -> `docs/ARCHITECTURE.md`;
- execution status/remaining work -> `docs/BACKLOG.md`.

Do not rewrite product direction without explicit instruction.

## Conflict handling

When two agents' changes conflict:
1. preserve the behavior required by `PRODUCT.md`;
2. preserve the UX/design rules in `DESIGN.md`;
3. preserve the boundaries in `ARCHITECTURE.md`;
4. preserve completed acceptance criteria from both tasks where they remain compatible with current product direction;
5. do not mark either task complete until the merged result is re-verified.

The merged branch, not an isolated agent branch, is the final truth.

## Repository operating rules

### Exact verification commands

Run these from the repository root before claiming an item complete:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If a command cannot be run, state why in the PR and do not claim it passed.

After every CI failure:
1. read the failing job log;
2. fix the root cause, not only the symptom;
3. push the fix;
4. wait for a green CI run on the latest commit before marking the backlog complete.

### TypeScript and test-runtime compatibility

- Keep production source in `.ts` or `.tsx`; keep Node test files valid JavaScript when they are `.mjs`.
- Before adding a module or barrel export, verify its import path works in both `tsc --noEmit` and the repository's Node test runtime.
- Do not use TypeScript-only syntax in `.mjs` files.
- Do not alter TypeScript module resolution, `tsconfig`, or test-runner configuration merely to accommodate one feature unless the change is separately justified and tested.

### Domain, persistence, and boundary rules

- Put learner-state transitions, review scheduling, and other learning rules in `packages/learning-engine`; keep them pure and unit-tested.
- UI coordinates use cases and rendering only. It must not calculate review schedules, mutate learner state, or access Dexie tables directly.
- Validate all external or provider data at the adapter boundary before it enters domain code.
- Put IndexedDB/Dexie schema changes and persistence helpers in `packages/storage`. A schema change must include an upgrade/migration test using a prior database version.
- New public domain fields or interfaces require a test for their intended transition or invariant.

### Regression and browser checks

- Add a regression test in the package that owns every bug fix.
- Test observable behavior rather than implementation details.
- For user-visible flows, run the `.agents/skills/e2e-python-playwright` diagnostic when relevant and follow its cleanup rules.
- Compare user-visible results against relevant `DESIGN.md` ASCII references and interaction rules; intentional deviations must be justified in the PR.
- Do not weaken or delete a failing test without explicit PR justification.

### PR readiness

Every PR body must include:
- the backlog item and acceptance-criteria mapping;
- verification commands and results;
- omitted verification and why;
- migrations, user-visible behavior, or compatibility risks;
- UX/design impact for user-facing changes;
- remaining work, if any.

Do not merge your own PR unless the user explicitly asks.
