import type { LanguageModel } from "../index.ts";
import { parseModelReference } from "../provider-catalog.ts";
import { LanguageModelError } from "../openai-compatible.ts";
import { createAntigravityCliLanguageModel } from "./antigravity-cli.ts";
import { ClaudeCliLanguageModel, type ClaudeCliLanguageModelOptions } from "./claude-cli.ts";
import { CodexCliLanguageModel, type CodexCliLanguageModelOptions } from "./codex-cli.ts";

export interface ServerLanguageModelOptions {
  claude?: Omit<ClaudeCliLanguageModelOptions, "model">;
  codex?: Omit<CodexCliLanguageModelOptions, "model">;
}

export function createServerLanguageModel(reference: string, options: ServerLanguageModelOptions = {}): LanguageModel {
  let parsed;
  try { parsed = parseModelReference(reference); } catch (error) {
    throw new LanguageModelError("INVALID_INPUT", error instanceof Error ? error.message : "Invalid AI provider reference.");
  }
  if (parsed.provider === "claude_cli") return new ClaudeCliLanguageModel({ model: parsed.model, ...options.claude });
  if (parsed.provider === "codex_cli") return new CodexCliLanguageModel({ model: parsed.model, ...options.codex });
  if (parsed.provider === "antigravity_cli") return createAntigravityCliLanguageModel();
  throw new LanguageModelError("INVALID_INPUT", "This provider is not available through the server CLI runtime.");
}
