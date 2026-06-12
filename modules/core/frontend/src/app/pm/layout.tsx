import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "PM",
};

const STATS = [
  { label: 'Projects', endpoint: '/api/v1/pm/projects' },
  { label: 'Tasks', endpoint: '/api/v1/pm/tasks' },
  { label: 'Milestones', endpoint: '/api/v1/pm/milestones' },
  { label: 'Strategic Initiatives', endpoint: '/api/v1/pm/strategic-initiatives' }
];
// Ordered top-down from strategy to execution: company-level initiatives
// → project → milestone → task → people allocated to it.
const TABS = [
  { label: 'Dashboard',  href: '/pm', exact: true },
  { label: 'Strategic',  href: '/pm/strategic-initiatives' },
  { label: 'Projects',   href: '/pm/projects' },
  { label: 'Milestones', href: '/pm/milestones' },
  { label: 'Tasks',      href: '/pm/tasks' },
  { label: 'Resources',  href: '/pm/resources' },
  { label: 'Budgets',    href: '/pm/budgets' },
  { label: 'Time Tracking', href: '/pm/time-tracking' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="pm">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Project Management
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
