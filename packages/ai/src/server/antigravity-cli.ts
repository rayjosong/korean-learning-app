import type { LanguageModel } from "../index.ts";
import { LanguageModelError } from "../openai-compatible.ts";

/**
 * Runtime remains disabled pending verification of non-interactive invocation,
 * tool/MCP/web disabling, permissions, temporary cwd, environment and stdin
 * isolation, JSON contract, and authentication behavior. Never use
 * --dangerously-skip-permissions in production.
 */
export function createAntigravityCliLanguageModel(): LanguageModel {
  throw new LanguageModelError("RUNTIME_DISABLED", "Antigravity CLI runtime is disabled pending security verification.");
}
