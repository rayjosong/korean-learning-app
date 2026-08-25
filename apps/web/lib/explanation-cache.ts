import {
  SENTENCE_EXPLANATION_PROMPT_VERSION,
  type ExplainSentenceInput,
  type ExplainWordInput,
  type LanguageModel,
  type SentenceExplanation,
  type WordExplanation
} from "@korean-learning/ai";
import {
  explanationCacheKey,
  getCachedExplanation,
  putCachedExplanation,
  type ExplanationDatabase
} from "@korean-learning/storage";

export interface ExplanationCacheOptions {
  model: LanguageModel;
  database?: ExplanationDatabase;
  provider?: string;
  modelName?: string;
}

/**
 * Wraps a LanguageModel so sentence explanations are served from the local
 * IndexedDB cache (sentence + prompt version) before calling the provider.
 * Records store provider/model/prompt-version metadata, never credentials.
 */
export function withExplanationCache(options: ExplanationCacheOptions): LanguageModel {
  return {
    explainSentence: async (input: ExplainSentenceInput): Promise<SentenceExplanation> => {
      const key = explanationCacheKey(SENTENCE_EXPLANATION_PROMPT_VERSION, input.sentence);

      if (options.database) {
        const cached = await getCachedExplanation(options.database, key);
        if (cached) return cached;
      }

      const explanation = await options.model.explainSentence(input);

      if (options.database) {
        await putCachedExplanation(options.database, {
          key,
          sentence: input.sentence.replace(/\s+/g, " ").trim(),
          promptVersion: SENTENCE_EXPLANATION_PROMPT_VERSION,
          explanation,
          ...(options.provider ? { provider: options.provider } : {}),
          ...(options.modelName ? { model: options.modelName } : {}),
          createdAt: new Date().toISOString()
        });
      }

      return explanation;
    },
    explainWord: (input: ExplainWordInput): Promise<WordExplanation> => options.model.explainWord(input)
  };
}
