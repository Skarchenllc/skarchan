'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedTheme } from '@/lib/shared-theme-hook';
import { moduleBuilderAPI } from '@/lib/api';
import {
  FiZap,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiSettings,
  FiPackage,
  FiBarChart2,
  FiCheckCircle,
  FiArrowRight,
  FiShoppingCart,
} from 'react-icons/fi';

/**
 * Public marketing landing (route "/"). Renders WITHOUT the AppShell but still
 * inherits the global app-chrome reset in globals.css (flatten colours, strip
 * shadows/radius, force link/heading colours, recolour every SVG slate…).
 *
 * Rather than fight that rule-by-rule, this page ships a scoped `lp-*` style
 * block (specificity-boosted with `html` + `!important`) that re-asserts an
 * intentional flat, navy + green marketing look. Brand colours still come from
 * the white-label theme (theme.primaryColor / secondaryColor).
 */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, loading: themeLoading } = useSharedTheme();
  const [activeModuleCodes, setActiveModuleCodes] = useState<Set<string> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await moduleBuilderAPI.listModules({});
        const list: any[] = (resp.data as any)?.data || (resp.data as any) || [];
        setActiveModuleCodes(new Set(list.filter(m => m.is_active).map(m => m.module_code)));
      } catch {
        setActiveModuleCodes(new Set());
      }
    })();
  }, []);

  const logoSource = theme.logoFile || theme.logoUrl;
  const navy = theme.primaryColor || '#002868';
  const green = theme.secondaryColor || '#01411C';

  // Redirect to control room if already logged in.
  useEffect(() => {
    if (!loading && user) router.push('/nexacore');
  }, [user, loading, router]);

  if (loading || (user && !loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#ffffff' }}>
        <div className="lp-spinner" />
      </div>
    );
  }

  const allModules = [
    { code: 'accounting',     name: 'Accounting', icon: FiDollarSign,   description: 'Financial management' },
    { code: 'hr',             name: 'HR',         icon: FiUsers,        description: 'People & payroll' },
    { code: 'marketing',      name: 'Marketing',  icon: FiTrendingUp,   description: 'Campaigns & leads' },
    { code: 'sales',          name: 'Sales',      icon: FiBarChart2,    description: 'Pipeline & orders' },
    { code: 'contacts',       name: 'Contacts',   icon: FiUsers,        description: 'CRM & organizations' },
    { code: 'production',     name: 'Production', icon: FiPackage,      description: 'Manufacturing ops' },
    { code: 'rd',             name: 'R&D',        icon: FiZap,          description: 'Research & development' },
    { code: 'administration', name: 'Admin',      icon: FiSettings,     description: 'Roles & settings' },
    { code: 'ecommerce',      name: 'E-commerce', icon: FiShoppingCart, description: 'Storefront & POS' },
  ];
  const modules = activeModuleCodes
    ? allModules.filter(m => activeModuleCodes.has(m.code))
    : allModules;

  const features: { title: string; body: string }[] = [
    { title: 'Unified Business Management', body: 'Manage every aspect of your business from a single platform.' },
    { title: 'Real-time Analytics & Reporting', body: 'Instant insights with powerful analytics and dashboards.' },
    { title: 'Modular Architecture', body: 'Choose only the modules you need, and scale as you grow.' },
    { title: 'Enterprise-Grade Security', body: 'Bank-level security with role-based access control.' },
    { title: 'Customizable Workflows', body: 'Tailor workflows to match your business processes.' },
    { title: 'Multi-Module Integration', body: 'Seamless, real-time data flow between every module.' },
  ];

  const tiers = [
    { name: 'Starter', price: '$49', tag: 'For small teams getting started', popular: false,
      cta: 'Get Started', href: '/register?plan=starter',
      items: ['Up to 3 modules', '10 users included', '5 GB storage', 'Email support', 'Basic analytics'] },
    { name: 'Professional', price: '$149', tag: 'For growing businesses', popular: true,
      cta: 'Get Started', href: '/register?plan=professional',
      items: ['Up to 6 modules', '50 users included', '50 GB storage', 'Priority support', 'Advanced analytics', 'Custom workflows'] },
    { name: 'Enterprise', price: '$399', tag: 'For organizations at scale', popular: false,
      cta: 'Contact Sales', href: '/register?plan=enterprise',
      items: ['All 8 modules', 'Unlimited users', 'Unlimited storage', '24/7 dedicated support', 'White-label options', 'Custom integrations', 'SLA guarantee'] },
  ];

  return (
    <div className="lp-root">
      {/* Scoped landing styles — re-assert an intentional flat marketing look
          over the global app-chrome reset. Specificity-boosted with html + !important. */}
      <style dangerouslySetInnerHTML={{ __html: `
        html .lp-root { background:#ffffff !important; }
        html .lp-wrap { max-width:1140px; margin:0 auto; padding:0 28px; }
        html .lp-stripe { display:flex; height:4px; }
        html .lp-stripe i { flex:1; }

        /* surfaces */
        html .lp-card { background:#ffffff !important; border:1px solid #e5e7eb !important; }
        html .lp-tint { background:#f6f7fb !important; }
        html .lp-dark { background:${navy} !important; }
        html .lp-dark, html .lp-dark * { color:#ffffff !important; }
        html .lp-dark .lp-muted { color:#c9d6ea !important; }
        html .lp-footer { background:#0f172a !important; }
        html .lp-footer, html .lp-footer * { color:#cbd5e1 !important; }
        html .lp-footer h3 { color:#ffffff !important; }

        /* type */
        html .lp-eyebrow { display:inline-flex; align-items:center; gap:.7rem; font-size:12.5px;
          font-weight:700; letter-spacing:.18em; text-transform:uppercase; padding:0;
          background:transparent !important; color:${navy} !important; }
        html .lp-eyebrow::before { content:''; width:26px; height:2px; background:${navy}; display:inline-block; }
        html .lp-h1 { font-size:clamp(2.4rem, 6vw, 4rem) !important; line-height:1.05 !important; font-weight:800 !important;
          color:#0b1220 !important; letter-spacing:-.025em; }
        html .lp-h1 .lp-accent { color:${navy} !important; }
        html .lp-h2 { font-size:2.1rem !important; font-weight:800 !important; color:#0b1220 !important; letter-spacing:-.015em; }
        html .lp-dark .lp-h2 { color:#ffffff !important; }
        html .lp-lead { font-size:1.15rem; color:#475569 !important; }
        html .lp-eyebrow-green { color:${green} !important; }
        html .lp-eyebrow-green::before { background:${green}; }

        /* icons */
        html .lp-chip svg, html .lp-chip svg * { color:#ffffff !important; stroke:#ffffff !important; fill:none !important; }
        html .lp-ico-green svg, html .lp-ico-green svg * { color:${green} !important; stroke:${green} !important; fill:none !important; }

        /* buttons (anchors) — beat html a{color:navy!important} */
        html a.lp-btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          padding:.8rem 1.4rem; font-weight:600; font-size:15px; border:1.5px solid transparent !important;
          text-decoration:none !important; white-space:nowrap; }
        html a.lp-btn-primary, html a.lp-btn-primary:visited { background:${green} !important; color:#ffffff !important; }
        html a.lp-btn-primary:hover { background:#012e14 !important; }
        html a.lp-btn-outline, html a.lp-btn-outline:visited { background:#ffffff !important; color:${navy} !important; border-color:${navy} !important; }
        html a.lp-btn-outline:hover { background:#f6f7fb !important; }
        html a.lp-btn-white, html a.lp-btn-white:visited { background:#ffffff !important; color:${navy} !important; }
        html a.lp-btn-ghost, html a.lp-btn-ghost:visited { background:transparent !important; color:#ffffff !important; border-color:rgba(255,255,255,.55) !important; }
        html a.lp-nav-cta, html a.lp-nav-cta:visited { background:${green} !important; color:#ffffff !important; padding:.55rem 1.1rem; font-weight:600; font-size:14px; }
        html a.lp-textlink, html a.lp-textlink:visited { color:${navy} !important; font-weight:600; font-size:15px; display:inline-flex; align-items:center; gap:.4rem; text-decoration:none !important; white-space:nowrap; }
        html a.lp-textlink:hover { text-decoration:underline !important; }
        html a.lp-btn svg, html a.lp-btn svg *, html a.lp-textlink svg, html a.lp-textlink svg * { color:inherit !important; stroke:currentColor !important; fill:none !important; }

        /* nav */
        html .lp-nav { position:sticky; top:0; z-index:50; background:#ffffff !important; border-bottom:1px solid #e5e7eb !important; }
        html .lp-nav a { color:#334155 !important; text-decoration:none !important; white-space:nowrap; }
        html .lp-nav a.lp-brandname { color:${navy} !important; }
        html .lp-nav a:hover { color:${navy} !important; }

        html .lp-spinner { width:40px; height:40px; border:3px solid #e5e7eb; border-top-color:${navy};
          border-radius:9999px; animation:lpspin 1s linear infinite; }
        @keyframes lpspin { to { transform:rotate(360deg); } }
      ` }} />

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-wrap" style={{ display: 'flex', alignItems: 'center', height: '68px', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            {logoSource ? (
              <img src={logoSource} alt="Logo" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
            ) : (
              <span className="lp-chip" style={{ width: 34, height: 34, background: navy, display: 'grid', placeItems: 'center' }}>
                <FiZap style={{ width: 18, height: 18 }} />
              </span>
            )}
            <span className="lp-brandname" style={{ fontSize: '19px', fontWeight: 700 }}>{theme.appName}</span>
          </Link>
          <span style={{ color: '#94a3b8', fontSize: '13.5px', borderLeft: '1px solid #e5e7eb', paddingLeft: '14px' }}>
            Powering Your Business Forward
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#modules" style={{ fontSize: '14.5px', fontWeight: 600 }}>Products</a>
            <a href="#pricing" style={{ fontSize: '14.5px', fontWeight: 600 }}>Pricing</a>
            <Link href="/login" style={{ fontSize: '14.5px', fontWeight: 600 }}>Sign In</Link>
            <Link href="/register" className="lp-btn lp-nav-cta">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="lp-wrap" style={{ textAlign: 'center', paddingTop: '112px', paddingBottom: '96px' }}>
        <span className="lp-eyebrow">Enterprise Business Management</span>
        <h1 className="lp-h1 text-hero" style={{ margin: '26px 0 0' }}>
          The all-in-one platform<br /><span className="lp-accent">to run your business</span>
        </h1>
        <p className="lp-lead" style={{ maxWidth: '600px', margin: '24px auto 0' }}>
          Enterprise-grade business management that scales with your organization — every module,
          every team, every metric in one connected control room.
        </p>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'center', marginTop: '36px', flexWrap: 'wrap' }}>
          <Link href="/register" className="lp-btn lp-btn-primary" style={{ padding: '0.95rem 1.7rem', fontSize: '15.5px' }}>Start Free Trial <FiArrowRight style={{ width: 18, height: 18 }} /></Link>
          <Link href="/login" className="lp-textlink">Sign in to Control Room <FiArrowRight style={{ width: 15, height: 15 }} /></Link>
        </div>
        <div style={{ marginTop: '24px', color: '#64748b', fontSize: '13px', letterSpacing: '.01em' }}>
          14-day free trial · No credit card required · {modules.length} integrated modules
        </div>
      </header>

      {/* FEATURES */}
      <section className="lp-tint" style={{ padding: '76px 0' }}>
        <div className="lp-wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span className="lp-eyebrow">Why {theme.appName}</span>
            <h2 className="lp-h2" style={{ margin: '16px 0 0' }}>Everything your business needs, unified</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            {features.map((f) => (
              <div key={f.title} className="lp-card" style={{ padding: '24px' }}>
                <div className="lp-ico-green" style={{ marginBottom: '12px' }}>
                  <FiCheckCircle style={{ width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 7px' }}>{f.title}</h3>
                <p style={{ fontSize: '14.5px', color: '#475569', margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" style={{ padding: '76px 0', scrollMarginTop: '68px' }}>
        <div className="lp-wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span className="lp-eyebrow lp-eyebrow-green">Integrated Modules</span>
            <h2 className="lp-h2" style={{ margin: '16px 0 0' }}>One platform. Every department.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {modules.map((m, i) => {
              const Icon = m.icon;
              const c = i % 2 === 0 ? navy : green;
              return (
                <div key={m.code} className="lp-card" style={{ padding: '22px' }}>
                  <span className="lp-chip" style={{ width: 44, height: 44, background: c, display: 'grid', placeItems: 'center', marginBottom: '12px' }}>
                    <Icon style={{ width: 22, height: 22 }} />
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px' }}>{m.name}</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{m.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="lp-tint" style={{ padding: '76px 0', scrollMarginTop: '68px' }}>
        <div className="lp-wrap">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span className="lp-eyebrow">Pricing</span>
            <h2 className="lp-h2" style={{ margin: '16px 0 0' }}>Simple, transparent pricing</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>
            {tiers.map((t) => (
              <div key={t.name} className="lp-card" style={{ padding: '30px 28px', position: 'relative', ...(t.popular ? { border: `2px solid ${green}` } : {}) }}>
                {t.popular && (
                  <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: green, color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', padding: '5px 13px', whiteSpace: 'nowrap' }}>
                    MOST POPULAR
                  </span>
                )}
                <h3 style={{ fontSize: '19px', fontWeight: 700, margin: 0 }}>{t.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '12px 0 4px' }}>
                  <span style={{ fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-.02em', color: t.popular ? green : '#0b1220' }}>{t.price}</span>
                  <span style={{ color: '#64748b', fontSize: '15px' }}>/ month</span>
                </div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>{t.tag}</div>
                <div style={{ height: '1px', background: '#e5e7eb', margin: '20px 0' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  {t.items.map((it) => (
                    <li key={it} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '14.5px', color: '#334155' }}>
                      <span className="lp-ico-green" style={{ flex: 'none', marginTop: '1px' }}><FiCheckCircle style={{ width: 18, height: 18 }} /></span>
                      {it}
                    </li>
                  ))}
                </ul>
                <Link href={t.href} className={`lp-btn ${t.popular ? 'lp-btn-primary' : 'lp-btn-outline'}`} style={{ width: '100%' }}>{t.cta}</Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '32px', color: '#64748b', fontSize: '14.5px' }}>
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-dark" style={{ padding: '76px 0' }}>
        <div className="lp-wrap" style={{ textAlign: 'center' }}>
          <h2 className="lp-h2 text-hero">Ready to transform your business?</h2>
          <p className="lp-muted" style={{ fontSize: '1.15rem', maxWidth: '560px', margin: '16px auto 30px' }}>
            Join thousands of businesses already using {theme.appName} to streamline their operations.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="lp-btn lp-btn-white">Create Your Account</Link>
            <Link href="/login" className="lp-btn lp-btn-ghost">Sign In</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer" style={{ padding: '56px 0 28px' }}>
        <div className="lp-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '36px' }}>
            <div style={{ gridColumn: 'span 2', minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '14px' }}>
                {logoSource
                  ? <img src={logoSource} alt="Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
                  : <span className="lp-chip" style={{ width: 32, height: 32, background: navy, display: 'grid', placeItems: 'center' }}><FiZap style={{ width: 16, height: 16 }} /></span>}
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{theme.appName}</span>
              </div>
              <p style={{ fontSize: '14px', maxWidth: '320px', lineHeight: 1.6 }}>
                Enterprise-grade business management platform designed to scale with your organization.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '12px' }}>Quick Links</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <li><Link href="/login">Sign In</Link></li>
                <li><Link href="/register">Register</Link></li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '12px' }}>Support</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div style={{ marginTop: '40px', paddingTop: '22px', borderTop: '1px solid rgba(255,255,255,.12)', textAlign: 'center', fontSize: '13.5px' }}>
            © {new Date().getFullYear()} {theme.appName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
