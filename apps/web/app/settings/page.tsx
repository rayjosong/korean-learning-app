import { SettingsDashboard } from "@/components/settings-dashboard";

export default function SettingsPage() {
  return (
    <div className="max-w-[780px]" data-od-id="settings-surface">
      <header className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-deep">
          Settings
        </p>
        <h1 className="mt-2.5 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
          Set your level of help.
        </h1>
        <p className="mt-3 text-[17px] text-ink-muted">
          English support can stay close, or step back while you read.
        </p>
      </header>
      <SettingsDashboard />
    </div>
  );
}
