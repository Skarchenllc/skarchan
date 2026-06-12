'use client';

/**
 * ModuleBanner — KPI cards above a horizontal tab strip, shown at the top
 * of every page inside a module. Configured per-module by the module's
 * layout (CRM, Sales, Accounting, Administration).
 *
 * Stats can be:
 *   - { label, endpoint } → fetch count from API
 *   - { label, value }    → static value (e.g. derived metric)
 *
 * Tabs link to module sub-routes. The current tab is detected from the URL.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

export interface BannerStat {
  label: string;
  endpoint?: string;       // /api/v1/.../<entity>  — listing endpoint to count
  value?: string | number; // pre-computed value (used when endpoint omitted)
  suffix?: string;         // e.g. '%' for rates
}

export interface BannerTab {
  label: string;
  href?: string;            // plain link if items not provided
  exact?: boolean;
  items?: BannerTab[];      // when present, renders as a dropdown trigger
  badge?: number;           // optional count pill shown after the label
}

function Badge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
      style={{ backgroundColor: '#dc2626', color: '#fff' }}>{n}</span>
  );
}

function extractCount(resp: any): number | null {
  if (resp == null) return null;
  if (Array.isArray(resp)) return resp.length;
  if (typeof resp === 'object') {
    if (typeof resp.total === 'number') return resp.total;
    if (typeof resp.count === 'number') return resp.count;
    if (Array.isArray(resp.data)) return resp.data.length;
    if (Array.isArray(resp.items)) return resp.items.length;
    if (Array.isArray(resp.results)) return resp.results.length;
  }
  return null;
}

export default function ModuleBanner({
  stats,
  tabs,
}: {
  stats?: BannerStat[];
  tabs?: BannerTab[];
}) {
  const pathname = usePathname() || '';
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!stats) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, number | null> = {};
      await Promise.all(
        stats.map(async (s) => {
          if (!s.endpoint) return;
          try {
            const r = await api.get(s.endpoint);
            next[s.label] = extractCount(r.data);
          } catch {
            next[s.label] = null;
          }
        })
      );
      if (!cancelled) setCounts(next);
    })();
    return () => { cancelled = true; };
  }, [stats]);

  const isActiveTab = (t: BannerTab): boolean => {
    if (!pathname) return false;
    if (t.items) return t.items.some(isActiveTab);
    if (!t.href) return false;
    // Strip query/hash so tabs that deep-link via ?section=… still light up
    // when the user is on the bare /settings route.
    const hrefPath = t.href.split(/[?#]/)[0];
    if (t.exact) return pathname === hrefPath;
    return pathname === hrefPath || pathname.startsWith(hrefPath + '/');
  };

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div
      className="bg-white"
      style={{
        marginBottom: '1rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {/* Tabs only — KPI cards now live in each module's layout above the
          banner (see FinancialKpis for the accounting example). */}
      {tabs && tabs.length > 0 && (
        <div className="flex flex-wrap gap-3 px-4 py-1">
          {tabs.map((t, idx) => {
            const active = isActiveTab(t);
            const baseStyle: React.CSSProperties = active
              ? { borderBottom: '2px solid #5147e6', fontWeight: 600 }
              : { borderBottom: '2px solid transparent' };

            if (t.items) {
              const open = openIdx === idx;
              return (
                <div
                  key={t.label}
                  className="relative inline-flex items-center"
                  onMouseEnter={() => setOpenIdx(idx)}
                  onMouseLeave={() => setOpenIdx(null)}
                >
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-3 text-sm font-semibold leading-none"
                    style={baseStyle}
                    onClick={() => setOpenIdx(open ? null : idx)}
                  >
                    {t.label}<Badge n={t.badge} /> ▾
                  </button>
                  {open && (
                    <div
                      className="absolute left-0 top-full z-20 w-60 overflow-hidden"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.75rem',
                        boxShadow: '0 12px 28px rgba(15,23,42,0.14), 0 2px 6px rgba(15,23,42,0.08)',
                        padding: '0.375rem',
                      }}
                    >
                      {t.items.map((sub, subIdx) => {
                        // Nested group: render the parent label as a small
                        // uppercase section header, then its leaves below.
                        if (sub.items && sub.items.length > 0) {
                          return (
                            <div key={`${sub.label}-${subIdx}`}>
                              <div
                                className="px-4 pt-2 pb-1 text-xs uppercase flex items-center"
                                style={{ color: '#6b7280', letterSpacing: '0.06em', fontWeight: 700 }}
                              >
                                {sub.label}<Badge n={sub.badge} />
                              </div>
                              {sub.items.map(leaf => (
                                leaf.href ? (
                                  <Link
                                    key={leaf.href}
                                    href={leaf.href}
                                    className="block px-3 py-2 text-sm rounded-md hover:bg-gray-50"
                                    style={isActiveTab(leaf) ? { fontWeight: 600, backgroundColor: '#E9E9F1', color: '#5147e6' } : {}}
                                    onClick={() => setOpenIdx(null)}
                                  >
                                    {leaf.label}
                                  </Link>
                                ) : null
                              ))}
                            </div>
                          );
                        }
                        return sub.href ? (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="px-3 py-2 text-sm flex items-center rounded-md hover:bg-gray-50"
                            style={isActiveTab(sub) ? { fontWeight: 600, backgroundColor: '#E9E9F1', color: '#5147e6' } : {}}
                            onClick={() => setOpenIdx(null)}
                          >
                            {sub.label}<Badge n={sub.badge} />
                          </Link>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={t.href}
                href={t.href!}
                className="inline-flex items-center px-3 py-3 text-sm font-semibold leading-none"
                style={baseStyle}
              >
                {t.label}<Badge n={t.badge} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
