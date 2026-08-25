import { StudySessionLoader } from "@/components/study-session-loader";
import { appTagline } from "@/lib/site";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-sky-300">First study session</p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Learn Korean through real content.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">{appTagline}</p>
      </header>
      <StudySessionLoader />
    </main>
  );
}
