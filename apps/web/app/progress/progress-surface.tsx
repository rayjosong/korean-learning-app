"use client";

import { useEffect, useState } from "react";

import { ProgressDashboard } from "@/components/progress-dashboard";
import { seedFixtureStorage } from "@/lib/fixture-session";

export function ProgressSurface() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fixture = new URLSearchParams(window.location.search).get("fixture");
    if (fixture === "progress-populated" || fixture === "progress-empty") {
      void seedFixtureStorage(fixture === "progress-populated" ? "populated" : "home-empty").then(() => setReady(true));
      return;
    }
    setReady(true);
  }, []);

  if (!ready) return <p role="status" className="border-y border-hairline py-8 text-sm text-ink-muted">Loading local learning evidence...</p>;
  return <ProgressDashboard />;
}
