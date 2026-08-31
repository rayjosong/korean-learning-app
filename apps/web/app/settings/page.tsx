import { PrimaryNavigation } from "@/components/primary-navigation";
import { SettingsDashboard } from "@/components/settings-dashboard";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-[90rem] px-6 py-8 sm:px-10 sm:py-12">
      <PrimaryNavigation active="settings" />
      <SettingsDashboard />
    </main>
  );
}
