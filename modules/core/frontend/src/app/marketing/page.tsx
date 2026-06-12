'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';
import InsightsDashboard from '@/components/InsightsDashboard';

type Rec = { id: string; data: any };

const fetchEntity = async (entityType: string): Promise<Rec[]> => {
  try {
    const r = await fetch(`/api/v1/development/entity-records?entity_type=${entityType}&limit=1000`);
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : (j.data || []);
  } catch { return []; }
};

export default function MarketingDashboardPage() {
  const [campaigns, setCampaigns] = useState<Rec[]>([]);
  const [leads,     setLeads]     = useState<Rec[]>([]);
  const [content,   setContent]   = useState<Rec[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      const [c, l, ct] = await Promise.all([
        fetchEntity('campaigns'),
        fetchEntity('leads'),
        fetchEntity('contents'),
      ]);
      setCampaigns(c);
      setLeads(l);
      setContent(ct);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const get = (r: Rec, k: string) => r.data?.[k];
  const sum = (rows: Rec[], k: string) => rows.reduce((s, r) => s + (Number(get(r, k)) || 0), 0);

  const activeCampaigns = campaigns.filter(c => get(c, 'status') === 'Active' || get(c, 'status') === 'active').length;
  const qualifiedLeads  = leads.filter(l => get(l, 'status') === 'Qualified').length;
  const convertedLeads  = leads.filter(l => get(l, 'status') === 'Converted').length;
  const publishedContent = content.filter(c => get(c, 'status') === 'Published' || get(c, 'status') === 'published').length;
  const totalConversions = sum(campaigns, 'conversions');
  const totalViews       = sum(content, 'views');
  const totalShares      = sum(content, 'shares');
  const conversionPct = leads.length > 0
    ? ((convertedLeads / leads.length) * 100).toFixed(1) + '%'
    : '—';

  const countKpis: KpiItem[] = [
    { label: 'Campaigns',         value: campaigns.length,  href: '/marketing/campaigns' },
    { label: 'Active Campaigns',  value: activeCampaigns },
    { label: 'Leads',             value: leads.length,      href: '/marketing/leads' },
    { label: 'Qualified Leads',   value: qualifiedLeads },
    { label: 'Published Content', value: publishedContent,  href: '/marketing/content' },
    { label: 'Conversions',       value: totalConversions },
  ];

  const performanceKpis: KpiItem[] = [
    { label: 'Lead Conversion', value: conversionPct, hint: `${convertedLeads} of ${leads.length}` },
    { label: 'Content Views',   value: totalViews.toLocaleString() },
    { label: 'Content Shares',  value: totalShares.toLocaleString() },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={countKpis} />
      <ModuleKpis items={performanceKpis} />
      <InsightsDashboard scope="marketing" />
    </div>
  );
}
