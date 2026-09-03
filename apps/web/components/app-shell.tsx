"use client";

import { RailNavigation } from "./rail-navigation";

export function AppShell({
  children,
  active
}: {
  children: React.ReactNode;
  active?: string;
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <RailNavigation active={active} />
      <div className="min-w-0">
        <div className="mx-auto max-w-[1280px] px-6 pt-5 text-right text-xs text-ink-muted sm:px-12">
          <span className="inline-flex items-center">
            <span className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full bg-sage" />
            Study session saved
          </span>
        </div>
        <div className="mx-auto max-w-[1280px] px-6 py-6 sm:px-12 sm:pb-16 sm:pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
