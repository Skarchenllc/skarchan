import type { Metadata } from "next";
import HealthBanner from "@/components/ai/HealthBanner";

export const metadata: Metadata = {
  title: "AI & Automation | Business Management",
  description: "AI control plane and workflow automation — one section, grouped by Configure / Operate / Activity",
};

// Navigation lives in the top "AI & Automation" menu dropdown (AppShell HOME_TABS),
// so the section layout is just the page container.
export default function AutomationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-6">
      <HealthBanner />
      {children}
    </div>
  );
}
