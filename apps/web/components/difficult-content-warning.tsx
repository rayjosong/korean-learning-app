import type { DifficultyEstimate } from "@korean-learning/learning-engine/video-difficulty";

export function DifficultContentWarning({
  estimate,
  onContinue,
  onDismiss
}: {
  estimate: DifficultyEstimate;
  onContinue: () => void;
  onDismiss: () => void;
}) {
  return (
    <section className="rounded-2xl border border-amber-700/70 bg-amber-950/30 p-4" role="alert" aria-label="Difficult content notice">
      <h2 className="font-semibold text-amber-100">This video may take a little more effort</h2>
      <p className="mt-1 text-sm leading-6 text-amber-200/80">
        The starter estimate suggests about {estimate.likelyComprehension.min}–{estimate.likelyComprehension.max}% may be familiar at first. Try a shorter session or look up a few extra words as you go.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onContinue} className="rounded-lg bg-amber-200 px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100">
          Continue with this video
        </button>
        <button type="button" onClick={onDismiss} className="rounded-lg border border-amber-700/70 px-3 py-2 text-sm text-amber-100 hover:border-amber-300">
          Dismiss for this video
        </button>
      </div>
    </section>
  );
}
