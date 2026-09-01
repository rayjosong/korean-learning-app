# #33-B Stream contract and OpenAI adapter

## Purpose

Define the provider-neutral streaming contract and make the existing OpenAI-compatible adapter emit it. This is the contract authority for all later adapters and UI work.

## Parallel boundary

This package owns `packages/ai/src/index.ts`, stream protocol modules, the OpenAI adapter, and their tests. It can run in parallel with #33-A. #33-C, #33-D, and #33-E code against this documented contract, then rebase on it before merging.

## Contract

```ts
export type ExplanationStreamEvent =
  | { type: "meaning-delta"; text: string }
  | { type: "phrase"; text: string; meaning: string; role?: string }
  | { type: "grammar"; title: string; explanation: string }
  | { type: "nuance"; text: string }
  | { type: "complete"; explanation: SentenceExplanation | WordExplanation };

export interface StreamOptions {
  signal?: AbortSignal;
}

export interface LanguageModel {
  explainSentence(input: ExplainSentenceInput): Promise<SentenceExplanation>;
  explainWord(input: ExplainWordInput): Promise<WordExplanation>;
  streamSentenceExplanation(
    input: ExplainSentenceInput,
    options?: StreamOptions
  ): AsyncIterable<ExplanationStreamEvent>;
  streamWordExplanation(
    input: ExplainWordInput,
    options?: StreamOptions
  ): AsyncIterable<ExplanationStreamEvent>;
}
```

The wire format is line-delimited JSON. Adapters expose only parsed events. `complete` is emitted only after assembling and validating against the existing Zod schema.

## Files

| File | Work |
| --- | --- |
| `packages/ai/src/index.ts` | Export the stream contract without removing complete methods. |
| `packages/ai/src/explanation-stream.ts` (new) | Parse line-delimited records, assemble results, validate Zod schemas, and produce controlled malformed/incomplete errors. |
| `packages/ai/src/openai-compatible.ts` | Add SSE request/response parsing, cancellation, stream prompt support, and typed event conversion. Retain custom base URL behavior. |
| `packages/ai/src/sentence-explanation.ts` | Add stream protocol instructions and bump prompt version. |
| `packages/ai/src/word-explanation.ts` | Add equivalent instructions and bump prompt version. |
| `packages/ai/test/explanation-stream.test.mjs` (new) | Test valid assembly, malformed records, duplicates, incomplete streams, schema failure, and cancellation. |
| `packages/ai/test/openai-compatible.test.mjs` | Test OpenAI SSE decoding, abort, and safe error normalization. |

## Acceptance criteria

- [ ] Raw provider tokens never reach callers.
- [ ] Natural-meaning deltas and complete detail units stream in order.
- [ ] Invalid or incomplete streams never emit `complete`.
- [ ] Abort cancels reading and returns a controlled cancellation outcome.
- [ ] No request/response error contains a credential or raw provider body.

## Verification

```bash
pnpm --filter @korean-learning/ai test
pnpm typecheck
```

