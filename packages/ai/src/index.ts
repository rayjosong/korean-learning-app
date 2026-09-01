import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";

export interface ExplainSentenceInput {
  sentence: string;
  context?: string;
}

export interface ExplainWordInput {
  word: string;
  sentence: string;
}

export interface LanguageModel {
  explainSentence(input: ExplainSentenceInput): Promise<SentenceExplanation>;
  explainWord(input: ExplainWordInput): Promise<WordExplanation>;
}

export type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
export {
  SENTENCE_EXPLANATION_PROMPT_VERSION,
  SENTENCE_EXPLANATION_SYSTEM_PROMPT
} from "./sentence-explanation.ts";
export {
  WORD_EXPLANATION_PROMPT_VERSION,
  WORD_EXPLANATION_SYSTEM_PROMPT,
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
