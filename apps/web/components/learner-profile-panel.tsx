"use client";

import { useEffect, useState } from "react";

import { loadLearnerProfile, type LearnerProfileLoadResult } from "@/lib/load-learner-profile";
import type { LearnerProfile } from "@korean-learning/learning-engine/profile";
import type { ExplanationDatabase } from "@korean-learning/storage";

export type LearnerProfilePanelState =
  | { status: "loading" }
  | LearnerProfileLoadResult;

const EMPTY_PROFILE: LearnerProfile = {
  knownCount: 0,
  learningCount: 0,
  recognitionConfidence: { count: 0, average: null },
  productionConfidence: { count: 0, average: null },
  grammar: [],
  speechLevels: []
};

function confidenceLabel(value: number | null): string {
  return value === null ? "No reviews yet" : `${value}% average`;
}

function familiarityLabel(value: "exposed" | "familiar" | "well-exposed"): string {
  if (value === "well-exposed") return "Repeated exposure";
  if (value === "familiar") return "Some exposure";
  return "Seen once";
}

export function LearnerProfileView({ state }: { state: LearnerProfilePanelState }) {
  if (state.status === "loading") {
    return <p className="text-sm text-ink-muted">Building your local profile…</p>;
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="rounded-lg border border-error/30 bg-surface-elevated px-3 py-2 text-sm text-error">
        Learner profile unavailable: {state.message}
      </p>
    );
  }

  const { profile } = state;
  const isEmpty = profile.knownCount === 0 && profile.learningCount === 0 && profile.grammar.length === 0 && profile.speechLevels.length === 0;

  if (isEmpty) {
    return (
      <p className="text-sm leading-6 text-ink-muted">
        Your profile will appear as you save words, review them, and open sentence explanations. Everything stays on this device.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-subtle p-3">
          <p className="text-xs uppercase tracking-wide text-ink-secondary">Known</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{profile.knownCount}</p>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <p className="text-xs uppercase tracking-wide text-ink-secondary">Learning</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{profile.learningCount}</p>
        </div>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg border border-hairline px-3 py-2 text-ink">
          <span className="block text-xs text-ink-muted">Recognition confidence</span>
          {confidenceLabel(profile.recognitionConfidence.average)}
        </p>
        <p className="rounded-lg border border-hairline px-3 py-2 text-ink">
          <span className="block text-xs text-ink-muted">Production confidence</span>
          {confidenceLabel(profile.productionConfidence.average)}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-ink">Grammar encountered</h3>
        {profile.grammar.length ? (
          <ul className="mt-2 space-y-1 text-sm text-ink-secondary">
            {profile.grammar.map((item) => (
              <li key={item.form} className="flex justify-between gap-3">
                <span>{item.form}</span><span className="text-ink-muted">{item.count}×</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-ink-muted">No grammar observations yet.</p>}
      </div>

      <div>
        <h3 className="text-sm font-medium text-ink">Speech levels encountered</h3>
        <p className="mt-1 text-xs leading-5 text-ink-muted">Familiarity here means exposure, not mastery.</p>
        {profile.speechLevels.length ? (
          <ul className="mt-2 space-y-1 text-sm text-ink-secondary">
            {profile.speechLevels.map((item) => (
              <li key={item.level} className="flex justify-between gap-3">
                <span>{item.level}</span>
                <span className="text-ink-muted">{familiarityLabel(item.familiarity)} · {item.count}×</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-ink-muted">No speech-level observations yet.</p>}
      </div>
    </div>
  );
}

export function LearnerProfilePanel({
  database,
  refreshKey
}: {
  database?: ExplanationDatabase;
  refreshKey: number;
}) {
  const [state, setState] = useState<LearnerProfilePanelState>({ status: "ready", profile: EMPTY_PROFILE });

  useEffect(() => {
    if (!database) return;
    let cancelled = false;
    setState({ status: "loading" });
    void loadLearnerProfile(database).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => { cancelled = true; };
  }, [database, refreshKey]);

  return (
    <section className="rounded-xl border border-hairline bg-surface-elevated p-4" aria-label="Learner profile">
      <h2 className="mb-1 font-semibold text-ink">Learner profile</h2>
      <p className="mb-4 text-xs leading-5 text-ink-muted">A local, explainable snapshot from your saved learning and review history.</p>
      <LearnerProfileView state={state} />
    </section>
  );
}
