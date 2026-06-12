/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Core module is at root, no basePath needed
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
  // Inbox + AI Jobs were merged into the tabbed /nexacore/ai/review page, and
  // Usage + Run History + Action Ledger into /nexacore/ai/activity. The old
  // standalone URLs redirect to the matching tab so bookmarks keep working.
  // (Redirects run before filesystem routing; the old page files still exist as
  // the panel components those merged pages import.)
  async redirects() {
    return [
      { source: '/nexacore/ai/inbox',        destination: '/nexacore/ai/review?tab=inbox',  permanent: false },
      { source: '/nexacore/automation/ai-jobs', destination: '/nexacore/ai/review?tab=jobs', permanent: false },
      { source: '/nexacore/ai/usage',        destination: '/nexacore/ai/activity?tab=usage',  permanent: false },
      { source: '/nexacore/automation/runs', destination: '/nexacore/ai/activity?tab=runs',   permanent: false },
      { source: '/nexacore/automation/ledger', destination: '/nexacore/ai/activity?tab=ledger', permanent: false },
      // Workers + Capabilities + Sections were folded into the Team page (train a
      // worker on one screen), so the old config routes redirect there.
      { source: '/nexacore/ai/sections',     destination: '/nexacore/ai/team', permanent: false },
      { source: '/nexacore/ai/workers',      destination: '/nexacore/ai/team', permanent: false },
      { source: '/nexacore/ai/capabilities', destination: '/nexacore/ai/team', permanent: false },
      // Org & Delegation retired: hiring heads → Team, dispatch → Meeting Room,
      // the daily standup schedule → Settings (where it now lives).
      { source: '/nexacore/ai/org',          destination: '/nexacore/ai/governance', permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://core-backend:8000/api/:path*',
      },
      // Home-hub admin pages are addressed under /nexacore/* (consistent with
      // /nexacore/ai and /nexacore/automation) but served by their existing
      // top-level routes — no folder moves, no broken links.
      { source: '/nexacore/users', destination: '/users' },
      { source: '/nexacore/roles', destination: '/roles' },
      { source: '/nexacore/settings', destination: '/settings' },
      { source: '/nexacore/notifications', destination: '/notifications' },
      { source: '/nexacore/messages', destination: '/messages' },
    ];
  },
}

module.exports = nextConfig
