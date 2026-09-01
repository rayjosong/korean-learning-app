import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
import type {
  ExplainSentenceInput,
  ExplainWordInput,
  ExplanationStreamEvent,
  LanguageModel,
  StreamOptions
} from "./index.js";
import { LanguageModelError } from "./openai-compatible.ts";
import { SENTENCE_EXPLANATION_SYSTEM_PROMPT, sentenceExplanationSchema } from "./sentence-explanation.ts";
import { WORD_EXPLANATION_SYSTEM_PROMPT, wordExplanationSchema } from "./word-explanation.ts";

const DEFAULT_BASE_URL = "https://api.anthropic.com";
const ANTHROPIC_VERSION = "2023-06-01";

export interface AnthropicLanguageModelOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export class AnthropicLanguageModel implements LanguageModel {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly request: typeof globalThis.fetch;

  constructor(options: AnthropicLanguageModelOptions) {
    if (!options.apiKey.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "An AI provider API key is required.");
    }
    if (!options.model.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "An AI provider model is required.");
    }

    this.apiKey = options.apiKey;
    this.model = options.model;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.request = (options.fetch ?? globalThis.fetch).bind(globalThis);
  }

  async explainSentence(input: ExplainSentenceInput): Promise<SentenceExplanation> {
    if (!input.sentence.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "A Korean sentence is required.");
    }

    const context = input.context?.trim();
    const content = await this.complete(
      SENTENCE_EXPLANATION_SYSTEM_PROMPT,
      `Explain this Korean sentence in context.${context ? ` Context: ${context}` : ""}\nSentence: ${input.sentence}`
    );

    return validateSentenceExplanation(content);
  }

  async explainWord(input: ExplainWordInput): Promise<WordExplanation> {
    if (!input.word.trim() || !input.sentence.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "A Korean word and source sentence are required.");
    }

    const content = await this.complete(
      WORD_EXPLANATION_SYSTEM_PROMPT,
      `Explain the Korean word or phrase "${input.word}" in this sentence: ${input.sentence}`
    );

    return validateWordExplanation(content);
  }

  async *streamSentenceExplanation(
    input: ExplainSentenceInput,
    _options?: StreamOptions
  ): AsyncIterable<ExplanationStreamEvent> {
    const explanation = await this.explainSentence(input);
    yield { type: "meaning-delta", text: explanation.naturalMeaning };
    for (const item of explanation.breakdown) {
      yield { type: "phrase", ...item };
    }
    for (const item of explanation.grammar) {
      yield { type: "grammar", title: item.form, explanation: item.explanation };
    }
    if (explanation.nuance) {
      yield { type: "nuance", text: explanation.nuance };
    }
    yield { type: "complete", explanation };
  }

  async *streamWordExplanation(
    input: ExplainWordInput,
    _options?: StreamOptions
  ): AsyncIterable<ExplanationStreamEvent> {
    const explanation = await this.explainWord(input);
    yield { type: "meaning-delta", text: explanation.meaning };
    yield { type: "complete", explanation };
  }

  private async complete(systemPrompt: string, userPrompt: string): Promise<unknown> {
    const endpoint = `${this.baseUrl}/v1/messages`;
    let response: Response;
    try {
      response = await this.request(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt
            }
          ]
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

    const text = getMessageText(payload);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned invalid explanation JSON.");
    }
  }
}

function getMessageText(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.content) || payload.content.length === 0) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider response had no message content.");
  }

  const firstBlock = payload.content[0];
  if (!isRecord(firstBlock) || typeof firstBlock.text !== "string") {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider response had no message content.");
  }

  return firstBlock.text;
}

function validateSentenceExplanation(value: unknown): SentenceExplanation {
  const parsed = sentenceExplanationSchema.safeParse(value);
  if (!parsed.success) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned an invalid sentence explanation.");
  }

  return parsed.data;
}

function validateWordExplanation(value: unknown): WordExplanation {
  const parsed = wordExplanationSchema.safeParse(value);
  if (!parsed.success) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned an invalid word explanation.");
  }

  return parsed.data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
