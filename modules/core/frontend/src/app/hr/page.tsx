'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle, AlertCircle, Bell, Users } from 'lucide-react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';
import DashboardCard from '@shared/components/DashboardCard';

type Rec = { id: string; data: any };

const fetchEntity = async (entityType: string): Promise<Rec[]> => {
  try {
    const r = await fetch(`/api/v1/development/entity-records?entity_type=${entityType}&limit=1000`);
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : (j.data || []);
  } catch { return []; }
};

const fmtMillions = (n: number) =>
  `$${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;

const monthLabel = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleString(undefined, { month: 'short', year: '2-digit' });

const todayISO = () => new Date().toISOString().slice(0, 10);

// ─── Inline SVG chart primitives (no external deps) ──────────────

function VBarChart({ rows, height = 160, color = '#5147e6', valueLabel }: {
  rows: { label: string; value: number }[];
  height?: number;
  color?: string;
  valueLabel?: (v: number) => string;
}) {
  const max = Math.max(...rows.map(r => r.value), 1);
  const W = 360, H = height, padBottom = 22, padTop = 18;
  const barW = (W - 16) / rows.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {/* baseline */}
      <line x1={0} x2={W} y1={H - padBottom} y2={H - padBottom} stroke="#e5e7eb" />
      {rows.map((r, i) => {
        const h = ((H - padBottom - padTop) * r.value) / max;
        const x = 8 + i * barW;
        const y = H - padBottom - h;
        return (
          <g key={r.label}>
            <rect x={x + 4} y={y} width={barW - 8} height={h} fill={color} />
            {r.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                style={{ fontSize: 10, fill: '#0f172a', fontWeight: 600 }}>
                {valueLabel ? valueLabel(r.value) : r.value}
              </text>
            )}
            <text x={x + barW / 2} y={H - 6} textAnchor="middle"
              style={{ fontSize: 10, fill: '#6b7280' }}>
              {r.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineGraph({ rows, height = 160 }: {
  rows: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...rows.map(r => r.value), 1);
  const W = 360, H = height, padBottom = 22, padTop = 18, padLeft = 8;
  const stepX = (W - padLeft * 2) / Math.max(rows.length - 1, 1);
  const pts = rows.map((r, i) => {
    const x = padLeft + i * stepX;
    const y = H - padBottom - ((H - padBottom - padTop) * r.value) / max;
    return { x, y, ...r };
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <line x1={0} x2={W} y1={H - padBottom} y2={H - padBottom} stroke="#e5e7eb" />
      <path d={path} fill="none" stroke="#5147e6" strokeWidth={2} />
      {pts.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={3} fill="#5147e6" />
          <text x={p.x} y={p.y - 7} textAnchor="middle"
            style={{ fontSize: 10, fill: '#0f172a', fontWeight: 600 }}>
            {p.value > 0 ? p.value : ''}
          </text>
          <text x={p.x} y={H - 6} textAnchor="middle"
            style={{ fontSize: 10, fill: '#6b7280' }}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Donut({ rows, size = 150 }: {
  rows: { label: string; value: number }[];
  size?: number;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (total === 0) return <div className="text-xs italic text-center py-6" style={{ color: '#6b7280' }}>No data</div>;
  // Navy + a couple of darker/lighter tones from the same family
  const PALETTE = ['#5147e6', '#1e3a72', '#3d5a99', '#5a7ab8', '#7896d1', '#a6b7dc', '#cbd5e1'];
  const r = size / 2;
  const inner = r * 0.6;
  let acc = 0;
  const slices = rows.map((row, i) => {
    const angle = (row.value / total) * Math.PI * 2;
    const x1 = r + r * Math.sin(acc);
    const y1 = r - r * Math.cos(acc);
    const x2 = r + r * Math.sin(acc + angle);
    const y2 = r - r * Math.cos(acc + angle);
    const xi1 = r + inner * Math.sin(acc + angle);
    const yi1 = r - inner * Math.cos(acc + angle);
    const xi2 = r + inner * Math.sin(acc);
    const yi2 = r - inner * Math.cos(acc);
    const large = angle > Math.PI ? 1 : 0;
    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${xi1} ${yi1}`,
      `A ${inner} ${inner} 0 ${large} 0 ${xi2} ${yi2}`,
      'Z',
    ].join(' ');
    acc += angle;
    return { d, color: PALETTE[i % PALETTE.length], label: row.label, value: row.value, pct: (row.value / total) * 100 };
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map(s => <path key={s.label} d={s.d} fill={s.color} />)}
      </svg>
      <ul className="text-xs space-y-1 flex-1 min-w-0">
        {slices.map(s => (
          <li key={s.label} className="flex items-center gap-2">
            <span style={{ display: 'inline-block', width: 8, height: 8, backgroundColor: s.color, flexShrink: 0 }} />
            <span className="truncate flex-1" style={{ color: '#0f172a' }}>{s.label}</span>
            <span style={{ color: '#6b7280' }}>{s.value} ({s.pct.toFixed(0)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export default function HrDashboardPage() {
  const [employees, setEmployees] = useState<Rec[]>([]);
  const [leaveReqs, setLeaveReqs] = useState<Rec[]>([]);
  const [reviews,   setReviews]   = useState<Rec[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      const [emp, leave, perf] = await Promise.all([
        fetchEntity('employees'),
        fetchEntity('leave_requests'),
        fetchEntity('performance_reviews'),
      ]);
      setEmployees(emp);
      setLeaveReqs(leave);
      setReviews(perf);
      setLoading(false);
    })();
  }, []);

  const get = (r: Rec, k: string) => r.data?.[k];
  const employeeName = (id?: string) => {
    if (!id) return 'Unknown';
    const e = employees.find(x => x.id === id);
    return e ? `${get(e, 'first_name') || ''} ${get(e, 'last_name') || ''}`.trim() || 'Unknown' : 'Unknown';
  };

  const today = todayISO();

  const onLeaveCount = employees.filter(e => get(e, 'employment_status') === 'on_leave').length;
  const deptCount    = new Set(employees.map(e => get(e, 'department') || get(e, 'department_id')).filter(Boolean)).size;
  const annualPayroll = employees.reduce((sum, e) => sum + (Number(get(e, 'salary')) || Number(get(e, 'base_salary')) || 0), 0);
  const pendingLeave = leaveReqs.filter(r => {
    const s = String(get(r, 'status') || '').toLowerCase();
    return s === 'pending';
  }).length;

  const hiresByMonth = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const e of employees) {
      const d = String(get(e, 'hire_date') || '').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(d)) continue;
      buckets[d] = (buckets[d] || 0) + 1;
    }
    const now = new Date();
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      months.push({ label: monthLabel(dt.getFullYear(), dt.getMonth()), value: buckets[key] || 0 });
    }
    return months;
  }, [employees]);

  const leaveByMonth = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const r of leaveReqs) {
      const d = String(get(r, 'start_date') || '').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(d)) continue;
      buckets[d] = (buckets[d] || 0) + (Number(get(r, 'total_days')) || 0);
    }
    const now = new Date();
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      months.push({ label: monthLabel(dt.getFullYear(), dt.getMonth()), value: buckets[key] || 0 });
    }
    return months;
  }, [leaveReqs]);

  const headcountByDept = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const e of employees) {
      const d = String(get(e, 'department') || get(e, 'department_id') || 'Unassigned');
      buckets[d] = (buckets[d] || 0) + 1;
    }
    return Object.entries(buckets)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [employees]);

  const ratingDist = useMemo(() => {
    const dist: Record<number, number> = {1:0, 2:0, 3:0, 4:0, 5:0};
    for (const r of reviews) {
      const n = Math.round(Number(get(r, 'overall_rating')) || 0);
      if (n >= 1 && n <= 5) dist[n]++;
    }
    return [1,2,3,4,5].map(n => ({ label: `${n}★`, value: dist[n] }));
  }, [reviews]);
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (Number(get(r, 'overall_rating')) || 0), 0) / reviews.length).toFixed(2)
    : '—';

  const kpis: KpiItem[] = [
    { label: 'Employees',      value: employees.length,             href: '/hr/employees' },
    { label: 'On Leave',       value: onLeaveCount, tone: onLeaveCount > 0 ? 'warning' : 'default' },
    { label: 'Departments',    value: deptCount,                    href: '/hr/departments' },
    { label: 'Annual Payroll', value: fmtMillions(annualPayroll) },
  ];

  const recentLeaves = [...leaveReqs]
    .sort((a, b) => (get(b, 'start_date') || '').localeCompare(get(a, 'start_date') || ''))
    .slice(0, 5);
  const upcomingLeaves = leaveReqs
    .filter(r => {
      const s = String(get(r, 'status') || '').toLowerCase();
      const start = get(r, 'start_date');
      return s === 'approved' && start && start > today;
    })
    .sort((a, b) => (get(a, 'start_date') || '').localeCompare(get(b, 'start_date') || ''))
    .slice(0, 5);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const s = (status || '').toLowerCase();
    const tone: Record<string, string> = {
      approved: '#012E14', pending: '#b45309', rejected: '#b91c1c', cancelled: '#6b7280',
    };
    return (
      <span
        className="px-2 py-0.5 text-xs font-semibold capitalize"
        style={{ color: tone[s] || '#6b7280', border: `1px solid ${tone[s] || '#9ca3af'}` }}
      >
        {status}
      </span>
    );
  };

  const LeaveRow = ({ r, showStartDate = false }: { r: Rec; showStartDate?: boolean }) => (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">
          {get(r, 'employee_name') || employeeName(get(r, 'employee_id'))}
        </div>
        <div className="text-xs" style={{ color: '#6b7280' }}>
          {get(r, 'leave_type') || '—'} · {get(r, 'total_days') || 0} day{(get(r, 'total_days') || 0) === 1 ? '' : 's'}
          {showStartDate && <> · starts {new Date(get(r, 'start_date')).toLocaleDateString()}</>}
        </div>
      </div>
      {showStartDate
        ? <Calendar className="w-4 h-4 shrink-0" style={{ color: '#5147e6' }} />
        : <StatusBadge status={String(get(r, 'status') || 'pending')} />}
    </div>
  );

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={kpis} />

      {/* Time-series row: vertical bars + line graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <DashboardCard
          title="Hires per Month"
          empty={hiresByMonth.every(m => m.value === 0)}
          emptyMessage="No hire dates recorded in the last 6 months."
        >
          <VBarChart rows={hiresByMonth} />
        </DashboardCard>

        <DashboardCard
          title="Leave Days per Month"
          empty={leaveByMonth.every(m => m.value === 0)}
          emptyMessage="No leave activity in the last 6 months."
        >
          <LineGraph rows={leaveByMonth} />
        </DashboardCard>
      </div>

      {/* Distribution row: donut + vertical bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <DashboardCard
          title="Headcount by Department"
          viewAllHref="/hr/departments"
          empty={headcountByDept.length === 0}
          emptyMessage="No employees with a department assigned."
          emptyIcon={<Users className="w-8 h-8" />}
        >
          <Donut rows={headcountByDept} />
        </DashboardCard>

        <DashboardCard
          title="Performance Ratings"
          viewAllHref="/hr/performance-reviews"
          empty={reviews.length === 0}
          emptyMessage="No performance reviews recorded yet."
        >
          <div className="text-center mb-2">
            <div className="text-2xl font-bold" style={{ color: '#0f172a' }}>{avgRating}</div>
            <div className="text-xs" style={{ color: '#6b7280' }}>
              average rating · {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </div>
          </div>
          <VBarChart rows={ratingDist} height={120} />
        </DashboardCard>
      </div>

      {/* Tabular row: recent + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <DashboardCard
          title="Recent Leave Requests"
          viewAllHref="/hr/leaves"
          empty={recentLeaves.length === 0}
          emptyMessage="No leave requests submitted yet."
          emptyIcon={<Calendar className="w-8 h-8" />}
        >
          {recentLeaves.map(r => <LeaveRow key={r.id} r={r} />)}
        </DashboardCard>

        <DashboardCard
          title="Upcoming Leaves"
          viewAllHref="/hr/leaves"
          empty={upcomingLeaves.length === 0}
          emptyMessage="No upcoming approved leaves."
          emptyIcon={<CheckCircle className="w-8 h-8" />}
        >
          {upcomingLeaves.map(r => <LeaveRow key={r.id} r={r} showStartDate />)}
        </DashboardCard>
      </div>

      <DashboardCard
        title="Alerts & Notifications"
        empty={pendingLeave === 0}
        emptyMessage="All caught up — no pending actions."
        emptyIcon={<Bell className="w-8 h-8" />}
      >
        {pendingLeave > 0 && (
          <div className="flex items-start gap-3 py-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#b45309' }} />
            <Link href="/hr/leaves" className="text-sm font-semibold" style={{ color: '#5147e6' }}>
              {pendingLeave} leave request{pendingLeave === 1 ? '' : 's'} awaiting approval
            </Link>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
