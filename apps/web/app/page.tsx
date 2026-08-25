import { appTagline } from "@/lib/site";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section>
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-sky-300">Coming soon</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Learn Korean through real content.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">{appTagline}</p>
      </section>
    </main>
  );
}
