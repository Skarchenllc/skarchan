'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';
import ModuleStatusCharts from '@/components/ModuleStatusCharts';

type Counts = {
  tickets: number;
  knowledge: number;
  requests: number;
  feedback: number;
  sla: number;
};

export default function CustomerServiceDashboardPage() {
  const [counts, setCounts] = useState<Counts>({
    tickets: 0, knowledge: 0, requests: 0, feedback: 0, sla: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stats endpoints aren't all wired yet — read counts straight from the
    // entity_records API for consistency with everything else in the system.
    const ORG = '00000000-0000-0000-0000-000000000000';
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
      const [t, k, s, f, sl] = await Promise.all([
        countOf('service_tickets'),
        countOf('knowledge_base'),
        countOf('service_requests'),
        countOf('customer_feedback'),
        countOf('sla_agreements'),
      ]);
      setCounts({ tickets: t, knowledge: k, requests: s, feedback: f, sla: sl });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const kpis: KpiItem[] = [
    { label: 'Support Tickets',  value: counts.tickets,   href: '/customer-service/support-tickets' },
    { label: 'Knowledge Base',   value: counts.knowledge, href: '/customer-service/knowledge-base' },
    { label: 'Service Requests', value: counts.requests,  href: '/customer-service/service-requests' },
    { label: 'Feedback',         value: counts.feedback,  href: '/customer-service/customer-feedback' },
    { label: 'SLA Agreements',   value: counts.sla,       href: '/customer-service/sla-agreements' },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={kpis} />
      <ModuleStatusCharts status={[{ title: 'Tickets by status', t: 'service_tickets' }]} />
    </div>
  );
}
