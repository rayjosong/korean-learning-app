import {
  createLanguageModel as createFactoryLanguageModel,
  type CreateLanguageModelOptions,
  type LanguageModel,
  type ProviderId
} from "@korean-learning/ai";

export type { LanguageModel, ProviderId, CreateLanguageModelOptions };

export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
  provider?: ProviderId;
}

/**
 * Application boundary for AI explanations. Components depend on the
 * LanguageModel interface; provider construction uses the #33-C provider factory.
 */
export function createLanguageModel(settings: AiSettings): LanguageModel {
  return createFactoryLanguageModel({
    provider: settings.provider ?? "openai",
    apiKey: settings.apiKey,
    model: settings.model,
    ...(settings.baseUrl?.trim() ? { baseUrl: settings.baseUrl.trim() } : {})
  });
}
