import type { LanguageModel } from "../index.ts";
import { parseModelReference } from "../provider-catalog.ts";
import { LanguageModelError, OpenAICompatibleLanguageModel } from "../openai-compatible.ts";
import { createAntigravityCliLanguageModel } from "./antigravity-cli.ts";
import { ClaudeCliLanguageModel, type ClaudeCliLanguageModelOptions } from "./claude-cli.ts";
import { CodexCliLanguageModel, type CodexCliLanguageModelOptions } from "./codex-cli.ts";

export interface ServerLanguageModelOptions {
  credentials?: {
    apiKey?: string;
    baseUrl?: string;
  };
  claude?: Omit<ClaudeCliLanguageModelOptions, "model">;
  codex?: Omit<CodexCliLanguageModelOptions, "model">;
  allowLocalCli?: boolean;
}

export function createServerLanguageModel(
  reference: string,
  options: ServerLanguageModelOptions = {}
): LanguageModel {
  let parsed;
  try {
    parsed = parseModelReference(reference);
  } catch (error) {
    throw new LanguageModelError("INVALID_INPUT", error instanceof Error ? error.message : "Invalid AI provider reference.");
  }

  if (parsed.provider === "openai-compatible") {
    const apiKey = options.credentials?.apiKey?.trim();
    if (!apiKey) {
      throw new LanguageModelError("AUTHENTICATION_FAILED", "An API key is required for OpenAI-compatible providers.");
    }
    return new OpenAICompatibleLanguageModel({
      apiKey,
      model: parsed.model,
      ...(options.credentials?.baseUrl?.trim() ? { baseUrl: options.credentials.baseUrl.trim() } : {})
    });
  }

  if (parsed.provider === "claude_cli" || parsed.provider === "codex_cli") {
    const isCliDisabled =
      options.allowLocalCli === false ||
      process.env.DISABLE_LOCAL_CLI_PROVIDERS === "true" ||
      (process.env.NODE_ENV === "production" &&
        process.env.ENABLE_LOCAL_CLI_PROVIDERS !== "true" &&
        options.allowLocalCli !== true);

    if (isCliDisabled) {
      throw new LanguageModelError("RUNTIME_DISABLED", "Local CLI provider execution is disabled on this server.");
    }

    if (parsed.provider === "claude_cli") {
      return new ClaudeCliLanguageModel({ model: parsed.model, ...options.claude });
    }
    return new CodexCliLanguageModel({ model: parsed.model, ...options.codex });
  }

  if (parsed.provider === "antigravity_cli") {
    return createAntigravityCliLanguageModel();
  }

  throw new LanguageModelError("INVALID_INPUT", "This provider is not available through the server runtime.");
}
