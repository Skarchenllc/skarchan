'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';

export default function PmDashboardPage() {
  const [counts, setCounts] = useState({
    projects: 0, tasks: 0, milestones: 0, resources: 0, time: 0, budgets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const countOf = async (entityType: string): Promise<number> => {
      try {
        const r = await fetch(`/api/v1/development/entity-records?entity_type=${entityType}&limit=1000`);
        if (!r.ok) return 0;
        const j = await r.json();
        const list = Array.isArray(j) ? j : (j.data || []);
        return list.length;
      } catch { return 0; }
    };
    (async () => {
      // Entity types must match the ones the list pages render, otherwise the
      // KPI counts drift from what the user sees in each tab. The PM lists use
      // the pm_-prefixed types (and time_tracking for Time Tracking).
      const [p, t, m, r, tt, b] = await Promise.all([
        countOf('pm_projects'),
        countOf('pm_tasks'),
        countOf('pm_milestones'),
        countOf('pm_resources'),
        countOf('time_tracking'),
        countOf('pm_budgets'),
      ]);
      setCounts({ projects: p, tasks: t, milestones: m, resources: r, time: tt, budgets: b });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const kpis: KpiItem[] = [
    { label: 'Projects',      value: counts.projects,   href: '/pm/projects' },
    { label: 'Tasks',         value: counts.tasks,      href: '/pm/tasks' },
    { label: 'Milestones',    value: counts.milestones, href: '/pm/milestones' },
    { label: 'Resources',     value: counts.resources,  href: '/pm/resources' },
    { label: 'Time Tracking', value: counts.time,       href: '/pm/time-tracking' },
    { label: 'Budgets',       value: counts.budgets,    href: '/pm/budgets' },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={kpis} />
    </div>
  );
}
