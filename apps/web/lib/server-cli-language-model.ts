import {
  LanguageModelError,
  type ExplainSentenceInput,
  type ExplainWordInput,
  type LanguageModel,
  type SentenceExplanation,
  type WordExplanation,
  sentenceExplanationSchema,
  wordExplanationSchema
} from "@korean-learning/ai";

export interface ServerLanguageModelClientOptions {
  model: string;
  apiKey?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export type ServerCliLanguageModelOptions = ServerLanguageModelClientOptions;

export class ServerLanguageModelClient implements LanguageModel {
  private readonly options: ServerLanguageModelClientOptions;
  private readonly request: typeof fetch;
  private controller?: AbortController;

  constructor(options: ServerLanguageModelClientOptions) {
    this.options = options;
    if (!options.model.trim()) {
      throw new LanguageModelError("INVALID_INPUT", "Choose a qualified AI provider and model.");
    }
    this.request = (options.fetch ?? fetch).bind(globalThis);
  }

  cancel(): void {
    this.controller?.abort();
  }

  async explainSentence(input: ExplainSentenceInput): Promise<SentenceExplanation> {
    const payload: Record<string, string> = {
      model: this.options.model,
      sentence: input.sentence
    };
    if (input.context?.trim()) {
      payload.context = input.context.trim();
    }
    if (this.options.apiKey?.trim()) {
      payload.apiKey = this.options.apiKey.trim();
    }
    if (this.options.baseUrl?.trim()) {
      payload.baseUrl = this.options.baseUrl.trim();
    }
    return this.post("/api/ai/explain-sentence", payload, sentenceExplanationSchema);
  }

  async explainWord(input: ExplainWordInput): Promise<WordExplanation> {
    const payload: Record<string, string> = {
      model: this.options.model,
      word: input.word,
      sentence: input.sentence
    };
    if (this.options.apiKey?.trim()) {
      payload.apiKey = this.options.apiKey.trim();
    }
    if (this.options.baseUrl?.trim()) {
      payload.baseUrl = this.options.baseUrl.trim();
    }
    return this.post("/api/ai/explain-word", payload, wordExplanationSchema);
  }

  private async post<T>(
    path: string,
    body: Record<string, string>,
    schema: { safeParse(value: unknown): { success: boolean; data?: T } }
  ): Promise<T> {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    let response: Response;
    try {
      response = await this.request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new LanguageModelError("REQUEST_FAILED", "The explanation request was cancelled.");
      }
      throw new LanguageModelError("REQUEST_FAILED", "The AI provider request failed.");
    } finally {
      if (this.controller === controller) this.controller = undefined;
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned invalid JSON.");
    }

    if (!response.ok) {
      throw fromErrorPayload(payload, response.status);
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success || parsed.data === undefined) {
      throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned an invalid explanation.");
    }

    return parsed.data;
  }
}

export const ServerCliLanguageModel = ServerLanguageModelClient;

function fromErrorPayload(payload: unknown, status: number): LanguageModelError {
  const code = isRecord(payload) && typeof payload.code === "string" ? payload.code : "REQUEST_FAILED";
  const message =
    isRecord(payload) && typeof payload.message === "string"
      ? payload.message
      : "The AI provider request failed.";
  if (
    [
      "INVALID_INPUT",
      "REQUEST_FAILED",
      "INVALID_OUTPUT",
      "PROVIDER_NOT_INSTALLED",
      "RUNTIME_DISABLED",
      "AUTHENTICATION_FAILED",
      "TIMEOUT"
    ].includes(code)
  ) {
    return new LanguageModelError(
      code as ConstructorParameters<typeof LanguageModelError>[0],
      message,
      status
    );
  }
  return new LanguageModelError("REQUEST_FAILED", "The AI provider request failed.", status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
