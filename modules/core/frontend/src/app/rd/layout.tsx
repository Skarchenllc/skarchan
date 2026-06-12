import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "RD",
};

const STATS = [
  { label: 'Projects', endpoint: '/api/v1/rd/rd-projects' },
  { label: 'Experiments', endpoint: '/api/v1/rd/experiments' },
  { label: 'Patents', endpoint: '/api/v1/rd/patents' },
  { label: 'Prototypes', endpoint: '/api/v1/rd/prototypes' }
];
// Ordered along the research lifecycle: project framing → experiments →
// prototype build-out → published outcomes → IP filing.
const TABS = [
  { label: 'Dashboard',       href: '/rd', exact: true },
  { label: 'Projects',        href: '/rd/projects' },
  { label: 'Experiments',     href: '/rd/experiments' },
  { label: 'Prototypes',      href: '/rd/prototypes' },
  { label: 'Research Papers', href: '/rd/research-papers' },
  { label: 'Patents',         href: '/rd/patents' },
  { label: 'Milestones',      href: '/rd/milestones' },
  { label: 'Budgets',         href: '/rd/budgets' },
  { label: 'Collaborations',  href: '/rd/collaborations' },
  { label: 'Team Members',    href: '/rd/team-members' },
  { label: 'Lab Equipment',   href: '/rd/lab-equipment' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="rd">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Research & Development
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
