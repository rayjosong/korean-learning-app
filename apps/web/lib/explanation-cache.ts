import {
  SENTENCE_EXPLANATION_PROMPT_VERSION,
  WORD_EXPLANATION_PROMPT_VERSION,
  type ExplainSentenceInput,
  type ExplainWordInput,
  type ExplanationStreamEvent,
  type LanguageModel,
  type SentenceExplanation,
  type StreamOptions,
  type WordExplanation
} from "@korean-learning/ai";
import {
  explanationCacheKey,
  getCachedExplanation,
  getCachedWordExplanation,
  putCachedExplanation,
  wordExplanationCacheKey,
  type ExplanationDatabase
} from "@korean-learning/storage";

export interface ExplanationCacheOptions {
  model: LanguageModel;
  database?: ExplanationDatabase;
  provider?: string;
  modelName?: string;
}

/**
 * Wraps a LanguageModel so explanations are served from the local IndexedDB
 * cache incorporating prompt version and resolved provider:model route before
 * calling the provider.
 * Records store provider/model/prompt-version metadata, never credentials.
 */
export function withExplanationCache(options: ExplanationCacheOptions): LanguageModel {
  return {
    explainSentence: async (input: ExplainSentenceInput): Promise<SentenceExplanation> => {
      const key = explanationCacheKey(
        SENTENCE_EXPLANATION_PROMPT_VERSION,
        input.sentence,
        options.provider,
        options.modelName
      );

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
    explainWord: async (input: ExplainWordInput): Promise<WordExplanation> => {
      if (options.database) {
        const key = wordExplanationCacheKey(
          WORD_EXPLANATION_PROMPT_VERSION,
          input.word,
          input.sentence,
          options.provider,
          options.modelName
        );
        const cached = await getCachedWordExplanation(options.database, key);
        if (cached) return cached;
      }

      return options.model.explainWord(input);
    },
    streamSentenceExplanation: (
      input: ExplainSentenceInput,
      streamOptions?: StreamOptions
    ): AsyncIterable<ExplanationStreamEvent> => {
      return options.model.streamSentenceExplanation(input, streamOptions);
    },
    streamWordExplanation: (
      input: ExplainWordInput,
      streamOptions?: StreamOptions
    ): AsyncIterable<ExplanationStreamEvent> => {
      return options.model.streamWordExplanation(input, streamOptions);
    }
  };
}
