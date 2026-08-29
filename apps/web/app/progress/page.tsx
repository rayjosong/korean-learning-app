import { PrimaryNavigation } from "@/components/primary-navigation";
import { ProgressSurface } from "./progress-surface";

export default function ProgressPage() {
  return (
    <main className="mx-auto max-w-[70rem] px-6 py-8 sm:px-10 sm:py-12">
      <PrimaryNavigation active="progress" />
      <header className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-deep">Progress</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Your Korean</h1>
        <p className="mt-5 text-lg leading-8 text-ink-secondary">Evidence from learning and review activity stored on this browser.</p>
      </header>
      <div className="mt-12">
        <ProgressSurface />
      </div>
    </main>
  );
}
