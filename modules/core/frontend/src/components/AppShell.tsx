'use client';

/**
 * AppShell — universal layout used on every authenticated page.
 *
 * Structure:
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ TopBar (brand · module name · search · bell · avatar)     │
 *   ├──────┬────────────────────────────────────────────────────┤
 *   │ Side │ <children>                                         │
 *   │ Bar  │                                                    │
 *   │      │                                                    │
 *   └──────┴────────────────────────────────────────────────────┘
 *
 * Auto-detects the current module from the URL pathname's first segment.
 * Hides itself on routes that already have their own chrome (login, register,
 * etc.) so the shell only renders for app content.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { companyAPI } from '@/lib/api';
import ModuleBanner, { BannerTab } from './ModuleBanner';
import {
  Home,
  DollarSign,
  Settings,
  Users,
  ShoppingCart,
  Megaphone,
  Briefcase,
  FlaskConical,
  Package,
  Truck,
  Headphones,
  FolderKanban,
  Store,
  ShieldCheck,
  Bell,
  Mail,
  Search,
  ChevronDown,
  Plus,
  HelpCircle,
} from 'lucide-react';

// Palette: single source of truth so the sidebar, header, and search bar
// move together if the theme is ever retuned.
const C = {
  sidebar: '#2C2B52',        // darker Old Glory Blue — sidebar background
  header:  '#5147e6',        // Old Glory Blue — top bar background (uniform across)
  brand:   '#5147e6',        // brand area: same as header so the bar reads as one color
  hover:   '#4A4980',        // lighter Old Glory Blue hover/dropdown surface in dark chrome
  active:  '#01411C',        // Pakistan Green pill for active primary-nav item
  divider: '#26264a',        // 1px hairline between header and sidebar
  textDim: '#cbd5e1',        // muted light text on dark surfaces
};

interface ModuleConfig {
  slug: string;
  label: string;
  icon: any;
}

// Home / Control Room — pinned at the very top of the sidebar, above the groups.
const HOME_ITEM: ModuleConfig = { slug: 'nexacore', label: 'Home', icon: Home };

// Business modules grouped into intuitive domains. The sidebar renders a small
// header per group; the Home dashboard groups its module table the same way.
interface ModuleGroup { label: string; modules: ModuleConfig[]; }
// Unlabeled bands in the user's chosen order; a thin divider separates each band
// (no group headers).
const MODULE_GROUPS: ModuleGroup[] = [
  { label: 'b1', modules: [
    { slug: 'hr',               label: 'HR',               icon: Briefcase },
    { slug: 'accounting',       label: 'Accounting',       icon: DollarSign },
    { slug: 'administration',   label: 'Administration',   icon: Settings },
    { slug: 'contacts',         label: 'Contacts',         icon: Users },
    { slug: 'customer-service', label: 'Customer Service', icon: Headphones },
  ]},
  { label: 'b2', modules: [
    { slug: 'pm',               label: 'Project Mgmt',     icon: FolderKanban },
  ]},
  { label: 'b3', modules: [
    { slug: 'sales',            label: 'Sales',            icon: ShoppingCart },
    { slug: 'marketing',        label: 'Marketing',        icon: Megaphone },
  ]},
  { label: 'b4', modules: [
    { slug: 'rd',               label: 'R&D',              icon: FlaskConical },
  ]},
  { label: 'b5', modules: [
    { slug: 'scm',              label: 'SCM',              icon: Truck },
    { slug: 'qms',              label: 'Quality',          icon: ShieldCheck },
    { slug: 'production',       label: 'Production',       icon: Package },
    { slug: 'inventory',        label: 'Inventory',        icon: Package },
    { slug: 'ecommerce',        label: 'E-commerce',       icon: Store },
  ]},
];

// Pretty name for the top bar — the same map used to derive the heading
// from the URL's first segment.
const MODULE_TITLES: Record<string, string> = {
  nexacore: 'Control Room',
  accounting: 'Accounting & Finance',
  administration: 'Administration',
  sales: 'Sales',
  contacts: 'Contacts',
  marketing: 'Marketing',
  hr: 'Human Resources',
  rd: 'Research & Development',
  production: 'Production',
  qms: 'Quality Management',
  inventory: 'Inventory',
  scm: 'Supply Chain Management',
  'customer-service': 'Customer Service',
  pm: 'Project Management',
  ecommerce: 'E-commerce / POS',
  settings: 'Settings',
  users: 'Users & Roles',
  roles: 'Roles & Permissions',
  notifications: 'Notifications',
  branch: 'Branch',
  modules: 'Modules',
};

// Paths where the shell should NOT render (auth screens, etc.)
const PUBLIC_PATHS = new Set(['/login', '/register', '/forgot-password']);

// Top-level routes that belong to the Home / Control-Room "module" — they
// share a tab strip so navigation between them feels consistent with how
// each other module presents its sections.
const HOME_SLUGS = new Set([
  'nexacore', 'users', 'roles', 'settings', 'notifications', 'messages',
]);

const HOME_TABS: BannerTab[] = [
  { label: 'Dashboard', href: '/nexacore', exact: true },
  // AI and Automation are one section (AI runs as gated automation actions). Its
  // whole grouped menu lives here as a dropdown: Overview + Configure / Operate /
  // Activity, so there is no separate sub-nav bar inside the section.
  // Organised around the team metaphor: you run a company of AI staff. Build the
  // team (Team), meet with them (Meeting Room — approvals live there as a sidebar,
  // so it carries the badge), browse saved Reports, adjust Settings, and review
  // Activity (cost + history + undo). Approvals and Automations were removed from
  // this menu to reduce clutter: approvals are in the Meeting Room; Automations is
  // a separate rule engine reachable at /nexacore/automation.
  {
    label: 'AI Team',
    items: [
      { label: 'Team', href: '/nexacore/ai/team' },
      { label: 'Meeting Room', href: '/nexacore/ai/boardroom' },
      { label: 'Settings', href: '/nexacore/ai/governance' },
      { label: 'Activity', href: '/nexacore/ai/activity' },
    ],
  },
  // Single "Users" surface — also covers what the old Settings page called
  // "Users and Permission", so users and access live in exactly one place.
  {
    label: 'Users',
    items: [
      { label: 'Users',                href: '/nexacore/users' },
      { label: 'Roles & Permissions',  href: '/nexacore/roles' },
    ],
  },
  // Renamed from "Settings" — the section is really for developers
  // extending the platform: defining entities, taxonomies, automation,
  // and frontend theming. Grouped into Backend and Frontend. Kept independent.
  {
    label: 'Custom Development',
    items: [
      {
        label: 'Backend',
        items: [
          { label: 'System Modules', href: '/settings?section=system-modules' },
          { label: 'Lists',          href: '/settings?section=lists' },
        ],
      },
      { label: 'Frontend', href: '/settings?section=frontend' },
    ],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = () => setUserMenuOpen(false);
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [userMenuOpen]);

  // Modules toggled inactive (Settings → System Modules) are hidden from the
  // sidebar. Re-fetches on window focus so toggling reflects here immediately.
  const [disabledModules, setDisabledModules] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const r = await fetch('/api/v1/development/modules');
        if (!r.ok) return;
        const j = await r.json();
        const items: any[] = j?.data || j || [];
        setDisabledModules(new Set(items.filter((m) => m.is_active === false).map((m) => m.module_code)));
      } catch { /* fail-open: show all */ }
    };
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    // Re-fetch the moment a module is toggled in Settings, so the menu updates live.
    window.addEventListener('modules-changed', onFocus);
    return () => { window.removeEventListener('focus', onFocus); window.removeEventListener('modules-changed', onFocus); };
  }, [user]);

  // The tenant's brand (name + logo) for the top-bar. Loaded once, refreshed
  // live when the company profile is saved in Settings. Also drives the white-
  // label browser tab title + favicon so the branding shows everywhere.
  const [brand, setBrand] = useState<{ name: string; logo: string }>({ name: '', logo: '' });
  useEffect(() => {
    if (!user) return;
    const applyBrand = (name: string, logo: string) => {
      setBrand({ name, logo });
      if (typeof document === 'undefined') return;
      if (name) document.title = name;
      if (logo) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = logo;
      }
    };
    const load = async () => {
      try {
        const r = await companyAPI.get();
        applyBrand(r.data?.org_name || '', r.data?.logo_url || '');
      } catch { /* keep default brand */ }
    };
    load();
    const onChanged = (e: any) => {
      const d = e?.detail;
      if (d) applyBrand(d.org_name || '', d.logo_url || '');
      else load();
    };
    window.addEventListener('company-changed', onChanged);
    return () => window.removeEventListener('company-changed', onChanged);
  }, [user]);

  // Unread notifications → a small count badge on the header bell. Refreshes
  // on focus so it stays current without polling.
  const [notifCount, setNotifCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    const load = () => fetch('/api/v1/notifications/unread/count', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
    }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setNotifCount(d.count ?? d.unread_count ?? 0); }).catch(() => {});
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);

  // AI items awaiting a human (inbox + proposals + pending-review jobs) → a badge
  // on the AI & Automation menu, visible from anywhere. Refreshes on focus.
  const [reviewCount, setReviewCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    // Count only pending sign-offs (jobs + proposed changes) — what the Meeting
    // Room's Approvals panel shows. Informational alerts go to Notifications.
    const load = () => fetch('/api/v1/ai/review-count')
      .then((r) => r.json()).then((d) => setReviewCount((d?.jobs || 0) + (d?.pending || 0))).catch(() => {});
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user]);
  // Badge the AI Team tab (visible when the menu is closed) and the Approvals
  // leaf inside it (so an open menu points to exactly where the items are).
  const homeTabs = HOME_TABS.map((t) =>
    t.label === 'AI Team'
      ? {
          ...t,
          badge: reviewCount || undefined,
          items: t.items?.map((g) =>
            g.label === 'Meeting Room' ? { ...g, badge: reviewCount || undefined } : g),
        }
      : t);

  // Render naked (no shell) on auth screens and the marketing root.
  if (PUBLIC_PATHS.has(pathname) || pathname === '/') {
    return <>{children}</>;
  }

  const segments = pathname.split('/').filter(Boolean);
  const activeSlug = segments[0] || '';
  const moduleTitle = MODULE_TITLES[activeSlug] || activeSlug.replace(/-/g, ' ').toUpperCase();

  const isHomeRoute = HOME_SLUGS.has(activeSlug);
  const crumbLabel = isHomeRoute ? 'Home' : moduleTitle;
  const idleCount = disabledModules.size;
  const userInitial = String((user as any)?.full_name || (user as any)?.first_name || user?.email || '?').charAt(0).toUpperCase();
  const userName = (user as any)?.full_name
    || `${(user as any)?.first_name || ''} ${(user as any)?.last_name || ''}`.trim()
    || user?.email || 'User';
  // Split the company name into a display name + entity-suffix subtitle, e.g.
  // "Skarchen Private Limited" → "Skarchen" / "Private Limited" (per design).
  const brandWords = (brand.name || 'NEXACORE').trim().split(/\s+/);
  const brandMain = brandWords[0];
  const brandSub = brandWords.slice(1).join(' ') || 'Workspace';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar — white, breadcrumb left, search + actions right (per design) */}
      <header
        className="flex items-center gap-5 sticky top-0 z-40"
        style={{ height: '64px', backgroundColor: '#ffffff', borderBottom: '1px solid #e9eaf2', paddingLeft: '28px', paddingRight: '28px' }}
      >
        {/* Breadcrumb */}
        <div className="whitespace-nowrap shrink-0" style={{ fontSize: '13.5px', color: '#8b8fa6', fontWeight: 500 }}>
          Workspace&nbsp;/&nbsp;<span style={{ color: '#1a1c2b', fontWeight: 600 }}>{crumbLabel}</span>
        </div>

        {/* Global search — pushed right, pill with ⌘K hint */}
        <form
          className="ml-auto min-w-0"
          style={{ flex: '0 1 440px' }}
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement)?.value.trim();
            if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
          }}
        >
          <div
            data-on-light
            className="app-search flex items-center gap-2.5"
            style={{
              backgroundColor: '#f5f6fb',
              border: `1px solid ${searchFocused ? '#5147e6' : '#e9eaf2'}`,
              borderRadius: '11px', padding: '9px 14px',
              boxShadow: searchFocused ? '0 0 0 3px #eeedfd' : 'none',
              transition: 'border-color .15s, box-shadow .15s',
            }}
          >
            <Search className="shrink-0" style={{ width: 17, height: 17, color: '#8b8fa6' }} />
            <input
              type="search"
              name="q"
              data-bare
              placeholder="Search records, people, modules…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 text-sm min-w-0"
              style={{ color: '#000000', border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent', WebkitAppearance: 'none', appearance: 'none', padding: 0, margin: 0 }}
            />
            <kbd className="hidden sm:inline" style={{ fontSize: '11px', fontWeight: 600, color: '#8b8fa6', background: '#fff', border: '1px solid #e9eaf2', borderRadius: '5px', padding: '2px 6px' }}>⌘K</kbd>
          </div>
        </form>

        {/* Actions: bordered icon buttons + profile pill */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/notifications"
            aria-label={notifCount > 0 ? `Notifications (${notifCount} unread)` : 'Notifications'}
            className="relative inline-flex items-center justify-center"
            style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e9eaf2', color: '#565a70' }}
          >
            <Bell className="w-5 h-5" />
            {notifCount > 0 && (
              <span
                className="absolute flex items-center justify-center rounded-full font-bold"
                style={{
                  top: '-5px', right: '-5px', minWidth: '17px', height: '17px',
                  padding: '0 4px', fontSize: '10px', lineHeight: 1,
                  backgroundColor: '#d8453d', color: '#ffffff', border: '2px solid #ffffff',
                }}
              >
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </Link>
          <Link
            href="/messages"
            aria-label="Messages"
            className="inline-flex items-center justify-center"
            style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #e9eaf2', color: '#565a70' }}
          >
            <Mail className="w-5 h-5" />
          </Link>

          {/* Profile pill — a div (not <button>) to escape the global button flatten */}
          <div className="relative">
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
              className="flex items-center cursor-pointer select-none"
              style={{ gap: '9px', padding: '5px 8px 5px 5px', borderRadius: '11px', border: '1px solid #e9eaf2' }}
              aria-label="User menu"
            >
              <span className="inline-flex items-center justify-center text-white font-bold shrink-0"
                    style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(140deg,#6a5cf6,#4036c4)', fontSize: '13px' }}>
                {userInitial}
              </span>
              <span className="hidden sm:block leading-tight">
                <span className="block" style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f1222', whiteSpace: 'nowrap', maxWidth: '9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</span>
                <span className="block" style={{ fontSize: '11.5px', color: '#8b8fa6' }}>{(user as any)?.is_superuser ? 'Administrator' : 'Member'}</span>
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#8b8fa6' }} />
            </div>
            {userMenuOpen && (
              <div
                data-on-light
                className="absolute top-full mt-2 z-50 overflow-hidden"
                style={{
                  right: 0,
                  width: '15rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  boxShadow: '0 12px 28px rgba(15,23,42,0.16), 0 2px 6px rgba(15,23,42,0.08)',
                  padding: '0.375rem',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 text-xs truncate" style={{ borderBottom: '1px solid #eef2f7', color: '#64748b', marginBottom: '0.25rem' }}>
                  {user?.email}
                </div>
                <Link href="/nexacore/settings" className="block px-3 py-2 text-sm rounded-md hover:bg-gray-50">Settings</Link>
                <Link href="/users" className="block px-3 py-2 text-sm rounded-md hover:bg-gray-50">Users &amp; Roles</Link>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
                  className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — dark indigo brand panel: logo + name, then the workspace nav,
            with an "idle modules" prompt pinned to the bottom (per design). */}
        <nav className="app-sidebar shrink-0 flex flex-col overflow-y-auto"
             style={{ width: '252px', background: 'linear-gradient(185deg,#221d54 0%,#181442 55%,#12102f 100%)', padding: '22px 16px 24px' }}>
          {/* Brand */}
          <Link href="/nexacore" className="flex items-center" style={{ gap: '11px', padding: '4px 8px 22px' }}>
            <span className="shrink-0 inline-grid place-items-center"
                  style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(140deg,#6a5cf6,#4036c4)', boxShadow: '0 6px 16px -6px rgba(106,92,246,0.8)' }}>
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#ffffff" stroke="none" aria-hidden="true"><path d="M5 4l14 8-14 8z" /></svg>
              )}
            </span>
            <span className="min-w-0">
              <span className="font-display block truncate" style={{ color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.15 }}>{brandMain}</span>
              <span className="block truncate" style={{ color: '#8b86bb', fontSize: '11px', fontWeight: 500 }}>{brandSub}</span>
            </span>
          </Link>

          <div style={{ fontSize: '10.5px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6f6aa0', padding: '14px 10px 8px', fontWeight: 600 }}>Workspace</div>

          {(() => {
            const renderModule = (m: ModuleConfig) => {
              const Icon = m.icon;
              const isActive = activeSlug === m.slug;
              return (
                <Link
                  key={m.slug}
                  href={`/${m.slug}`}
                  title={m.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center ${isActive ? '' : 'hover:bg-white/[0.06]'}`}
                  style={{
                    gap: '12px', padding: '10px 12px', borderRadius: '10px',
                    fontSize: '14.5px', fontWeight: isActive ? 600 : 500,
                    ...(isActive ? { backgroundColor: 'rgba(255,255,255,0.10)' } : {}),
                  }}
                >
                  {isActive && (
                    <span style={{ position: 'absolute', left: '-16px', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '22px', borderRadius: '0 4px 4px 0', background: '#8a7bf5' }} />
                  )}
                  <Icon className="shrink-0" style={{ width: 19, height: 19, opacity: isActive ? 1 : 0.85 }} />
                  <span className="truncate">{m.label}</span>
                </Link>
              );
            };
            return (
              <div className="flex flex-col" style={{ gap: '3px' }}>
                {renderModule(HOME_ITEM)}
                {(() => {
                  const bands = MODULE_GROUPS
                    .map((g) => g.modules.filter((m) => !disabledModules.has(m.slug)))
                    .filter((mods) => mods.length > 0);
                  return bands.map((mods, i) => (
                    <div key={i} className="flex flex-col"
                         style={i === 0 ? { gap: '3px' } : { gap: '3px', marginTop: '7px', paddingTop: '7px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      {mods.map(renderModule)}
                    </div>
                  ));
                })()}
              </div>
            );
          })()}

          {/* Footer prompt — idle modules */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <div style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', borderRadius: '13px', padding: '15px' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '13.5px' }}>{idleCount > 0 ? `${idleCount} module${idleCount === 1 ? '' : 's'} idle` : 'All modules active'}</div>
              <div style={{ color: '#908cbb', fontSize: '12px', margin: '4px 0 12px', lineHeight: 1.4 }}>
                {idleCount > 0 ? 'Activate more of your workspace to unlock the full picture.' : 'Your whole workspace is switched on.'}
              </div>
              <Link href="/settings?section=system-modules" className="flex items-center justify-center gap-2"
                    style={{ background: '#fff', borderRadius: '9px', padding: '9px' }}>
                <span style={{ color: '#2a2360', fontWeight: 600, fontSize: '13px' }}>✦ Explore modules</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto" style={{ backgroundColor: '#f5f6fb' }}>
          {/* Home / Control-Room module banner — for the home sub-routes (AI Team,
              Users, Custom Development). The /nexacore dashboard renders its own
              page header, so the banner is suppressed there to avoid duplication. */}
          {isHomeRoute && pathname !== '/nexacore' && (
            <div className="px-4 pt-4">
              <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
                {pathname.startsWith('/nexacore/ai') || pathname.startsWith('/nexacore/automation')
                  ? 'AI Team'
                  : pathname.startsWith('/nexacore/users') || pathname.startsWith('/users')
                    || pathname.startsWith('/nexacore/roles') || pathname.startsWith('/roles')
                  ? 'Users'
                  : pathname.startsWith('/nexacore/settings') || pathname.startsWith('/settings')
                  ? 'Custom Development'
                  : 'Home'}
              </h1>
              <ModuleBanner tabs={homeTabs} />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
