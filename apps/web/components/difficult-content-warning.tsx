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
    <section className="rounded-xl border border-hairline-strong bg-highlight-soft p-4" role="alert" aria-label="Difficult content notice">
      <h2 className="font-semibold text-ink">This video may take a little more effort</h2>
      <p className="mt-1 text-sm leading-6 text-ink-secondary">
        The starter estimate suggests about {estimate.likelyComprehension.min}–{estimate.likelyComprehension.max}% may be familiar at first. Try a shorter session or look up a few extra words as you go.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onContinue} className="rounded-lg bg-primary-hover px-3 py-2 text-sm font-medium text-on-primary transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1">
          Continue with this video
        </button>
        <button type="button" onClick={onDismiss} className="rounded-lg border border-hairline-strong px-3 py-2 text-sm text-ink-secondary transition-colors hover:border-ink-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary">
          Dismiss for this video
        </button>
      </div>
    </section>
  );
}
