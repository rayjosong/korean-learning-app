# #33-A Provider-profile persistence

## Purpose

Replace the singleton OpenAI-compatible settings record with local, named provider profiles and independently persisted task routes.

## Parallel boundary

This package owns **only** `packages/storage/**` and its tests. It does not change `@korean-learning/ai`, `apps/web/**`, documentation, or the backlog. It can run in parallel with #33-B and #33-C.

## Public persistence contract

```ts
export type ProviderId = "openai" | "gemini" | "anthropic";
export type ExplanationTask = "sentence" | "word";

export interface ProviderProfile {
  provider: ProviderId;
  apiKey: string;
  defaultModel: string;
  baseUrl?: string; // OpenAI only; preserves existing compatible endpoints
  updatedAt: string;
}

export interface TaskRoute {
  provider: ProviderId;
  model: string;
}

export interface AiProviderSettingsRecord {
  id: "default";
  profiles: Partial<Record<ProviderId, ProviderProfile>>;
  routes: Partial<Record<ExplanationTask, TaskRoute>>;
  updatedAt: string;
}
```

## Files

| File | Work |
| --- | --- |
| `packages/storage/src/ai-settings.ts` | Replace the singleton record and helpers with profile/route helpers. Normalize keys, models, and base URLs. Reject blank fields. Refuse profile deletion while it is selected by a route. |
| `packages/storage/src/index.ts` | Add Dexie v12. Migrate v11 `openai-compatible` data to the `openai` profile and set both routes to its model. Preserve `baseUrl`. Keep the `aiProviderSettings: "id"` table schema. |
| `packages/storage/test/ai-settings.test.mjs` | Add profile CRUD, independent routes, delete guard, reload, normalization, and v11-to-v12 migration cases. |
| `packages/storage/test/export.test.mjs` | Prove provider profiles, routes, and keys never enter exports. |
| `packages/storage/test/import.test.mjs` | Prove imports cannot write provider credentials or routes. |

## Acceptance criteria

- [ ] OpenAI, Gemini, and Anthropic profiles can be saved independently.
- [ ] Sentence and word task routes persist independently.
- [ ] A v11 profile migrates without losing its key, model, or optional custom URL.
- [ ] API keys cannot appear in learner export/import data.
- [ ] Removing a provider used by a route fails with a controlled error.
- [ ] Existing tests still pass.

## Verification

```bash
pnpm --filter @korean-learning/storage test
pnpm typecheck
```

