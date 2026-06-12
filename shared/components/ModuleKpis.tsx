'use client';

/**
 * ModuleKpis — uniform stat-cards row used across module dashboards.
 *
 * Compact side-by-side layout: label sits on the left, value on the right.
 * Cards stay short for plain numbers (the common case), and only grow
 * vertically when a `hint` line is supplied. Same surface chrome
 * (white · light shadow · square corners) as the rest of the system.
 */

import React from 'react';

export interface KpiItem {
  label: string;
  value: string | number;
  hint?: string;                 // small italic line below the value
  href?: string;                 // optional drill-through link
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

const TONE_COLOR: Record<NonNullable<KpiItem['tone']>, string> = {
  default: '#0f172a',
  warning: '#b45309',
  danger:  '#b91c1c',
  success: '#012E14',
};

const fmt = (v: string | number) => {
  if (typeof v === 'number' && !Number.isFinite(v)) return '—';
  if (typeof v === 'number') return v.toLocaleString();
  return v;
};

export default function ModuleKpis({ items }: { items: KpiItem[] }) {
  if (!items || items.length === 0) return null;

  const cols = items.length <= 3 ? 'lg:grid-cols-3'
    : items.length === 4 ? 'lg:grid-cols-4'
    : items.length === 5 ? 'lg:grid-cols-5'
    : 'lg:grid-cols-6';

  const Card = ({ it }: { it: KpiItem }) => (
    <div
      className="bg-white px-4 py-2.5 flex items-baseline justify-between gap-3"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      <div className="min-w-0">
        <div
          className="text-[11px] uppercase truncate"
          style={{ color: '#6b7280', fontWeight: 600, letterSpacing: '0.06em' }}
        >
          {it.label}
        </div>
        {it.hint && (
          <div className="text-[11px] mt-0.5" style={{ color: '#6b7280', fontStyle: 'italic' }}>
            {it.hint}
          </div>
        )}
      </div>
      <div
        className="text-lg shrink-0 tabular-nums"
        style={{ fontWeight: 700, color: TONE_COLOR[it.tone || 'default'] }}
      >
        {fmt(it.value)}
      </div>
    </div>
  );

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 ${cols} gap-3`}
      style={{ marginBottom: '1rem' }}
    >
      {items.map((it) => (
        it.href
          ? <a key={it.label} href={it.href} style={{ textDecoration: 'none' }}><Card it={it} /></a>
          : <Card key={it.label} it={it} />
      ))}
    </div>
  );
}
