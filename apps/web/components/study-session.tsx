"use client";

import { useEffect, useMemo, useState } from "react";

import { ClozeReviewPanel } from "@/components/cloze-review-panel";
import { AiProviderSettings } from "@/components/ai-provider-settings";
import { LearnerProfilePanel } from "@/components/learner-profile-panel";
import { ProgressDashboard } from "@/components/progress-dashboard";
import { RevisitNotice } from "@/components/revisit-notice";
import { LearningHistoryPanel } from "@/components/learning-history-panel";
import { VideoDifficultyEstimate } from "@/components/video-difficulty-estimate";
import { VideoTranscriptViewer } from "@/components/video-transcript-viewer";
import { createLanguageModel } from "@/lib/ai";
import { loadAiSettings, removeAiSettings, saveAiSettings, type AiSettings } from "@/lib/ai-settings";
import { withExplanationCache } from "@/lib/explanation-cache";
import type { TranscriptSegment } from "@/lib/transcript";
import { useLearnerItem } from "@/lib/use-learner-item";
import { useSentenceExplanation } from "@/lib/use-sentence-explanation";
import { useWordExplanation } from "@/lib/use-word-explanation";
import { useYouTubePlayer } from "@/lib/use-youtube-player";
import { clearExplanationCache, ExplanationDatabase, recordStudiedContent } from "@korean-learning/storage";

export interface StudySessionProps {
  videoId: string;
  segments: readonly TranscriptSegment[];
  videoUrl?: string;
  onReplay?: (videoUrl: string) => void;
}

export function StudySession({ videoId, segments, videoUrl, onReplay }: StudySessionProps) {
  const [settings, setSettings] = useState<AiSettings>({ apiKey: "", model: "gpt-4o-mini" });
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [mode, setMode] = useState<"watch" | "study">("watch");
  const [selectedSegment, setSelectedSegment] = useState<TranscriptSegment>();
  const [historyRevision, setHistoryRevision] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [cacheDatabase] = useState(
    () => (typeof window === "undefined" ? undefined : new ExplanationDatabase())
  );

  const {
    playerContainerRef,
    activeSegmentId,
    playerError,
    seekTo,
    play,
    pause
  } = useYouTubePlayer({ videoId, segments });

  useEffect(() => {
    if (!cacheDatabase) return;
    void loadAiSettings(cacheDatabase).then((stored) => {
      if (stored) {
        setSettings(stored);
        setSettingsSaved(true);
      }
      setSettingsReady(true);
    });
  }, [cacheDatabase]);

  const languageModel = useMemo(() => {
    if (!settings.apiKey.trim() || !settings.model.trim()) return null;
    return withExplanationCache({
      model: createLanguageModel(settings),
      database: cacheDatabase,
      provider: "openai-compatible",
      modelName: settings.model.trim()
    });
  }, [settings, cacheDatabase]);

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
    modelName: settings.model.trim()
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

  function closeExplanation() {
    setSelectedSegment(undefined);
    resetWordExplanation();
    resetLearnerItem();
  }

  function retryExplanation() {
    if (selectedSegment) void explainSegment(selectedSegment);
  }

  async function clearCachedExplanations() {
    if (cacheDatabase) await clearExplanationCache(cacheDatabase);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Primary Video / Transcript Workspace */}
      <div className="flex flex-col gap-6">
        <RevisitNotice
          database={cacheDatabase}
          videoId={videoId}
          segments={segments}
          sessionId={sessionId}
          onReplay={videoUrl && onReplay ? () => onReplay(videoUrl) : undefined}
        />
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
          playerContainerRef={playerContainerRef}
          activeSegmentId={activeSegmentId}
          selectedSegmentId={selectedSegment?.id}
          playerError={playerError}
          seekTo={seekTo}
          play={play}
          pause={pause}
          mode={mode}
          onModeChange={(nextMode) => {
            setMode(nextMode);
          }}
          explanationState={state}
          onRetryExplanation={retryExplanation}
          wordExplanationState={wordState}
          onWordClick={(word) => {
            if (!selectedSegment) return;
            void explainWord({ word, segment: selectedSegment });
            void loadLearnerItem(word);
          }}
          learnerItemState={learnerState}
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
          onUndoMarkKnown={() => void undoMarkKnown().then(() => setHistoryRevision((revision) => revision + 1))}
          onCloseExplanation={closeExplanation}
        />
      </div>

      {/* Clearly labeled temporary utility/settings area below the primary workspace */}
      <hr className="border-slate-800 my-4" />
      
      <div className="rounded-2xl border border-slate-900/60 bg-slate-950 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">
          Workspace Utilities & Settings
        </h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ClozeReviewPanel
              database={cacheDatabase}
              refreshKey={historyRevision}
              onReviewComplete={() => setHistoryRevision((revision) => revision + 1)}
            />
          </div>

          <div className="flex flex-col gap-6">
            <AiProviderSettings
              settings={settings}
              ready={settingsReady}
              saved={settingsSaved}
              onChange={(next) => {
                setSettings(next);
                setSettingsSaved(false);
              }}
              onSave={() => {
                if (!cacheDatabase) return;
                void saveAiSettings(cacheDatabase, settings).then(() => setSettingsSaved(true));
              }}
              onRemove={() => {
                if (!cacheDatabase) return;
                void removeAiSettings(cacheDatabase).then(() => {
                  setSettings({ apiKey: "", model: "gpt-4o-mini" });
                  setSettingsSaved(false);
                });
              }}
            />
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl" aria-label="Explanation cache settings">
              <button
                type="button"
                disabled={!cacheDatabase}
                onClick={() => void clearCachedExplanations()}
                className="mt-4 w-full rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear cached explanations
              </button>
            </section>
            <LearnerProfilePanel database={cacheDatabase} refreshKey={historyRevision} />
            <ProgressDashboard database={cacheDatabase} refreshKey={historyRevision} />
            <LearningHistoryPanel database={cacheDatabase} refreshKey={historyRevision} />
          </div>
        </div>
      </div>
    </div>
  );
}
