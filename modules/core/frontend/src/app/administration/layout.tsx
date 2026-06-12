import type { Metadata } from "next"
import { Inter } from "next/font/google"
import ModuleGuard from "@shared/components/ModuleGuard"
import ModuleBanner from "@/components/ModuleBanner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Control Room - Enterprise Management Platform",
  description: "Enterprise headquarters for monitoring and managing all business operations",
}

const STATS = [
  { label: 'Contracts',          endpoint: '/api/v1/administration/contracts' },
  { label: 'Risks',              endpoint: '/api/v1/administration/risks' },
  { label: 'Licenses',           endpoint: '/api/v1/administration/licenses' },
  { label: 'Insurance Policies', endpoint: '/api/v1/administration/insurance-policies' },
];
const TABS = [
  { label: 'Dashboard', href: '/administration', exact: true },
  {
    label: 'Governance',
    items: [
      { label: 'Executive Board',       href: '/administration/executive-board' },
      { label: 'Board Meetings',        href: '/administration/board-meetings' },
      { label: 'Strategic Initiatives', href: '/administration/strategic-initiatives' },
    ],
  },
  {
    label: 'Risk & Compliance',
    items: [
      { label: 'Compliance',          href: '/administration/compliance' },
      { label: 'Compliance Audits',   href: '/administration/compliance-audits' },
      { label: 'Compliance Policies', href: '/administration/compliance-policies' },
      { label: 'Risk Register',       href: '/administration/risks' },
      { label: 'Licenses & Permits',  href: '/administration/licenses' },
      { label: 'Insurance Policies',  href: '/administration/insurance-policies' },
    ],
  },
  { label: 'Legal Cases', href: '/administration/legal-cases' },
  {
    label: 'Records',
    items: [
      { label: 'Contracts',           href: '/administration/contracts' },
      { label: 'Document Management', href: '/administration/documents' },
      { label: 'Credentials',         href: '/administration/credentials' },
      { label: 'Assets',              href: '/administration/asset-management' },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ModuleGuard moduleCode="administration">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Administration
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  )
}
