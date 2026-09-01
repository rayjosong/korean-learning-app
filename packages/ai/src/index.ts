import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";

export interface ExplainSentenceInput {
  sentence: string;
  context?: string;
}

export interface ExplainWordInput {
  word: string;
  sentence: string;
}

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

export type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
export {
  SENTENCE_EXPLANATION_PROMPT_VERSION,
  SENTENCE_EXPLANATION_SYSTEM_PROMPT,
  SENTENCE_EXPLANATION_STREAM_SYSTEM_PROMPT
} from "./sentence-explanation.ts";
export {
  WORD_EXPLANATION_PROMPT_VERSION,
  WORD_EXPLANATION_SYSTEM_PROMPT,
  WORD_EXPLANATION_STREAM_SYSTEM_PROMPT,
  wordExplanationSchema
} from "./word-explanation.ts";
export {
  LanguageModelError,
  OpenAICompatibleLanguageModel,
  type OpenAICompatibleLanguageModelOptions
} from "./openai-compatible.ts";
export {
  GeminiLanguageModel,
  type GeminiLanguageModelOptions
} from "./gemini.ts";
export {
  AnthropicLanguageModel,
  type AnthropicLanguageModelOptions
} from "./anthropic.ts";
export {
  createLanguageModel,
  type CreateLanguageModelOptions,
  type ProviderId
} from "./provider-factory.ts";
