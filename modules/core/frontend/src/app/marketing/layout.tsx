import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "MARKETING",
};

const STATS = [
  { label: 'Leads',          endpoint: '/api/v1/marketing/leads' },
  { label: 'Campaigns',      endpoint: '/api/v1/marketing/campaigns' },
  { label: 'Content',        endpoint: '/api/v1/marketing/contents' },
  { label: 'Email Templates',endpoint: '/api/v1/marketing/marketing-email-templates' },
  { label: 'Segments',       endpoint: '/api/v1/marketing/segments' },
];
// Ordered along the marketing funnel: produce content → run campaigns
// using that content → capture & nurture leads → segment audiences → hand
// off to sales.
const TABS = [
  { label: 'Dashboard',          href: '/marketing', exact: true },
  { label: 'Forms',              href: '/marketing/forms' },
  { label: 'Form Submissions',   href: '/marketing/form-submissions' },
  { label: 'Content',            href: '/marketing/content' },
  { label: 'Campaigns',          href: '/marketing/campaigns' },
  { label: 'Campaign Activities',href: '/marketing/campaign-activities' },
  { label: 'Campaign Metrics',   href: '/marketing/campaign-metrics' },
  { label: 'Leads',              href: '/marketing/leads' },
  { label: 'Lead Activities',    href: '/marketing/lead-activities' },
  { label: 'Lead Scoring',       href: '/marketing/lead-scoring' },
  { label: 'Segments',           href: '/marketing/segments' },
  { label: 'Lists',              href: '/marketing/lists' },
  { label: 'Journeys',           href: '/marketing/journeys' },
  { label: 'Enrollments',        href: '/marketing/journey-enrollments' },
  { label: 'Email Templates',    href: '/marketing/email-templates' },
  { label: 'Email Sends',        href: '/marketing/email-sends' },
  { label: 'Web Analytics',      href: '/marketing/website-analytics' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="marketing">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Marketing
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
