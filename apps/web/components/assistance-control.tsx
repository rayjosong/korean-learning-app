import type { AssistanceLevel } from "@korean-learning/storage/assistance-settings";

const labels: Record<AssistanceLevel, string> = {
  full: "Full",
  guided: "Guided",
  immersion: "Immersion"
};

export function AssistanceControl({
  level,
  disabled = false,
  onChange
}: {
  level: AssistanceLevel;
  disabled?: boolean;
  onChange: (level: AssistanceLevel) => void;
}) {
  return (
    <fieldset className="flex items-center gap-1 text-xs" aria-label="Assistance level">
      <legend className="sr-only">Assistance level</legend>
      {(["full", "guided", "immersion"] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={level === option}
          disabled={disabled}
          onClick={() => onChange(option)}
          className={`rounded-md px-2 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${level === option ? "bg-primary-soft font-semibold text-primary-deep" : "text-ink-muted hover:bg-surface-subtle hover:text-ink"} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {labels[option]}
        </button>
      ))}
    </fieldset>
  );
}
