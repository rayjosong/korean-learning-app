import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
import type { ExplainSentenceInput, ExplainWordInput, LanguageModel } from "./index.js";
import { LanguageModelError } from "./openai-compatible.ts";
import { SENTENCE_EXPLANATION_SYSTEM_PROMPT, sentenceExplanationSchema } from "./sentence-explanation.ts";
import { WORD_EXPLANATION_SYSTEM_PROMPT, wordExplanationSchema } from "./word-explanation.ts";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";

export interface GeminiLanguageModelOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export class GeminiLanguageModel implements LanguageModel {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly request: typeof globalThis.fetch;

  constructor(options: GeminiLanguageModelOptions) {
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

  private async complete(systemPrompt: string, userPrompt: string): Promise<unknown> {
    const endpoint = `${this.baseUrl}/v1beta/models/${encodeURIComponent(this.model)}:generateContent`;
    let response: Response;
    try {
      response = await this.request(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
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

    const text = getCandidateContent(payload);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned invalid explanation JSON.");
    }
  }
}

function getCandidateContent(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.candidates) || payload.candidates.length === 0) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider response had no candidates.");
  }

  const firstCandidate = payload.candidates[0];
  if (
    !isRecord(firstCandidate) ||
    !isRecord(firstCandidate.content) ||
    !Array.isArray(firstCandidate.content.parts) ||
    firstCandidate.content.parts.length === 0
  ) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider response had no message content.");
  }

  const firstPart = firstCandidate.content.parts[0];
  if (!isRecord(firstPart) || typeof firstPart.text !== "string") {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider response had no message content.");
  }

  return firstPart.text;
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
