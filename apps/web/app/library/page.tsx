"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExplanationDatabase, type StudiedContentRecord } from "@korean-learning/storage";

interface LibraryItem {
  id: string;
  title: string;
  sentences: number;
  savedPhrases: number;
  url?: string;
}

const STARTER_LIBRARY: LibraryItem[] = [
  { id: "1", title: "오늘의 산책", sentences: 24, savedPhrases: 8, url: "https://www.youtube.com/watch?v=mock-walk" },
  { id: "2", title: "카페에서 생긴 일", sentences: 18, savedPhrases: 4, url: "https://www.youtube.com/watch?v=mock-cafe" },
  { id: "3", title: "시장에서 만난 사람들", sentences: 31, savedPhrases: 6, url: "https://www.youtube.com/watch?v=mock-market" }
];

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>(STARTER_LIBRARY);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const db = new ExplanationDatabase();
    void db.studiedContent.toArray().then((records: StudiedContentRecord[]) => {
      if (records && records.length > 0) {
        const mapped: LibraryItem[] = records.map((record, index) => ({
          id: record.videoId,
          title: `Study Session ${index + 1} (${record.videoId})`,
          sentences: 20,
          savedPhrases: 5,
          url: record.sourceUrl
        }));
        setItems(mapped);
      }
    }).catch(() => {
      // fallback to starter items
    });
  }, []);

  return (
    <div className="max-w-[780px]" data-od-id="library-surface">
      <header className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-deep">
          Library
        </p>
        <h1 className="mt-2.5 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
          The voices you return to.
        </h1>
        <p className="mt-3 text-[17px] text-ink-muted">
          Saved sources keep their transcripts and your phrases together.
        </p>
      </header>

      <div className="border-t border-hairline" data-od-id="library-list">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="grid grid-cols-[42px_1fr_auto] items-center gap-3.5 border-b border-hairline py-4"
          >
            <span className="font-mono text-xs text-ink-muted">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div>
              <strong className="text-[17px] font-semibold text-ink">{item.title}</strong>
              <p className="text-[13px] text-ink-muted">
                {item.sentences} sentences · {item.savedPhrases} phrases saved
              </p>
            </div>
            {item.url ? (
              <Link
                href={`/?videoUrl=${encodeURIComponent(item.url)}`}
                className="text-[13px] font-semibold text-primary-deep hover:underline"
              >
                Open →
              </Link>
            ) : (
              <span className="text-[13px] text-ink-muted">Saved</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
