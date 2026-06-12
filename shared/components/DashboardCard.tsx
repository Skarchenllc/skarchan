'use client';

/**
 * DashboardCard — uniform "panel" used on module dashboards (Recent X,
 * Upcoming Y, Alerts, etc.). Same chrome as ModuleKpis (white surface,
 * 1px light shadow, square corners) so a module dashboard reads as one
 * visual system.
 *
 * Provides a built-in empty state so callers don't reinvent the vertical-
 * whitespace + grey-icon pattern each time.
 */

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface DashboardCardProps {
  title: string;
  viewAllHref?: string;
  emptyMessage?: string;          // shown when children is empty/null
  empty?: boolean;                // explicit empty toggle (overrides children check)
  emptyIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function DashboardCard({
  title,
  viewAllHref,
  emptyMessage = 'Nothing to show yet.',
  empty,
  emptyIcon,
  children,
}: DashboardCardProps) {
  const isEmpty = typeof empty === 'boolean'
    ? empty
    : (children === null || children === undefined
        || (Array.isArray(children) && children.length === 0));

  return (
    <div
      className="bg-white surface dashboard-card"
      style={{ border: '1px solid #e5e7eb' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #e5e7eb' }}
      >
        <h3 className="text-sm font-semibold" style={{ letterSpacing: '0.02em' }}>
          {title}
        </h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center text-xs font-semibold"
            style={{ color: '#5147e6' }}
          >
            View all <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        )}
      </div>
      <div className="p-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {emptyIcon && <div className="mb-2" style={{ color: '#cbd5e1' }}>{emptyIcon}</div>}
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {emptyMessage}
            </p>
          </div>
        ) : children}
      </div>
    </div>
  );
}
