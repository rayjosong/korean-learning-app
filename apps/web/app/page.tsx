import { PrimaryNavigation } from "@/components/primary-navigation";
import { StudySessionLoader } from "@/components/study-session-loader";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[90rem] px-6 py-8 sm:px-10 sm:py-12">
      <PrimaryNavigation active="home" />
      <StudySessionLoader />
    </main>
  );
}
