import { StudySessionLoader } from "@/components/study-session-loader";
import { appTagline } from "@/lib/site";

const upcomingNav = ["Library", "Review", "Progress", "Settings"];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[90rem] px-6 py-8 sm:px-10 sm:py-12">
      <nav
        className="mb-14 flex items-center justify-between border-b border-hairline pb-4"
        aria-label="Primary navigation"
      >
        <a href="/" className="text-sm font-semibold tracking-tight text-ink">Korean</a>
        <div className="flex items-center gap-5 text-sm">
          <a href="/" className="text-ink-secondary">Home</a>
          {upcomingNav.map((item) => (
            <span key={item} aria-disabled="true" className="text-ink-muted">{item}</span>
          ))}
        </div>
      </nav>
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary-deep">First study session</p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Learn Korean through real content.</h1>
        <p className="mt-5 text-lg leading-8 text-ink-secondary">{appTagline}</p>
      </header>
      <StudySessionLoader />
    </main>
  );
}
