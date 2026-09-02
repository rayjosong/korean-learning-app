import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
import type { ExplainSentenceInput, ExplainWordInput, LanguageModel } from "../index.ts";
import { LanguageModelError } from "../openai-compatible.ts";
import { sentenceExplanationSchema } from "../sentence-explanation.ts";
import { wordExplanationSchema } from "../word-explanation.ts";
import { CliProcessError, runCliProcess } from "./cli-process.ts";
import { resolveCliPath } from "./cli-path.ts";

export interface CodexCliLanguageModelOptions {
  model: string;
  codexHome?: string;
  executable?: string;
  timeoutMs?: number;
  retries?: number;
}

/** CODEX_HOME must be an application-owned login directory, never a copy of a user's general home. */
export class CodexCliLanguageModel implements LanguageModel {
  private readonly options: CodexCliLanguageModelOptions;
  constructor(options: CodexCliLanguageModelOptions) {
    this.options = options;
    if (!options.model.trim()) throw new LanguageModelError("INVALID_INPUT", "An AI provider model is required.");
  }

  async explainSentence(input: ExplainSentenceInput): Promise<SentenceExplanation> {
    if (!input.sentence.trim()) throw new LanguageModelError("INVALID_INPUT", "A Korean sentence is required.");
    return this.complete(sentencePrompt(input));
  }

  async explainWord(input: ExplainWordInput): Promise<WordExplanation> {
    if (!input.word.trim() || !input.sentence.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "A Korean word and source sentence are required.");
    }
    return this.complete(wordPrompt(input));
  }

  private async complete<T>(prompt: string): Promise<T> {
    const executable = this.options.executable ?? await resolveCliPath("codex_cli");
    if (!executable) throw new LanguageModelError("PROVIDER_NOT_INSTALLED", "Codex CLI is not installed.");
    const codexHome = this.options.codexHome ?? process.env.CODEX_CLI_HOME;
    if (!codexHome?.trim()) throw new LanguageModelError("AUTHENTICATION_FAILED", "Codex application login is not configured.");
    try {
      const result = await runCliProcess({
        executable,
        args: [
          "--ask-for-approval", "never", "--sandbox", "read-only", "--model", this.options.model,
          "-c", "web_search=\"disabled\"", "-c", "project_doc_max_bytes=0", "exec", "--ephemeral",
          "--ignore-user-config", "--ignore-rules", "--json", "-"
        ],
        stdin: prompt,
        environment: { CODEX_HOME: codexHome },
        timeoutMs: this.options.timeoutMs,
        retries: this.options.retries,
        allowNonZeroExit: true
      });
      if (result.exitCode !== 0) throw classifyCodexFailure(result.stderr);
      return parseCodexResult(result.stdout) as T;
    } catch (error) {
      if (error instanceof LanguageModelError) throw error;
      if (error instanceof CliProcessError && error.code === "TIMEOUT") {
        throw new LanguageModelError("TIMEOUT", "Codex CLI timed out.");
      }
      throw new LanguageModelError("REQUEST_FAILED", "Codex CLI could not provide an explanation.");
    }
  }
}

function parseCodexResult(stdout: string): unknown {
  let message: string | undefined;
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event: unknown;
    try { event = JSON.parse(line); } catch { throw new LanguageModelError("INVALID_OUTPUT", "Codex CLI returned invalid event JSON."); }
    if (!isRecord(event) || typeof event.type !== "string") {
      throw new LanguageModelError("INVALID_OUTPUT", "Codex CLI returned an unexpected event.");
    }
    if (event.type === "item.completed") {
      const item = event.item;
      if (!isRecord(item)) throw new LanguageModelError("INVALID_OUTPUT", "Codex CLI returned an invalid item.");
      if (item.type === "agent_message" && typeof item.text === "string") message = item.text;
    } else if (!["thread.started", "turn.started", "item.started", "turn.completed", "turn.failed"].includes(event.type)) {
      throw new LanguageModelError("INVALID_OUTPUT", "Codex CLI returned an unexpected event.");
    }
  }
  if (!message) throw new LanguageModelError("INVALID_OUTPUT", "Codex CLI returned no explanation.");
  let result: unknown;
  try { result = JSON.parse(message); } catch { throw new LanguageModelError("INVALID_OUTPUT", "Codex CLI returned invalid explanation JSON."); }
  const sentence = sentenceExplanationSchema.safeParse(result);
  if (sentence.success) return sentence.data;
  const word = wordExplanationSchema.safeParse(result);
  if (word.success) return word.data;
  throw new LanguageModelError("INVALID_OUTPUT", "Codex CLI returned an invalid explanation.");
}

function classifyCodexFailure(stderr: string): LanguageModelError {
  if (/auth|login|credential/i.test(stderr)) return new LanguageModelError("AUTHENTICATION_FAILED", "Codex CLI authentication failed.");
  return new LanguageModelError("REQUEST_FAILED", "Codex CLI could not provide an explanation.");
}

function sentencePrompt(input: ExplainSentenceInput): string {
  return ["Return only one JSON object matching the existing Korean sentence explanation schema.", input.context?.trim() ? `Context: ${input.context.trim()}` : "", `Sentence: ${input.sentence.trim()}`].filter(Boolean).join("\n");
}

function wordPrompt(input: ExplainWordInput): string {
  return `Return only one JSON object matching the existing Korean word explanation schema.\nWord: ${input.word.trim()}\nSentence: ${input.sentence.trim()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
