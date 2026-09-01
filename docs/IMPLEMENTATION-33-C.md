# #33-C Gemini and Claude adapters

## Purpose

Implement native Gemini and Claude browser adapters against the shared #33-B `LanguageModel` stream contract.

## Parallel boundary

This package owns only new Gemini/Claude adapter and test files. It does not change storage, Settings, cache, session, or UI code. Begin from the #33-B contract above; rebase after #33-B merges and add barrel exports in the smallest follow-up commit if needed.

## Files

| File | Work |
| --- | --- |
| `packages/ai/src/gemini.ts` (new) | Use native Gemini HTTP and streaming endpoints through `fetch`. Convert provider chunks to `ExplanationStreamEvent`; normalize auth, network, malformed-output, and abort errors. |
| `packages/ai/src/anthropic.ts` (new) | Use native Claude Messages streaming through `fetch`; keep Anthropic headers and event parsing inside the adapter. Normalize the same error classes. |
| `packages/ai/src/provider-factory.ts` (new) | Construct OpenAI, Gemini, or Anthropic adapter from the resolved profile/route. This is the only provider selection switch. |
| `packages/ai/src/index.ts` | Export the new adapter/factory types after rebasing on #33-B. |
| `packages/ai/test/gemini.test.mjs` (new) | Stubbed request, event conversion, error, and cancellation tests. |
| `packages/ai/test/anthropic.test.mjs` (new) | Equivalent Claude tests. |
| `packages/ai/test/provider-factory.test.mjs` (new) | Verify provider construction and controlled failures for invalid/incomplete routes. |

## Constraints

- Use `fetch`, `ReadableStream`, and existing dependencies; do not add SDK packages.
- Tests use fixtures only. Do not call live providers in CI.
- Keep provider request headers, endpoints, and response parsing out of `apps/web`.
- Do not add model discovery, costs, tools, or a provider catalogue.

## Acceptance criteria

- [ ] Gemini and Claude both implement sentence and word streaming methods.
- [ ] Both produce the same normalized events as OpenAI.
- [ ] Both validate their assembled final output before `complete`.
- [ ] Both abort cleanly and do not expose secrets in errors.

## Verification

```bash
pnpm --filter @korean-learning/ai test
pnpm typecheck
```

