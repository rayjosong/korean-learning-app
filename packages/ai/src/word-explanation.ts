import { z } from "zod";

import type { WordExplanation } from "@korean-learning/korean";

/**
 * System prompt for structured word/phrase explanations in sentence context.
 *
 * Product rules it encodes:
 * - the meaning is contextual: it must fit how the word is used in the sentence;
 * - the dictionary form is given when the surface form differs from it;
 * - contractions, slang, fillers, and casual/honorific forms are explained
 *   as real Korean, not skipped or formalized;
 * - the default explanation stays concise.
 */
export const WORD_EXPLANATION_SYSTEM_PROMPT = [
  "You are a Korean tutor. Explain exactly one Korean word or short phrase as it is used in one given sentence.",
  "Return only a JSON object with this shape:",
  "{",
  '  "word": the word or phrase exactly as written in the sentence,',
  '  "meaning": the meaning in this sentence, short and natural,',
  '  "dictionaryForm": optional; the dictionary form, only when the surface form differs (e.g. 가고 있어요 -> 가다, 뭐 -> 무엇),',
  '  "nuance": optional; include only when there is notable tone, implication, or register beyond the plain meaning',
  "}",
  "Rules:",
  "- meaning must fit the sentence context, never a bare list of dictionary senses;",
  "- explain contractions, slang, fillers, and casual or honorific usage instead of skipping them;",
  "- be concise by default: one short meaning, no extra commentary, no markdown, no fields beyond the schema."
].join("\n");

/**
 * Version of the word explanation prompt. Cached explanations are keyed
 * by this version, so bump it whenever the prompt changes meaningfully.
 */
export const WORD_EXPLANATION_PROMPT_VERSION = "1";

export const wordExplanationSchema: z.ZodType<WordExplanation> = z.object({
  word: z.string(),
  meaning: z.string(),
  dictionaryForm: z.string().optional(),
  nuance: z.string().optional()
});
