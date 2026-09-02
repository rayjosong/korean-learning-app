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
  PROVIDER_CATALOG,
  PROVIDER_KEYS,
  formatModelReference,
  isProviderKey,
  parseModelReference,
  type CliProviderStatus,
  type ProviderCatalogEntry,
  type ProviderKey,
  type ProviderTransport,
  type QualifiedModelReference
} from "./provider-catalog.ts";
export {
  SENTENCE_EXPLANATION_PROMPT_VERSION,
  SENTENCE_EXPLANATION_SYSTEM_PROMPT,
  sentenceExplanationSchema
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
