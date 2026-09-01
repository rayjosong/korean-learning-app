import type { SentenceExplanation, WordExplanation } from "@korean-learning/korean";
import type { ExplanationStreamEvent, StreamOptions } from "./index.ts";
import { LanguageModelError } from "./openai-compatible.ts";
import { sentenceExplanationSchema } from "./sentence-explanation.ts";
import { wordExplanationSchema } from "./word-explanation.ts";

/**
 * Line-delimited stream parser and event assembler.
 * Assembles events as line-delimited JSON objects are parsed from the raw text stream.
 * Validates the final assembled explanation object with Zod schemas before emitting `complete`.
 */

export async function* parseLines(chunks: AsyncIterable<string>, options?: StreamOptions): AsyncGenerator<string> {
  let buffer = "";
  for await (const chunk of chunks) {
    if (options?.signal?.aborted) {
      throw new LanguageModelError("REQUEST_FAILED", "The request was cancelled.");
    }
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        yield trimmed;
      }
    }
  }
  if (options?.signal?.aborted) {
    throw new LanguageModelError("REQUEST_FAILED", "The request was cancelled.");
  }
  const remaining = buffer.trim();
  if (remaining) {
    yield remaining;
  }
}

interface SentenceAssemblyState {
  sentence: string;
  naturalMeaning: string;
  breakdown: Array<{ text: string; meaning: string; role?: string }>;
  grammar: Array<{ form: string; explanation: string }>;
  nuance?: string;
  speechLevel?: string;
}

interface WordAssemblyState {
  word: string;
  meaning: string;
  dictionaryForm?: string;
  nuance?: string;
}

function parseRecord(line: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(line) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Not a JSON object");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider returned malformed stream JSON line.");
  }
}

export async function* processSentenceStream(
  sentence: string,
  chunks: AsyncIterable<string>,
  options?: StreamOptions
): AsyncIterable<ExplanationStreamEvent> {
  const state: SentenceAssemblyState = {
    sentence,
    naturalMeaning: "",
    breakdown: [],
    grammar: []
  };

  for await (const line of parseLines(chunks, options)) {
    if (options?.signal?.aborted) {
      throw new LanguageModelError("REQUEST_FAILED", "The request was cancelled.");
    }

    const rec = parseRecord(line);
    const type = rec.type;

    if (typeof type !== "string") {
      throw new LanguageModelError("INVALID_OUTPUT", "Stream event missing type string.");
    }

    switch (type) {
      case "meaning-delta": {
        if (typeof rec.text !== "string") {
          throw new LanguageModelError("INVALID_OUTPUT", "meaning-delta event missing text string.");
        }
        state.naturalMeaning += rec.text;
        yield { type: "meaning-delta", text: rec.text };
        break;
      }
      case "phrase": {
        if (typeof rec.text !== "string" || typeof rec.meaning !== "string") {
          throw new LanguageModelError("INVALID_OUTPUT", "phrase event missing text or meaning.");
        }
        const role = typeof rec.role === "string" ? rec.role : undefined;
        const phraseObj = { text: rec.text, meaning: rec.meaning, ...(role ? { role } : {}) };
        state.breakdown.push(phraseObj);
        yield { type: "phrase", text: rec.text, meaning: rec.meaning, ...(role ? { role } : {}) };
        break;
      }
      case "grammar": {
        const title = typeof rec.title === "string" ? rec.title : typeof rec.form === "string" ? rec.form : null;
        if (title === null || typeof rec.explanation !== "string") {
          throw new LanguageModelError("INVALID_OUTPUT", "grammar event missing title/form or explanation.");
        }
        state.grammar.push({ form: title, explanation: rec.explanation });
        yield { type: "grammar", title, explanation: rec.explanation };
        break;
      }
      case "nuance": {
        if (typeof rec.text !== "string") {
          throw new LanguageModelError("INVALID_OUTPUT", "nuance event missing text.");
        }
        state.nuance = (state.nuance ? state.nuance + " " : "") + rec.text;
        yield { type: "nuance", text: rec.text };
        break;
      }
      case "speechLevel": {
        if (typeof rec.text !== "string") {
          throw new LanguageModelError("INVALID_OUTPUT", "speechLevel event missing text.");
        }
        state.speechLevel = rec.text;
        break;
      }
      default:
        throw new LanguageModelError("INVALID_OUTPUT", `Unknown stream event type: ${type}`);
    }
  }

  if (options?.signal?.aborted) {
    throw new LanguageModelError("REQUEST_FAILED", "The request was cancelled.");
  }

  if (!state.naturalMeaning.trim()) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider stream resulted in an incomplete sentence explanation.");
  }

  // Final validation against Zod schema before emitting 'complete'
  const validation = sentenceExplanationSchema.safeParse(state);
  if (!validation.success) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider stream resulted in an invalid sentence explanation.");
  }

  yield { type: "complete", explanation: validation.data };
}

export async function* processWordStream(
  word: string,
  chunks: AsyncIterable<string>,
  options?: StreamOptions
): AsyncIterable<ExplanationStreamEvent> {
  const state: WordAssemblyState = {
    word,
    meaning: ""
  };

  for await (const line of parseLines(chunks, options)) {
    if (options?.signal?.aborted) {
      throw new LanguageModelError("REQUEST_FAILED", "The request was cancelled.");
    }

    const rec = parseRecord(line);
    const type = rec.type;

    if (typeof type !== "string") {
      throw new LanguageModelError("INVALID_OUTPUT", "Stream event missing type string.");
    }

    switch (type) {
      case "meaning-delta": {
        if (typeof rec.text !== "string") {
          throw new LanguageModelError("INVALID_OUTPUT", "meaning-delta event missing text string.");
        }
        state.meaning += rec.text;
        yield { type: "meaning-delta", text: rec.text };
        break;
      }
      case "dictionaryForm": {
        if (typeof rec.text !== "string") {
          throw new LanguageModelError("INVALID_OUTPUT", "dictionaryForm event missing text string.");
        }
        state.dictionaryForm = rec.text;
        break;
      }
      case "nuance": {
        if (typeof rec.text !== "string") {
          throw new LanguageModelError("INVALID_OUTPUT", "nuance event missing text string.");
        }
        state.nuance = (state.nuance ? state.nuance + " " : "") + rec.text;
        yield { type: "nuance", text: rec.text };
        break;
      }
      default:
        throw new LanguageModelError("INVALID_OUTPUT", `Unknown stream event type: ${type}`);
    }
  }

  if (options?.signal?.aborted) {
    throw new LanguageModelError("REQUEST_FAILED", "The request was cancelled.");
  }

  if (!state.meaning.trim()) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider stream resulted in an incomplete word explanation.");
  }

  // Final validation against Zod schema before emitting 'complete'
  const validation = wordExplanationSchema.safeParse(state);
  if (!validation.success) {
    throw new LanguageModelError("INVALID_OUTPUT", "The AI provider stream resulted in an invalid word explanation.");
  }

  yield { type: "complete", explanation: validation.data };
}
