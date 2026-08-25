import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
import type { ExplainSentenceInput, ExplainWordInput, LanguageModel } from "./index.js";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

export interface OpenAICompatibleLanguageModelOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export type LanguageModelErrorCode =
  | "INVALID_INPUT"
  | "REQUEST_FAILED"
  | "INVALID_OUTPUT";

export class LanguageModelError extends Error {
  readonly code: LanguageModelErrorCode;
  readonly status?: number;

  constructor(code: LanguageModelErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "LanguageModelError";
  }
}

export class OpenAICompatibleLanguageModel implements LanguageModel {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpoint: string;
  private readonly request: typeof globalThis.fetch;

  constructor(options: OpenAICompatibleLanguageModelOptions) {
    if (!options.apiKey.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "An AI provider API key is required.");
    }
    if (!options.model.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "An AI provider model is required.");
    }

    this.apiKey = options.apiKey;
    this.model = options.model;
    this.endpoint = `${(options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "")}/chat/completions`;
    this.request = options.fetch ?? globalThis.fetch;
  }

  async explainSentence(input: ExplainSentenceInput): Promise<SentenceExplanation> {
    if (!input.sentence.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "A Korean sentence is required.");
    }

    const context = input.context?.trim();
    const content = await this.complete([
      {
        role: "system",
        content:
          "You are a concise Korean tutor. Return only a JSON object with sentence, naturalMeaning, breakdown, grammar, and optional nuance and speechLevel."
      },
      {
        role: "user",
        content: `Explain this Korean sentence in context.${context ? ` Context: ${context}` : ""}\nSentence: ${input.sentence}`
      }
    ]);

    return parseSentenceExplanation(content);
  }

  async explainWord(input: ExplainWordInput): Promise<WordExplanation> {
    if (!input.word.trim() || !input.sentence.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "A Korean word and source sentence are required.");
    }

    const content = await this.complete([
      {
        role: "system",
        content:
          "You are a concise Korean tutor. Return only a JSON object with word, meaning, and optional dictionaryForm and nuance."
      },
      {
        role: "user",
        content: `Explain the Korean word or phrase "${input.word}" in this sentence: ${input.sentence}`
      }
    ]);

    return parseWordExplanation(content);
  }

  private async complete(messages: readonly ChatMessage[]): Promise<unknown> {
    let response: Response;
    try {
      response = await this.request(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          response_format: { type: "json_object" }
        })
      });
    } catch {
      throw new LanguageModelError("REQUEST_FAILED", "The AI provider request failed.");
    }

    if (!response.ok) {
      throw new LanguageModelError("REQUEST_FAILED", "The AI provider returned an error.", response.status);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned invalid JSON.");
    }

    const content = getMessageContent(payload);
    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned invalid explanation JSON.");
    }
  }
}

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

function getMessageContent(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.choices) || payload.choices.length === 0) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider response had no choices.");
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message) || typeof firstChoice.message.content !== "string") {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider response had no message content.");
  }

  return firstChoice.message.content;
}

function parseSentenceExplanation(value: unknown): SentenceExplanation {
  if (
    !isRecord(value) ||
    typeof value.sentence !== "string" ||
    typeof value.naturalMeaning !== "string" ||
    !Array.isArray(value.breakdown) ||
    !value.breakdown.every(isBreakdownItem) ||
    !Array.isArray(value.grammar) ||
    !value.grammar.every(isGrammarExplanation) ||
    (value.nuance !== undefined && typeof value.nuance !== "string") ||
    (value.speechLevel !== undefined && typeof value.speechLevel !== "string")
  ) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned an invalid sentence explanation.");
  }

  return {
    sentence: value.sentence,
    naturalMeaning: value.naturalMeaning,
    breakdown: value.breakdown,
    grammar: value.grammar,
    ...(value.nuance === undefined ? {} : { nuance: value.nuance }),
    ...(value.speechLevel === undefined ? {} : { speechLevel: value.speechLevel })
  };
}

function parseWordExplanation(value: unknown): WordExplanation {
  if (
    !isRecord(value) ||
    typeof value.word !== "string" ||
    typeof value.meaning !== "string" ||
    (value.dictionaryForm !== undefined && typeof value.dictionaryForm !== "string") ||
    (value.nuance !== undefined && typeof value.nuance !== "string")
  ) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned an invalid word explanation.");
  }

  return {
    word: value.word,
    meaning: value.meaning,
    ...(value.dictionaryForm === undefined ? {} : { dictionaryForm: value.dictionaryForm }),
    ...(value.nuance === undefined ? {} : { nuance: value.nuance })
  };
}

function isBreakdownItem(value: unknown): value is { text: string; meaning: string; role?: string } {
  return (
    isRecord(value) &&
    typeof value.text === "string" &&
    typeof value.meaning === "string" &&
    (value.role === undefined || typeof value.role === "string")
  );
}

function isGrammarExplanation(value: unknown): value is { form: string; explanation: string } {
  return isRecord(value) && typeof value.form === "string" && typeof value.explanation === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
