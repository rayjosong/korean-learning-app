import { ProgressSurface } from "./progress-surface";

export default function ProgressPage() {
  return (
    <div className="max-w-[780px]">
      <header className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-deep">
          Progress without pressure
        </p>
        <h1 className="mt-2.5 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
          Evidence of return.
        </h1>
        <p className="mt-3 text-[17px] text-ink-muted">
          A quiet record of the Korean you have spent time with.
        </p>
      </header>
      <ProgressSurface />
    </div>
  );
}
