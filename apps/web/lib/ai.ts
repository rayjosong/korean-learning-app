import { OpenAICompatibleLanguageModel, type LanguageModel } from "@korean-learning/ai";

export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

/**
 * Application boundary for AI explanations. Components depend on the
 * LanguageModel interface; provider construction stays out of components.
 */
export function createLanguageModel(settings: AiSettings): LanguageModel {
  return new OpenAICompatibleLanguageModel({
    apiKey: settings.apiKey,
    model: settings.model,
    ...(settings.baseUrl?.trim() ? { baseUrl: settings.baseUrl.trim() } : {})
  });
}
