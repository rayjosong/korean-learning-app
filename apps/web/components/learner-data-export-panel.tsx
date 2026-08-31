"use client";

import { useState } from "react";
import { ExplanationDatabase } from "@korean-learning/storage";
import { exportLearnerData } from "@korean-learning/storage/export";

export function LearnerDataExportPanel() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const db = new ExplanationDatabase();
      await db.open();
      let data;
      try {
        data = await exportLearnerData(db);
      } finally {
        db.close();
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `korean-learning-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-hairline bg-surface p-6">
      <div className="mb-4">
        <h3 className="text-base font-medium text-ink">Export Learner Data</h3>
        <p className="mt-1 text-sm text-ink-secondary">
          Download your learning history, contexts, reviews, and progress as a versioned JSON file. AI provider credentials are never exported.
        </p>
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="rounded-lg bg-surface-elevated px-4 py-2 text-sm font-medium text-ink shadow-sm ring-1 ring-inset ring-hairline hover:bg-surface disabled:opacity-50"
      >
        {isExporting ? "Exporting..." : "Export to JSON"}
      </button>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </div>
  );
}
