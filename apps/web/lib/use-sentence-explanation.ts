import { useCallback, useRef, useState } from "react";

import type { ExplainSentenceInput, LanguageModel, SentenceExplanation } from "@korean-learning/ai";

export type SentenceExplanationStatus = "idle" | "loading" | "ready" | "error";

export interface SentenceExplanationState {
  status: SentenceExplanationStatus;
  explanation?: SentenceExplanation;
  error?: string;
}

const INITIAL_STATE: SentenceExplanationState = { status: "idle" };

export function useSentenceExplanation(model: LanguageModel | null) {
  const [state, setState] = useState<SentenceExplanationState>(INITIAL_STATE);
  const latestRequestRef = useRef(0);

  const explain = useCallback(
    async (input: ExplainSentenceInput) => {
      if (!model) {
        setState({
          status: "error",
          error: "Choose a ready AI provider to get explanations."
        });
        return;
      }

      const request = ++latestRequestRef.current;
      setState({ status: "loading" });

      try {
        const explanation = await model.explainSentence(input);
        if (latestRequestRef.current !== request) return;
        setState({ status: "ready", explanation });
      } catch (error) {
        if (latestRequestRef.current !== request) return;
        setState({
          status: "error",
          error: error instanceof Error ? error.message : "The explanation could not be loaded."
        });
      }
    },
    [model]
  );

  const reset = useCallback(() => {
    latestRequestRef.current += 1;
    setState(INITIAL_STATE);
  }, []);

  return { state, explain, reset };
}
