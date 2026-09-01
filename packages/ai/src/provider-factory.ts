import type { LanguageModel } from "./index.js";
import { AnthropicLanguageModel, type AnthropicLanguageModelOptions } from "./anthropic.ts";
import { GeminiLanguageModel, type GeminiLanguageModelOptions } from "./gemini.ts";
import { LanguageModelError, OpenAICompatibleLanguageModel, type OpenAICompatibleLanguageModelOptions } from "./openai-compatible.ts";

export type ProviderId = "openai" | "gemini" | "anthropic";

export interface CreateLanguageModelOptions {
  provider: ProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export function createLanguageModel(options: CreateLanguageModelOptions): LanguageModel {
  if (!options || typeof options !== "object") {
    throw new LanguageModelError("INVALID_INPUT", "Language model options are required.");
  }

  const { provider, apiKey, model, baseUrl, fetch } = options;

  switch (provider) {
    case "openai":
      return new OpenAICompatibleLanguageModel({ apiKey, model, baseUrl, fetch });
    case "gemini":
      return new GeminiLanguageModel({ apiKey, model, baseUrl, fetch });
    case "anthropic":
      return new AnthropicLanguageModel({ apiKey, model, baseUrl, fetch });
    default:
      throw new LanguageModelError("INVALID_INPUT", `Unsupported AI provider "${String(provider)}".`);
  }
}
