import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
import type { ExplainSentenceInput, ExplainWordInput, LanguageModel } from "../index.ts";
import { LanguageModelError } from "../openai-compatible.ts";
import { sentenceExplanationSchema } from "../sentence-explanation.ts";
import { wordExplanationSchema } from "../word-explanation.ts";
import { CliProcessError, runCliProcess } from "./cli-process.ts";
import { resolveCliPath } from "./cli-path.ts";

export interface ClaudeCliLanguageModelOptions {
  model: string;
  apiKey?: string;
  executable?: string;
  timeoutMs?: number;
  retries?: number;
}

/** Claude CLI is invoked in its documented streaming JSON mode with all local tools disabled. */
export class ClaudeCliLanguageModel implements LanguageModel {
  private readonly options: ClaudeCliLanguageModelOptions;
  constructor(options: ClaudeCliLanguageModelOptions) {
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
    const executable = this.options.executable ?? await resolveCliPath("claude_cli");
    if (!executable) throw new LanguageModelError("PROVIDER_NOT_INSTALLED", "Claude Code CLI is not installed.");
    try {
      const result = await runCliProcess({
        executable,
        args: [
          "-p", "--model", this.options.model, "--tools", "", "--strict-mcp-config",
          "--setting-sources", "", "--no-session-persistence", "--permission-mode", "dontAsk",
          "--input-format", "stream-json", "--output-format", "stream-json", "--verbose"
        ],
        stdin: `${JSON.stringify({ type: "user", message: { role: "user", content: prompt } })}\n`,
        environment: {
          ...(process.env.CLAUDE_CLI_HOME?.trim() || process.env.HOME ? { HOME: process.env.CLAUDE_CLI_HOME?.trim() || process.env.HOME } : {}),
          ...(this.options.apiKey?.trim() ? { ANTHROPIC_API_KEY: this.options.apiKey.trim() } : {})
        },
        timeoutMs: this.options.timeoutMs,
        retries: this.options.retries,
        allowNonZeroExit: true
      });
      if (result.exitCode !== 0) throw classifyClaudeFailure(result.stderr);
      return parseClaudeResult(result.stdout) as T;
    } catch (error) {
      if (error instanceof LanguageModelError) throw error;
      if (error instanceof CliProcessError && error.code === "TIMEOUT") {
        throw new LanguageModelError("TIMEOUT", "Claude Code timed out.");
      }
      throw new LanguageModelError("REQUEST_FAILED", "Claude Code could not provide an explanation.");
    }
  }
}

function parseClaudeResult(stdout: string): unknown {
  let result: unknown;
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event: unknown;
    try { event = JSON.parse(line); } catch { throw new LanguageModelError("INVALID_OUTPUT", "Claude Code returned invalid event JSON."); }
    if (!isRecord(event) || !["system", "assistant", "result"].includes(String(event.type))) {
      throw new LanguageModelError("INVALID_OUTPUT", "Claude Code returned an unexpected event.");
    }
    if (event.type === "result") {
      if (event.subtype !== "success" || typeof event.result !== "string") {
        throw new LanguageModelError("INVALID_OUTPUT", "Claude Code did not return a successful result.");
      }
      try { result = JSON.parse(event.result); } catch { throw new LanguageModelError("INVALID_OUTPUT", "Claude Code returned invalid explanation JSON."); }
    }
  }
  if (result === undefined) throw new LanguageModelError("INVALID_OUTPUT", "Claude Code returned no result.");
  const sentence = sentenceExplanationSchema.safeParse(result);
  if (sentence.success) return sentence.data;
  const word = wordExplanationSchema.safeParse(result);
  if (word.success) return word.data;
  throw new LanguageModelError("INVALID_OUTPUT", "Claude Code returned an invalid explanation.");
}

function classifyClaudeFailure(stderr: string): LanguageModelError {
  if (/auth|login|credential|api key/i.test(stderr)) {
    return new LanguageModelError("AUTHENTICATION_FAILED", "Claude Code authentication failed.");
  }
  return new LanguageModelError("REQUEST_FAILED", "Claude Code could not provide an explanation.");
}

function sentencePrompt(input: ExplainSentenceInput): string {
  return [
    "Return only one JSON object matching the existing Korean sentence explanation schema.",
    input.context?.trim() ? `Context: ${input.context.trim()}` : "",
    `Sentence: ${input.sentence.trim()}`
  ].filter(Boolean).join("\n");
}

function wordPrompt(input: ExplainWordInput): string {
  return `Return only one JSON object matching the existing Korean word explanation schema.\nWord: ${input.word.trim()}\nSentence: ${input.sentence.trim()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
