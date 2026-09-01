# #33-D Settings, routing, and cache

## Purpose

Replace the singleton Settings form with named profiles and task routing, then resolve immutable provider/model routes for later explanation requests.

## Dependencies and parallel boundary

Depends on the public contracts in #33-A and #33-B. It can be developed in parallel against those contracts, but must rebase after they merge. It does not change Watch/Study explanation rendering; #33-E owns that work.

## Settings design

```text
AI providers
  OpenAI   [connected | connect]
  Gemini   [connected | connect]
  Claude   [connected | connect]

Explanation models
  Sentence explanation       [provider] [model]
  Word / phrase explanation  [provider] [model]
```

- Keys remain masked. The browser-local security notice remains visible.
- Only connected profiles are selectable for routes.
- Disconnect requires reassignment of each dependent route.
- OpenAI keeps the pre-existing custom endpoint under a collapsed Advanced control.

## Files

| File | Work |
| --- | --- |
| `apps/web/lib/ai-settings.ts` | Map storage records to UI-safe profiles, save edits, and resolve `sentence`/`word` routes with clear missing-config errors. |
| `apps/web/lib/ai.ts` | Replace direct OpenAI-compatible construction with the #33-C provider factory. |
| `apps/web/lib/explanation-cache.ts` | Include prompt version and resolved `provider:model` route in new cache keys; cache only final validated results and metadata, never keys. |
| `apps/web/components/ai-provider-settings.tsx` | Render three named profile rows, one profile editor, task routing controls, save/test state, and removal guard. |
| `apps/web/components/settings-dashboard.tsx` | Load/save the multi-profile record and route document. |
| `apps/web/components/ai-provider-settings.test.tsx` | Cover profile states, masked keys, labels, disabled routes, removal guard, and security copy. |
| relevant `apps/web/lib/*.test.*` | Test route resolution and route-aware cache behavior in the existing test style. |

## Acceptance criteria

- [ ] Three named profiles persist after reload.
- [ ] Sentence and word routes can select different connected providers/models.
- [ ] Changing a model cannot reuse a cache entry from another route.
- [ ] Profile controls are labelled, keyboard-operable, and never show raw keys.
- [ ] Existing custom OpenAI-compatible endpoint survives migration and remains editable only in Advanced settings.

## Verification

```bash
pnpm test
pnpm typecheck
```

