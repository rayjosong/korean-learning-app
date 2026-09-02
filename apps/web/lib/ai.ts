import { LanguageModelError, OpenAICompatibleLanguageModel, parseModelReference, type LanguageModel } from "@korean-learning/ai";
import { ServerCliLanguageModel } from "./server-cli-language-model";

export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface SelectedAiSettings extends AiSettings { selectedModel?: string; }

/**
 * Application boundary for AI explanations. Components depend on the
 * LanguageModel interface; provider construction stays out of components.
 */
export function createLanguageModel(settings: SelectedAiSettings): LanguageModel {
  if (settings.selectedModel) {
    const selected = parseModelReference(settings.selectedModel);
    if (selected.provider === "claude_cli" || selected.provider === "codex_cli") {
      return new ServerCliLanguageModel({ model: selected.reference });
    }
    if (selected.provider === "antigravity_cli") {
      throw new LanguageModelError("RUNTIME_DISABLED", "Antigravity CLI runtime is disabled pending security verification.");
    }
    if (selected.provider !== "openai-compatible") throw new LanguageModelError("INVALID_INPUT", "Unknown AI provider.");
  }
  return new OpenAICompatibleLanguageModel({
    apiKey: settings.apiKey,
    model: settings.model,
    ...(settings.baseUrl?.trim() ? { baseUrl: settings.baseUrl.trim() } : {})
  });
}
