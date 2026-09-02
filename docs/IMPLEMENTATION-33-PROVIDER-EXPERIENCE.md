# Backlog #33 — Coherent AI provider experience implementation plan

## Assignment and status

- Backlog item: [#33 Local CLI AI providers](BACKLOG.md#33-local-cli-ai-providers).
- Product surfaces: **Settings**, with a compact active-model control in **Watch** and **Study**.
- Starting branch: `agent/33-local-cli-provider-catalog` at `066d08076c4a0ee20d5b452c03d8d725db0b69b0`.
- Status: planning complete; #33 remains unchecked.
- Related decision: [Unified AI provider selection and runtime](agdr/20260902-045224-unified-ai-provider-runtime.md).
- Separate follow-up: #28 owns deployment-managed OpenAI credentials and environment defaults.

This plan keeps the working provider adapters and replaces the fragmented configuration and selection flow. It does not add more vendors, task-specific model routing, cost dashboards, accounts, or a general AI chat surface.

Before implementation, re-read `AGENTS.md`, `docs/PRODUCT.md`, `DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md`, and `docs/BACKLOG.md` in order. Recheck the branch and preserve unrelated work, including the current untracked files.

## 1. Problem and target outcome

Today the user must understand three separate controls:

```text
OpenAI credential form
+ CLI provider rows
+ Explanation model dropdown
```

Those controls can disagree. Saving OpenAI does not select it or refresh the picker. A selected provider can be disabled. CLI models save on blur. Readiness does not prove authentication. The full form is also duplicated in the Watch/Study utility panel.

The target experience is:

```text
Connect or detect a provider
        ↓
See whether it can run
        ↓
Choose provider + model as one qualified choice
        ↓
Use that choice immediately in Watch and Study
        ↓
Recover in place if it becomes unavailable
```

One invariant controls the flow:

> The active model is one qualified `provider:model` reference whose provider is configured, enabled, and runnable for the selected transport.

## 2. Constraint map

### Facts

- AI configuration belongs in Settings; AI must not become the product's visual identity.
- OpenAI BYOK is stored in IndexedDB and must never enter exports, explanation records, or logs.
- Claude and Codex execute on the server with bounded local processes.
- Antigravity remains visible only as detected/experimental and cannot be selected.
- The app has no account system. Public deployment access control is outside #33.
- Settings, Watch, and Study already use the Warm Korean Editorial visual system.

### Decisions

- Keep the existing `aiProviderSettings` and `aiModelSelection` tables. Do not add a Dexie version unless implementation changes their stored shape.
- Keep `openai-compatible` as the internal provider key for migration stability. Display it as **OpenAI** when the default endpoint is used and **OpenAI-compatible** when a custom base URL is saved.
- Use one shared active-model picker everywhere. It displays human provider and model names; internal references are never primary copy.
- Settings owns connection management. Watch and Study may switch among ready models but do not expose API-key, base-URL, or CLI setup forms.
- Route all uncached explanations through one same-origin client adapter. Browser-local OpenAI credentials are sent transiently and never persisted server-side.
- Do not add per-task sentence/word routes. Both explanation types use the same active model in #33.

### Must remain unchanged

- Watch remains video + Korean transcript first.
- Selecting a sentence still pauses playback and opens the contextual explanation.
- Watch/Study switching preserves media and explanation state.
- Cached explanations remain provider/model aware.
- Assistance settings remain separate from provider settings.

## 3. Interface specification

### Settings hierarchy

Render one `AI model` section in this order:

1. **Active model** — one shared picker showing `gpt-5 mini · OpenAI`, `Sonnet · Claude Code`, or the equivalent current choice.
2. **Providers** — quiet rows for OpenAI, Claude Code, Codex, and disabled Antigravity detection.
3. **Local-storage notice** — one concise credential notice, not repeated per provider.

Provider rows show only facts needed to decide or act:

```text
OpenAI                      Ready
gpt-5-mini                  Edit

Claude Code                 Not installed
claude                      Installation help

Codex                       Ready
gpt-5.6-codex               Use
```

Use human status labels:

- `Ready`
- `Needs setup`
- `Not installed`
- `Sign-in required`
- `Can't connect`
- `Disabled`
- `Experimental — unavailable`

Do not show `openai-compatible`, `claude_cli`, `codex_cli`, filesystem paths, or qualified references as the main row label. A CLI path may appear under a `Details` disclosure.

### Provider editing

OpenAI editor fields:

- API key;
- model;
- Advanced disclosure containing optional base URL;
- `Test connection`;
- primary action `Save and use` when inactive, or `Save changes` when active;
- `Remove` with confirmation when credentials exist.

CLI editor fields:

- detected binary and version under Details;
- explicit model field or supported alias choice;
- `Test connection`;
- primary action `Use Claude Code` / `Use Codex`;
- enable/disable only when the provider is not active.

Never save on blur. Every async action exposes pending, success, and failure state next to the action that caused it.

### Shared active-model picker

The trigger always displays model and provider. The opened list:

- groups options by provider;
- includes only configured, enabled, runnable providers;
- puts the current selection first or marks it clearly;
- supports typing to filter when the list is long;
- emits a qualified reference;
- supports Arrow keys, Enter, Escape, focus return, and screen-reader names;
- uses an anchored popover on desktop and a full-width dialog/sheet only if compact layout needs it.

No “Choose a ready provider” pseudo-selection. If no provider is ready, show `Connect an AI provider` and link to Settings.

### Watch and Study

Remove the duplicated `AiProviderSettings` form from `StudySession`. In the collapsed workspace utilities area, show only:

```text
Explanation model    gpt-5 mini · OpenAI  [Change]
```

Changing it updates the active model immediately and leaves the selected sentence, playback position, and current cached explanation intact. The next uncached explanation uses the new model. Do not silently regenerate the open explanation.

## 4. Ordered implementation work

### Step 1 — Lock provider and selection invariants

Primary files:

- `packages/ai/src/provider-catalog.ts`
- `packages/storage/src/ai-settings.ts`
- `apps/web/lib/ai-settings.ts`
- their existing tests

Work:

1. Add presentation metadata to the provider catalog: human label, transport, selectability, and setup kind. Keep secrets out of the catalog.
2. Add pure helpers that resolve an active reference against provider settings and server status.
3. Replace independent mutations with application operations:
   - `saveProvider`;
   - `saveAndSelectProvider`;
   - `selectActiveModel`;
   - `disableProvider`;
   - `removeProvider`.
4. Enforce these rules at the operation boundary:
   - selection must be qualified;
   - Antigravity cannot be selected;
   - an unconfigured, disabled, or unready provider cannot become active;
   - the active provider cannot be disabled or removed without first selecting a replacement;
   - saving OpenAI refreshes the provider collection in the same operation;
   - if no active selection exists, `Save and use` establishes one.
5. Keep the existing version-13 migration. Add a new Dexie version only if the final record shape changes.

Exit: storage and application tests prove that provider records and active selection cannot drift.

### Step 2 — Build one provider settings controller

Primary files:

- `apps/web/components/settings-dashboard.tsx`
- new `apps/web/lib/use-ai-provider-settings.ts` or an equivalently small application hook
- `apps/web/lib/provider-status.ts`

Work:

1. Load provider records, active selection, and server status through one controller.
2. Expose explicit states: `loading`, `ready`, `saving`, `testing`, and `error`.
3. Refresh the provider list, active selection, and status after each mutation.
4. Do not swallow provider-status or IndexedDB failures. Preserve the rest of Settings and show retry beside the failed provider section.
5. Close every database instance in `finally` and prevent state updates after unmount.

Exit: `/settings` has one authoritative source of provider state, and every failed load or mutation has a local recovery action.

### Step 3 — Replace the fragmented Settings UI

Primary files:

- `apps/web/components/ai-provider-settings.tsx`
- `apps/web/components/ai-provider-row.tsx`
- `apps/web/components/model-picker.tsx`
- focused component tests

Work:

1. Refactor `AiProviderSettings` into the hierarchy in section 3.
2. Replace blur-save CLI inputs with explicit actions.
3. Add the shared provider-qualified picker and human labels.
4. Add the OpenAI advanced base-URL disclosure and connection-test states.
5. Keep ordinary grouping to whitespace and hairlines. Do not turn each fact into a nested card.
6. Verify status and selection without color alone.

Exit: a user can connect OpenAI, see that it works, make it active, switch to a CLI, and switch back without knowing internal provider keys.

### Step 4 — Remove duplicated workspace configuration

Primary files:

- `apps/web/components/study-session.tsx`
- a small shared active-model control if the Settings picker cannot be reused directly

Work:

1. Delete the full provider form from Watch/Study utilities.
2. Reuse the active-model picker with ready providers only.
3. Keep a `Manage providers` link to `/settings` for connection changes.
4. Update active provider state without remounting `StudySession` or clearing the selected sentence.
5. Make new requests use the latest selection while preserving already loaded/cached explanations.

Exit: Settings owns setup; Watch and Study offer a compact switch without workspace clutter.

### Step 5 — Unify the explanation runtime

Primary files:

- `apps/web/lib/ai.ts`
- `apps/web/lib/server-cli-language-model.ts` (rename to provider-neutral client)
- `apps/web/lib/server-ai-routes.ts`
- `apps/web/app/api/ai/explain-sentence/route.ts`
- `apps/web/app/api/ai/explain-word/route.ts`
- `packages/ai/src/server/provider-factory.ts`
- `packages/ai/src/openai-compatible.ts`

Work:

1. Replace the CLI-specific browser adapter with one same-origin `ServerLanguageModelClient`.
2. Send the qualified model reference and explanation input for every provider.
3. For browser-local OpenAI BYOK, include the API key and optional base URL only in the request body. Never store them on the server or return them.
4. Extend the server factory to construct the OpenAI-compatible adapter from transient credentials, or from a future server credential resolver when #28 lands.
5. Validate body size, reference syntax, provider transport, required credentials, and output at the boundary.
6. Add timeout and cancellation to OpenAI requests. Preserve CLI concurrency, output, process, and cleanup bounds.
7. Normalize authentication, timeout, unavailable-provider, invalid-output, and request failures into stable user messages. Keep raw provider output and stderr server-side and secret-free.
8. Add a safe-by-default deployment gate: local CLI execution must be explicitly enabled when the server is not intended for a trusted local user. Document that #33 does not add public-user authentication.

Exit: OpenAI, Claude Code, and Codex use one client contract and one controlled server boundary; OpenAI no longer depends on browser CORS.

### Step 6 — Add provider validation and model availability

Primary files:

- `apps/web/app/api/model-config/providers/route.ts`
- a focused validation route or provider-status service
- provider adapters and tests

Work:

1. Add an explicit validation operation per selectable provider.
2. OpenAI validation performs a bounded request against the saved endpoint without exposing the key. Prefer a cheap model-list/auth check; fall back to a minimal structured request only when the endpoint cannot validate otherwise.
3. CLI validation distinguishes executable detection from authenticated execution.
4. Return stable public status data only: status, version where useful, model suggestions, and a safe error code/message.
5. Do not claim that `--version` proves authentication.
6. Cache slow status probes briefly and expose manual retry. Do not block Settings indefinitely.

Exit: `Ready` means an operation has enough evidence to run, and every other state tells the user what to do next.

### Step 7 — Regression coverage and rendered QA

Add coverage at the lowest reliable layer:

| Risk | Required proof |
| --- | --- |
| Provider/selection drift | storage/application unit tests |
| Saving OpenAI does not refresh or activate | controller/component integration test |
| Active provider disabled or removed | unit test plus Settings component test |
| OpenAI credential leaks | route tests for response, logging seam, cache, and export |
| Invalid or unavailable model selected | factory/route tests |
| Provider switching resets Watch/Study | component integration and Playwright |
| Settings states are confusing or inaccessible | Playwright keyboard, axe, and visual checks |
| Real OpenAI-compatible behavior | separate opt-in smoke using a mock-compatible server in deterministic CI; live credential smoke remains manual |

Required deterministic browser journey:

```text
open Settings with no provider
-> configure synthetic OpenAI
-> test succeeds
-> Save and use
-> active trigger shows model + OpenAI
-> open Watch fixture and request an explanation
-> switch to ready Codex fixture
-> next uncached explanation uses Codex
-> switch back to OpenAI
-> attempt to disable active OpenAI is refused with recovery guidance
-> select Codex
-> remove OpenAI
-> reload and confirm Codex remains active
```

Add failure journeys for rejected OpenAI key, unreachable custom endpoint, unauthenticated CLI, provider-status failure, and retry without losing the current Watch/Study session.

Visual states at 1440×900:

- Settings with no provider;
- OpenAI ready and active;
- CLI ready but inactive;
- connection failure with retry;
- active-model picker open;
- compact Watch utility control.

## 5. Suggested implementation sequence

Keep one #33 owner and use reviewable commits in this order:

1. Provider/selection invariants and tests.
2. Provider settings controller and failure states.
3. Unified Settings UI and shared picker.
4. Compact Watch/Study switcher and duplicate-form removal.
5. Provider-neutral server runtime and OpenAI proxy path.
6. Validation/status endpoints.
7. Browser, visual, accessibility, documentation, and backlog evidence.

Do not mark #33 complete between commits. If the production runtime work is intentionally deferred, keep #33 partial and record the remaining split-runtime gap.

## 6. Acceptance criteria for #33 completion

Before implementation begins, add these criteria to `docs/BACKLOG.md` under #33:

- [ ] OpenAI, Claude Code, and Codex appear through one provider catalog with human labels and stable status states.
- [ ] One qualified active model drives sentence and word explanations.
- [ ] Saving and using OpenAI updates the active selection without reload.
- [ ] A ready CLI can be selected and switched away from without losing Watch/Study context.
- [ ] Active providers cannot be silently disabled or removed.
- [ ] Settings is the only credential/setup surface; Watch/Study expose only the compact active-model control.
- [ ] OpenAI uses the provider-neutral same-origin request path and no longer requires provider CORS.
- [ ] Browser-local API keys are never exported, cached with explanations, logged, returned, or persisted server-side.
- [ ] Provider validation distinguishes ready, setup, authentication, unavailable, disabled, and experimental states.
- [ ] CLI execution is safe by default for deployments without a trusted local-user boundary.
- [ ] Unit, component, deterministic browser, accessibility, and visual tests cover the provider lifecycle and switching journey.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.

Do not add or check these criteria as part of this planning-only change. The implementation owner must reconcile them with the current branch before coding.

## 7. #28 production follow-up

After #33 is complete, implement #28 without changing the picker contract:

```text
browser-local BYOK, when present
        ↓ overrides
deployment-managed OpenAI profile
        ↓ otherwise
controlled setup error
```

#28 must define environment variables, server-only secret loading, deployment access control, override behavior, and documentation. The public provider-status response may report that a deployment default exists but must never expose its credential. Do not store deployment secrets in IndexedDB or learner exports.

## 8. Verification commands

Run from the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
```

For interaction-heavy UI work, also run the repository's `.agents/skills/e2e-python-playwright` diagnostic against the real rendered Settings and Watch/Study flows. Use fake executables and a local mock OpenAI-compatible server for deterministic provider tests. Never make CI depend on a real provider account.

## 9. Documentation and completion

The implementation change should update:

- `docs/ARCHITECTURE.md` for the unified provider request and credential-resolution boundary;
- `docs/TESTING.md` if provider fixture or smoke-test policy changes;
- `DESIGN.md` only if the final Settings hierarchy establishes a new canonical interaction rule;
- a new `docs/QA-33.md` with acceptance mapping, commands, browser results, and screenshots;
- `docs/BACKLOG.md` only after every criterion is verified.

The implementation PR must embed Settings and Watch/Study screenshots, explain the transient credential boundary, state the trusted-local-user limit for CLI providers, and list any omitted live-provider verification.
