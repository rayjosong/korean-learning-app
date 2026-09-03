"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExplanationDatabase, getDueReviewCount } from "@korean-learning/storage";

export interface NavItem {
  href: string;
  label: string;
  odId: string;
  match: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "Today", odId: "nav-home", match: (p) => p === "/" },
  { href: "/#desk", label: "Reading desk", odId: "nav-watch", match: (p) => p === "/#desk" || p.startsWith("/watch") },
  { href: "/library", label: "Library", odId: "nav-library", match: (p) => p === "/library" },
  { href: "/review", label: "Review", odId: "nav-review", match: (p) => p === "/review" },
  { href: "/progress", label: "Progress", odId: "nav-progress", match: (p) => p === "/progress" },
  { href: "/settings", label: "Settings", odId: "nav-settings", match: (p) => p === "/settings" }
];

export function RailNavigation({ active }: { active?: string }) {
  const pathname = usePathname() || "/";
  const [dueCount, setDueCount] = useState<number>(8);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const db = new ExplanationDatabase();
      void getDueReviewCount(db, new Date().toISOString()).then((count) => {
        if (count > 0) setDueCount(count);
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <aside
      className="sticky top-0 z-30 flex h-auto w-full flex-col border-b border-hairline bg-canvas p-5 sm:px-6 sm:py-5 lg:h-screen lg:max-h-screen lg:w-[272px] lg:border-b-0 lg:border-r lg:p-7"
      data-od-id="global-navigation"
    >
      <Link
        href="/"
        className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink transition-colors hover:text-primary-deep"
        data-od-id="brand-mark"
      >
        <span className="grid h-[30px] w-[30px] place-items-center border border-ink text-[13px] font-semibold">
          ㄱ
        </span>
        <span className="flex flex-col text-base font-bold leading-tight">
          Korean
          <small className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            Reading room
          </small>
        </span>
      </Link>

      <p className="hidden text-[11px] font-bold uppercase tracking-[0.09em] text-ink-muted lg:mb-3.5 lg:mt-11 lg:block">
        Your study desk
      </p>

      <nav
        className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:mt-0 lg:flex-col lg:gap-1 lg:overflow-x-visible lg:pb-0"
        aria-label="Primary navigation"
      >
        {navItems.map((item) => {
          const isActive = active
            ? active.toLowerCase() === item.label.toLowerCase() ||
              (active.toLowerCase() === "home" && item.label.toLowerCase() === "today")
            : item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-od-id={item.odId}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[44px] items-center whitespace-nowrap rounded-nav px-3.5 text-[14px] transition-colors ${
                isActive
                  ? "bg-ink font-semibold text-surface"
                  : "text-ink-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-hairline pt-5 lg:block">
        <p className="text-[13px] text-ink-muted">
          <strong className="text-xl font-semibold text-ink">{dueCount}</strong> phrases due today
        </p>
        <Link
          href="/review"
          className="mt-1 inline-flex min-h-[44px] items-center text-[13px] font-bold text-primary-deep hover:underline"
          data-od-id="open-review"
        >
          Open review →
        </Link>
      </div>
    </aside>
  );
}
