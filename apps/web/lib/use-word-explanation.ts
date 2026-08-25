import { useCallback, useRef, useState } from "react";

import {
  WORD_EXPLANATION_PROMPT_VERSION,
  type LanguageModel,
  type WordExplanation
} from "@korean-learning/ai";
import {
  getCachedWordExplanation,
  putCachedWordExplanation,
  wordExplanationCacheKey,
  type ExplanationDatabase
} from "@korean-learning/storage";

import type { TranscriptSegment } from "@/lib/transcript";

export type WordExplanationStatus = "idle" | "loading" | "ready" | "error";

export interface WordExplanationState {
  status: WordExplanationStatus;
  word?: string;
  explanation?: WordExplanation;
  error?: string;
}

export interface UseWordExplanationOptions {
  model: LanguageModel | null;
  database?: ExplanationDatabase;
  videoId: string;
  provider?: string;
  modelName?: string;
}

const INITIAL_STATE: WordExplanationState = { status: "idle" };

/**
 * Looks up a word or phrase in the selected segment's context. Serves cached
 * explanations from local storage first and persists each lookup with its
 * source sentence, video, and timestamp.
 */
export function useWordExplanation(options: UseWordExplanationOptions) {
  const [state, setState] = useState<WordExplanationState>(INITIAL_STATE);
  const latestRequestRef = useRef(0);

  const explain = useCallback(
    async ({ word, segment }: { word: string; segment: TranscriptSegment }) => {
      if (!options.model) {
        setState({
          status: "error",
          error: "Add your AI provider key and model to look up words."
        });
        return;
      }

      const request = ++latestRequestRef.current;
      const trimmedWord = word.replace(/\s+/g, " ").trim();
      const sentence = segment.text.replace(/\s+/g, " ").trim();
      const key = wordExplanationCacheKey(WORD_EXPLANATION_PROMPT_VERSION, trimmedWord, sentence);

      setState({ status: "loading", word: trimmedWord });

      if (options.database) {
        const cached = await getCachedWordExplanation(options.database, key);
        if (cached) {
          if (latestRequestRef.current !== request) return;
          setState({ status: "ready", word: trimmedWord, explanation: cached });
          return;
        }
      }

      try {
        const explanation = await options.model.explainWord({ word: trimmedWord, sentence });
        if (latestRequestRef.current !== request) return;
        setState({ status: "ready", word: trimmedWord, explanation });

        if (options.database) {
          await putCachedWordExplanation(options.database, {
            key,
            word: trimmedWord,
            sentence,
            promptVersion: WORD_EXPLANATION_PROMPT_VERSION,
            explanation,
            videoId: options.videoId,
            transcriptSegmentId: segment.id,
            startTimeMs: segment.startTimeMs,
            endTimeMs: segment.endTimeMs,
            ...(options.provider ? { provider: options.provider } : {}),
            ...(options.modelName ? { model: options.modelName } : {}),
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        if (latestRequestRef.current !== request) return;
        setState({
          status: "error",
          word: trimmedWord,
          error: error instanceof Error ? error.message : "The word explanation could not be loaded."
        });
      }
    },
    [options.model, options.database, options.videoId, options.provider, options.modelName]
  );

  const reset = useCallback(() => {
    latestRequestRef.current += 1;
    setState(INITIAL_STATE);
  }, []);

  return { state, explain, reset };
}
