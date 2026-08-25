import { VideoTranscriptViewer } from "@/components/video-transcript-viewer";
import { appTagline } from "@/lib/site";

const exampleSegments = [
  { id: "intro", text: "안녕하세요, 여러분.", startTimeMs: 0, endTimeMs: 2500 },
  { id: "welcome", text: "오늘도 함께 한국어를 공부해 봐요.", startTimeMs: 2500, endTimeMs: 6500 },
  { id: "closing", text: "그럼 다음 영상에서 만나요.", startTimeMs: 6500, endTimeMs: 9500 }
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-sky-300">First study session</p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Learn Korean through real content.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">{appTagline}</p>
      </header>
      <VideoTranscriptViewer videoId="9bZkp7q19f0" segments={exampleSegments} />
    </main>
  );
}
