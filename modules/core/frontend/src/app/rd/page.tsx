'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';

export default function RdDashboardPage() {
  const [counts, setCounts] = useState({
    projects: 0, experiments: 0, prototypes: 0, papers: 0, patents: 0,
    equipment: 0, members: 0, milestones: 0,
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
      const [p, e, pr, pa, pt, eq, m, ms] = await Promise.all([
        countOf('research_projects'),
        countOf('experiments'),
        countOf('prototypes'),
        countOf('research_papers'),
        countOf('patents'),
        countOf('lab_equipment'),
        countOf('team_members'),
        countOf('milestones'),
      ]);
      setCounts({ projects: p, experiments: e, prototypes: pr, papers: pa, patents: pt, equipment: eq, members: m, milestones: ms });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const kpis: KpiItem[] = [
    { label: 'Projects',        value: counts.projects,    href: '/rd/projects' },
    { label: 'Experiments',     value: counts.experiments, href: '/rd/experiments' },
    { label: 'Prototypes',      value: counts.prototypes,  href: '/rd/prototypes' },
    { label: 'Research Papers', value: counts.papers,      href: '/rd/research-papers' },
    { label: 'Patents',         value: counts.patents,     href: '/rd/patents' },
    { label: 'Lab Equipment',   value: counts.equipment,   href: '/rd/lab-equipment' },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={kpis} />
    </div>
  );
}
