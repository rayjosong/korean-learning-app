import { useCallback, useRef, useState } from "react";

import {
  learningContextId,
  markKnown as markKnownItem,
  type LearningItem
} from "@korean-learning/learning-engine";
import {
  deleteLearningContext,
  deleteLearningItem,
  getLearningItemByText,
  putLearningContext,
  putLearningItem,
  type ExplanationDatabase
} from "@korean-learning/storage";

import type { TranscriptSegment } from "@/lib/transcript";

export type LearnerItemStatus = "idle" | "loading" | "ready" | "error";

export interface SavedLearnerItem {
  item: LearningItem;
  previousItem?: LearningItem;
  isNew: boolean;
  contextId: string;
}

export interface LearnerItemState {
  status: LearnerItemStatus;
  /** Persisted learner item for the selected form, before this session's action. */
  item?: LearningItem;
  /** Present after a save, until another word or phrase is selected. */
  saved?: SavedLearnerItem;
  error?: string;
}

export interface UseLearnerItemOptions {
  database?: ExplanationDatabase;
  videoId: string;
}

const INITIAL_STATE: LearnerItemState = { status: "idle" };

/**
 * Tracks learner state for the selected word or phrase. The state transition
 * lives in the learning engine and persistence in the storage package; this
 * hook only orchestrates them for the explanation card.
 */
export function useLearnerItem(options: UseLearnerItemOptions) {
  const [state, setState] = useState<LearnerItemState>(INITIAL_STATE);
  const latestRequestRef = useRef(0);

  const load = useCallback(
    async (text: string) => {
      const request = ++latestRequestRef.current;
      if (!options.database) {
        setState({ status: "error", error: "Local storage is unavailable." });
        return;
      }

      setState({ status: "loading" });
      try {
        const item = await getLearningItemByText(options.database, text);
        if (latestRequestRef.current !== request) return;
        setState({ status: "ready", item });
      } catch {
        if (latestRequestRef.current !== request) return;
        setState({ status: "error", error: "Your learning progress could not be loaded." });
      }
    },
    [options.database]
  );

  const markKnown = useCallback(
    async ({
      text,
      dictionaryForm,
      segment
    }: {
      text: string;
      dictionaryForm?: string;
      segment: TranscriptSegment;
    }) => {
      if (!options.database) return;
      const request = ++latestRequestRef.current;
      const context = {
        id: learningContextId({ text, videoId: options.videoId, transcriptSegmentId: segment.id }),
        videoId: options.videoId,
        transcriptSegmentId: segment.id,
        sentence: segment.text,
        startTimeMs: segment.startTimeMs,
        endTimeMs: segment.endTimeMs
      };

      try {
        const existing = await getLearningItemByText(options.database, text);
        const now = new Date().toISOString();
        const result = markKnownItem({ existing, text, dictionaryForm, context, now });

        await putLearningItem(options.database, result.item);
        await putLearningContext(options.database, {
          ...context,
          itemId: result.item.id,
          createdAt: now
        });

        if (latestRequestRef.current !== request) return;
        setState({
          status: "ready",
          item: result.item,
          saved: {
            item: result.item,
            previousItem: result.previousItem,
            isNew: result.isNew,
            contextId: context.id
          }
        });
      } catch {
        if (latestRequestRef.current !== request) return;
        setState({ status: "error", error: "The change could not be saved." });
      }
    },
    [options.database, options.videoId]
  );

  const undo = useCallback(async () => {
    const saved = state.saved;
    if (!saved || !options.database) return;
    const request = ++latestRequestRef.current;

    try {
      if (saved.isNew) {
        await deleteLearningItem(options.database, saved.item.id);
      } else if (saved.previousItem) {
        await putLearningItem(options.database, saved.previousItem);
        if (!saved.previousItem.contextIds.includes(saved.contextId)) {
          await deleteLearningContext(options.database, saved.contextId);
        }
      }

      if (latestRequestRef.current !== request) return;
      setState({ status: "ready", item: saved.previousItem });
    } catch {
      if (latestRequestRef.current !== request) return;
      setState({ status: "error", error: "The change could not be undone." });
    }
  }, [state.saved, options.database]);

  const reset = useCallback(() => {
    latestRequestRef.current += 1;
    setState(INITIAL_STATE);
  }, []);

  return { state, load, markKnown, undo, reset };
}
