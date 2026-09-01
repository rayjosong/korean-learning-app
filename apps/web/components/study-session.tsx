"use client";

import { useEffect, useMemo, useState } from "react";

import { ClozeReviewPanel } from "@/components/cloze-review-panel";
import { ContextualReviewPanel } from "@/components/contextual-review-panel";
import { AiProviderSettings } from "@/components/ai-provider-settings";
import { LearnerProfilePanel } from "@/components/learner-profile-panel";
import { RevisitNotice } from "@/components/revisit-notice";
import { LearningHistoryPanel } from "@/components/learning-history-panel";
import { VideoDifficultyEstimate } from "@/components/video-difficulty-estimate";
import { VideoTranscriptViewer } from "@/components/video-transcript-viewer";
import { createLanguageModel } from "@/lib/ai";
import {
  loadAiProviderSettingsRecord,
  resolveTaskRoute,
  type AiProviderSettingsRecord
} from "@/lib/ai-settings";
import { loadAssistanceLevel, saveAssistanceLevel } from "@/lib/assistance-settings";
import type { AssistanceLevel } from "@korean-learning/storage/assistance-settings";
import { withExplanationCache } from "@/lib/explanation-cache";
import type { TranscriptSegment } from "@/lib/transcript";
import { useLearnerItem } from "@/lib/use-learner-item";
import { useSentenceExplanation } from "@/lib/use-sentence-explanation";
import { useWordExplanation } from "@/lib/use-word-explanation";
import { useYouTubePlayer } from "@/lib/use-youtube-player";
import { clearExplanationCache, ExplanationDatabase, putContentResume, recordStudiedContent } from "@korean-learning/storage";
import { createFixtureLanguageModel, type FixtureScenario } from "@/lib/fixture-session";
import { createSessionReviewClipAdapter } from "@/lib/review-clip-adapter";

export interface StudySessionProps {
  videoId: string;
  segments: readonly TranscriptSegment[];
  videoUrl?: string;
  onReplay?: (videoUrl: string) => void;
  fixture?: boolean;
  fixtureScenario?: FixtureScenario;
  initialPositionMs?: number;
}

export function StudySession({ videoId, segments, videoUrl, onReplay, fixture = false, fixtureScenario, initialPositionMs = 0 }: StudySessionProps) {
  const [settingsRecord, setSettingsRecord] = useState<AiProviderSettingsRecord>();
  const [settingsRevision, setSettingsRevision] = useState(0);

  const [mode, setMode] = useState<"watch" | "study">("watch");
  const [assistanceLevel, setAssistanceLevel] = useState<AssistanceLevel>("guided");
  const [assistanceReady, setAssistanceReady] = useState(false);
  const [assistanceError, setAssistanceError] = useState<string>();
  const [englishHelpRevealed, setEnglishHelpRevealed] = useState(false);
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
    pause,
    getCurrentTime,
    isReady
  } = useYouTubePlayer({ videoId, segments, initialPositionMs });

  useEffect(() => {
    if (!cacheDatabase) return;
    void loadAiProviderSettingsRecord(cacheDatabase).then((stored) => {
      if (stored) {
        setSettingsRecord(stored);
      }
    });
  }, [cacheDatabase, settingsRevision]);

  useEffect(() => {
    if (!cacheDatabase) return;
    let active = true;
    void loadAssistanceLevel(cacheDatabase).then((level) => {
      if (!active) return;
      setAssistanceLevel(level);
      setAssistanceReady(true);
    }).catch(() => {
      if (active) setAssistanceReady(true);
    });
    return () => { active = false; };
  }, [cacheDatabase]);

  const resolvedSentenceRoute = useMemo(() => {
    if (!settingsRecord) return undefined;
    try {
      return resolveTaskRoute(settingsRecord, "sentence");
    } catch {
      return undefined;
    }
  }, [settingsRecord]);

  const resolvedWordRoute = useMemo(() => {
    if (!settingsRecord) return undefined;
    try {
      return resolveTaskRoute(settingsRecord, "word");
    } catch {
      return undefined;
    }
  }, [settingsRecord]);

  const sentenceLanguageModel = useMemo(() => {
    if (fixture) return createFixtureLanguageModel(fixtureScenario);
    if (!resolvedSentenceRoute) return null;
    return withExplanationCache({
      model: createLanguageModel(resolvedSentenceRoute),
      database: cacheDatabase,
      provider: resolvedSentenceRoute.provider,
      modelName: resolvedSentenceRoute.model
    });
  }, [fixture, fixtureScenario, resolvedSentenceRoute, cacheDatabase]);

  const wordLanguageModel = useMemo(() => {
    if (fixture) return createFixtureLanguageModel(fixtureScenario);
    if (!resolvedWordRoute) return null;
    return withExplanationCache({
      model: createLanguageModel(resolvedWordRoute),
      database: cacheDatabase,
      provider: resolvedWordRoute.provider,
      modelName: resolvedWordRoute.model
    });
  }, [fixture, fixtureScenario, resolvedWordRoute, cacheDatabase]);

  useEffect(() => {
    if (cacheDatabase && isReady) {
      void recordStudiedContent(cacheDatabase, { videoId, sourceUrl: videoUrl, studiedAt: new Date().toISOString() });
    }
  }, [cacheDatabase, isReady, videoId, videoUrl]);

  useEffect(() => {
    if (!cacheDatabase || !isReady || !videoUrl) return;
    let lastSavedPositionMs = initialPositionMs;
    const persistPosition = () => {
      const positionMs = Math.max(0, Math.round(getCurrentTime() * 1000));
      if (positionMs <= 0 || Math.abs(positionMs - lastSavedPositionMs) < 1000) return;
      lastSavedPositionMs = positionMs;
      void putContentResume(cacheDatabase, {
        videoId,
        sourceUrl: videoUrl,
        lastPositionMs: positionMs,
        completed: false,
        updatedAt: new Date().toISOString()
      });
    };
    const interval = window.setInterval(persistPosition, 5000);
    return () => window.clearInterval(interval);
  }, [cacheDatabase, getCurrentTime, initialPositionMs, isReady, videoId, videoUrl]);

  const { state, explain } = useSentenceExplanation(sentenceLanguageModel);
  const {
    state: wordState,
    explain: explainWord,
    reset: resetWordExplanation
  } = useWordExplanation({
    model: wordLanguageModel,
    database: cacheDatabase,
    videoId,
    provider: resolvedWordRoute?.provider,
    modelName: resolvedWordRoute?.model
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
    setEnglishHelpRevealed(false);
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
    setEnglishHelpRevealed(false);
    resetWordExplanation();
    resetLearnerItem();
  }

  function retryExplanation() {
    if (selectedSegment) void explainSegment(selectedSegment);
  }

  function changeAssistanceLevel(level: AssistanceLevel) {
    const previous = assistanceLevel;
    setAssistanceLevel(level);
    setEnglishHelpRevealed(false);
    setAssistanceError(undefined);
    if (!cacheDatabase) return;
    void saveAssistanceLevel(cacheDatabase, level).catch(() => {
      setAssistanceLevel(previous);
      setAssistanceError("Could not save assistance preference. Try again.");
    });
  }

  const reviewClipAdapter = useMemo(
    () => createSessionReviewClipAdapter({ activeVideoId: videoId, seekTo, play, pause }),
    [videoId, seekTo, play, pause]
  );

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
          assistanceLevel={assistanceLevel}
          assistanceReady={assistanceReady}
          assistanceError={assistanceError}
          onAssistanceChange={changeAssistanceLevel}
          englishHelpRevealed={englishHelpRevealed}
          onShowEnglishHelp={() => setEnglishHelpRevealed(true)}
        />
      </div>

      {/* Demoted utilities/settings area: collapsed by default so the media workspace stays dominant */}
      <details className="rounded-xl border border-hairline bg-surface-subtle">
        <summary className="cursor-pointer px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Workspace Utilities &amp; Settings
        </summary>

        <div className="grid gap-6 border-t border-hairline p-4 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ContextualReviewPanel
              database={cacheDatabase}
              refreshKey={historyRevision}
              clipAdapter={reviewClipAdapter}
              loadClipOnMount={initialPositionMs <= 0}
              onReturnToSource={(context) => {
                if (context.videoId === videoId) {
                  seekTo(context.startTimeMs / 1000);
                  pause();
                }
              }}
              onReviewComplete={() => setHistoryRevision((revision) => revision + 1)}
            />
            <ClozeReviewPanel
              database={cacheDatabase}
              refreshKey={historyRevision}
              onReviewComplete={() => setHistoryRevision((revision) => revision + 1)}
            />
          </div>

          <div className="flex flex-col gap-6">
            <AiProviderSettings
              database={cacheDatabase}
              onSettingsChanged={() => setSettingsRevision((r) => r + 1)}
            />
            <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="Explanation cache settings">
              <button
                type="button"
                disabled={!cacheDatabase}
                onClick={() => void clearCachedExplanations()}
                className="w-full rounded-lg border border-hairline-strong px-3 py-1.5 text-sm text-ink-secondary transition-colors hover:border-error hover:text-error focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear cached explanations
              </button>
            </section>
            <LearnerProfilePanel database={cacheDatabase} refreshKey={historyRevision} />
            <LearningHistoryPanel database={cacheDatabase} refreshKey={historyRevision} />
          </div>
        </div>
      </details>
    </div>
  );
}
