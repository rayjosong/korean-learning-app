---
timestamp: 2026-08-25T14:53:15Z
agent: pi-coding-agent
model: glm-5.1
session: 01a03964-ee3c-738e-9d66-58adbf308511
trigger: user-prompt
status: executed
ticket: "#7"
---

# Zod-validated structured sentence explanations

> In the context of implementing backlog #7 on top of the existing OpenAI-compatible provider from #6, facing a hand-rolled output validator and a generic tutor prompt that did not encode the product's real-Korean rules, I decided to extract a dedicated `sentence-explanation.ts` module holding a Zod schema plus a product-encoded system prompt and validate all sentence explanations through `safeParse` at the provider boundary, to achieve reliable, testable structured output for contractions, slang/fillers, casual speech, and honorifics, accepting one new direct dependency (`zod`) and a second place (besides the word parser) where output shape lives.

## Context

- Issue #7 requires natural meaning, breakdown, grammar, nuance-when-relevant, speech level handling, conciseness by default, Zod validation, and tests for invalid structured output.
- `ARCHITECTURE.md` prescribes "structured output + Zod validation" and provider-specific code must stay behind the `LanguageModel` interface; the provider from #6 validated with hand-rolled type guards and a one-line generic prompt.
- Zod 4.4.3 was already in the pnpm lockfile (transitive), so adding it as a direct dependency of `packages/ai` carried no new lockfile weight.
- `response_format: { type: "json_object" }` is kept rather than `json_schema` because OpenAI-compatible third-party endpoints vary in schema-mode support; the JSON object mode is the compatible lowest common denominator.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Extend the existing hand-rolled guards in `openai-compatible.ts` | No new dependency; smallest diff | Does not satisfy the Zod requirement; guard list grows with every rule; no compile-time tie to the `SentenceExplanation` domain type |
| Zod schema inline in `openai-compatible.ts` | Zod validation with a small diff | Provider file keeps growing; schema not independently importable for tests; prompt would live beside transport code |
| Dedicated `sentence-explanation.ts` (schema + prompt) used by the provider | Schema is annotated `z.ZodType<SentenceExplanation>` so a domain-type change breaks compile, not runtime; prompt and validation testable without fake fetch; word-explanation parsing can migrate later | New module and a direct `zod` dependency |

## Decision

Chosen: **Dedicated `sentence-explanation.ts` module**, because the `z.ZodType<SentenceExplanation>` annotation gives a compile-time contract with the domain package, the acceptance criteria demand behavior (prompt rules) that needs its own tests independent of transport, and ARCHITECTURE.md already names Zod as the validation standard.

## Consequences

- Invalid model output still surfaces as `LanguageModelError` with code `INVALID_OUTPUT`, so callers and future caching (#9) see one error taxonomy.
- The provider returns Zod-parsed objects only; unknown extra fields from the model are stripped at the boundary.
- `explainWord` still uses hand-rolled guards; migrating it to the same pattern is deferred until #10 touches word explanations.
- If a provider later needs strict `json_schema` mode, only the request body and this module's JSON-shape description change.

## Artifacts

- [GitHub issue #7](https://github.com/rayjosong/korean-learning-app/issues/7)
