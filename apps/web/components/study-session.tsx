"use client";

import { useEffect, useMemo, useState } from "react";

import { ClozeReviewPanel } from "@/components/cloze-review-panel";
import { ExplanationPanel } from "@/components/explanation-panel";
import { LearnerProfilePanel } from "@/components/learner-profile-panel";
import { ProgressDashboard } from "@/components/progress-dashboard";
import { LearningHistoryPanel } from "@/components/learning-history-panel";
import { VideoDifficultyEstimate } from "@/components/video-difficulty-estimate";
import { VideoTranscriptViewer } from "@/components/video-transcript-viewer";
import { createLanguageModel } from "@/lib/ai";
import { withExplanationCache } from "@/lib/explanation-cache";
import type { TranscriptSegment } from "@/lib/transcript";
import { useLearnerItem } from "@/lib/use-learner-item";
import { useSentenceExplanation } from "@/lib/use-sentence-explanation";
import { useWordExplanation } from "@/lib/use-word-explanation";
import { clearExplanationCache, ExplanationDatabase, recordStudiedContent } from "@korean-learning/storage";

export interface StudySessionProps {
  videoId: string;
  segments: readonly TranscriptSegment[];
}

export function StudySession({ videoId, segments }: StudySessionProps) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<TranscriptSegment>();
  const [historyRevision, setHistoryRevision] = useState(0);
  const [cacheDatabase] = useState(
    () => (typeof window === "undefined" ? undefined : new ExplanationDatabase())
  );

  const languageModel = useMemo(() => {
    if (!apiKey.trim() || !model.trim()) return null;
    return withExplanationCache({
      model: createLanguageModel({ apiKey, model, baseUrl }),
      database: cacheDatabase,
      provider: "openai-compatible",
      modelName: model.trim()
    });
  }, [apiKey, model, baseUrl, cacheDatabase]);
  useEffect(() => {
    if (cacheDatabase) void recordStudiedContent(cacheDatabase, { videoId, studiedAt: new Date().toISOString() });
  }, [cacheDatabase, videoId]);

  const { state, explain } = useSentenceExplanation(languageModel);
  const {
    state: wordState,
    explain: explainWord,
    reset: resetWordExplanation
  } = useWordExplanation({
    model: languageModel,
    database: cacheDatabase,
    videoId,
    provider: "openai-compatible",
    modelName: model.trim()
  });
  const {
    state: learnerState,
    load: loadLearnerItem,
    markKnown: markWordKnown,
    markLearning: markWordLearning,
    undo: undoMarkKnown,
    reset: resetLearnerItem
  } = useLearnerItem({ database: cacheDatabase, videoId });

  async function explainSegment(segment: TranscriptSegment) {
    setSelectedSegment(segment);
    resetWordExplanation();
    resetLearnerItem();
    const index = segments.indexOf(segment);
    const previous = index > 0 ? segments[index - 1].text : undefined;
    try {
      await explain({ sentence: segment.text, context: previous });
    } finally {
      setHistoryRevision((revision) => revision + 1);
    }
  }

  function retryExplanation() {
    if (selectedSegment) void explainSegment(selectedSegment);
  }

  async function clearCachedExplanations() {
    if (cacheDatabase) await clearExplanationCache(cacheDatabase);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex flex-col gap-6">
        <VideoDifficultyEstimate
          key={videoId}
          database={cacheDatabase}
          segments={segments}
          refreshKey={historyRevision}
        />
        <VideoTranscriptViewer
          videoId={videoId}
          segments={segments}
          onSegmentClick={(segment) => void explainSegment(segment)}
        />
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl" aria-label="AI provider settings">
          <h2 className="mb-1 font-semibold text-white">AI provider</h2>
          <p className="mb-3 text-xs leading-5 text-slate-500">
            Bring your own key for an OpenAI-compatible provider. The key stays in this tab and is never stored.
          </p>
          <label className="block text-xs font-medium text-slate-400" htmlFor="ai-api-key">API key</label>
          <input
            id="ai-api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-…"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-sky-400 focus:outline-none"
          />
          <label className="mt-3 block text-xs font-medium text-slate-400" htmlFor="ai-model">Model</label>
          <input
            id="ai-model"
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="gpt-4o-mini"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-sky-400 focus:outline-none"
          />
          <label className="mt-3 block text-xs font-medium text-slate-400" htmlFor="ai-base-url">
            Base URL <span className="text-slate-600">(optional)</span>
          </label>
          <input
            id="ai-base-url"
            type="text"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://api.openai.com/v1"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-sky-400 focus:outline-none"
          />
          <button
            type="button"
            disabled={!cacheDatabase}
            onClick={() => void clearCachedExplanations()}
            className="mt-4 w-full rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear cached explanations
          </button>
        </section>

        <ExplanationPanel
          segment={selectedSegment}
          state={state}
          onRetry={retryExplanation}
          wordState={wordState}
          onWordClick={(word) => {
            if (!selectedSegment) return;
            void explainWord({ word, segment: selectedSegment });
            void loadLearnerItem(word);
          }}
          learnerState={learnerState}
          onMarkKnown={() => {
            if (selectedSegment && wordState.word) {
              void markWordKnown({
                text: wordState.word,
                dictionaryForm: wordState.explanation?.dictionaryForm,
                segment: selectedSegment
              }).then(() => setHistoryRevision((revision) => revision + 1));
            }
          }}
          onMarkLearning={() => {
            if (selectedSegment && wordState.word) {
              void markWordLearning({
                text: wordState.word,
                dictionaryForm: wordState.explanation?.dictionaryForm,
                segment: selectedSegment
              }).then(() => setHistoryRevision((revision) => revision + 1));
            }
          }}
          onUndo={() => void undoMarkKnown().then(() => setHistoryRevision((revision) => revision + 1))}
        />
        <ClozeReviewPanel
          database={cacheDatabase}
          refreshKey={historyRevision}
          onReviewComplete={() => setHistoryRevision((revision) => revision + 1)}
        />
        <LearnerProfilePanel database={cacheDatabase} refreshKey={historyRevision} />
        <ProgressDashboard database={cacheDatabase} refreshKey={historyRevision} />
        <LearningHistoryPanel database={cacheDatabase} refreshKey={historyRevision} />
      </div>
    </div>
  );
}
