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
  LanguageModelError,
  OpenAICompatibleLanguageModel,
  type OpenAICompatibleLanguageModelOptions
} from "./openai-compatible.js";
