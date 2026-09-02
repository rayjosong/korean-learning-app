import {
  formatModelReference,
  LanguageModelError,
  parseModelReference,
  type LanguageModel
} from "@korean-learning/ai";
import { ServerLanguageModelClient } from "./server-cli-language-model";

export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface SelectedAiSettings {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  selectedModel?: string;
}

/**
 * Application boundary for AI explanations. Components depend on the
 * LanguageModel interface; all uncached requests go through the server route.
 */
export function createLanguageModel(settings: SelectedAiSettings): LanguageModel {
  const reference =
    settings.selectedModel ??
    (settings.apiKey?.trim() && settings.model?.trim()
      ? formatModelReference("openai-compatible", settings.model.trim())
      : undefined);

  if (!reference) {
    throw new LanguageModelError("INVALID_INPUT", "Choose a qualified AI provider and model.");
  }

  const parsed = parseModelReference(reference);
  if (parsed.provider === "antigravity_cli") {
    throw new LanguageModelError(
      "RUNTIME_DISABLED",
      "Antigravity CLI runtime is disabled pending security verification."
    );
  }

  if (parsed.provider === "openai-compatible") {
    return new ServerLanguageModelClient({
      model: parsed.reference,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl
    });
  }

  return new ServerLanguageModelClient({
    model: parsed.reference
  });
}
