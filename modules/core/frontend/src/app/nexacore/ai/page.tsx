'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { getJSON } from '@/components/ai/kit';

// Overview — a guide catalogue of every AI & Automation workflow, grouped by
// job-to-be-done. Each entry's explanation (with an example) is collapsible.
export default function AiOverviewPage() {
  const [status, setStatus] = useState<any>(null);
  const [counts, setCounts] = useState<{ inbox: number; pending: number }>({ inbox: 0, pending: 0 });
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const [st, ib, pd] = await Promise.all([
        getJSON('/api/v1/ai/status'),
        getJSON('/api/v1/ai/insights?include_acknowledged=false&limit=50'),
        getJSON('/api/v1/ai/pending?limit=50'),
      ]);
      setStatus(st);
      setCounts({ inbox: (ib?.data || []).length, pending: (pd?.data || []).length });
    })();
  }, []);

  const toReview = counts.inbox + counts.pending;
  const keyOn = !!status?.key?.configured;
  const keyMasked = status?.key?.masked;

  const GROUPS = useMemo(() => ([
    {
      group: 'Your team',
      blurb: 'Run a company of AI staff — a CEO, department heads, managers and section experts.',
      items: [
        { title: 'Team', href: '/nexacore/ai/team',
          desc: 'Your AI org chart. Hire a worker for a role, then “train” them on one screen — give them a character (persona), choose what they can do (skills), and set how much you trust them to act (suggest only / needs approval / acts on its own). This single page is where you set everything up; it replaces the old separate Workers, Capabilities and Sections screens.',
          example: 'Open the HR department → train “Taylor Brooks”, the HR Manager: a careful, compliance-minded persona, the skills to flag risks and draft records, and “Needs my approval” trust until you’re confident.' },
      ],
    },
    {
      group: 'Meeting room',
      blurb: 'Talk to your team — you only ever instruct the CEO and managers; they pass it down.',
      items: [
        { title: 'Meeting Room', href: '/nexacore/ai/boardroom',
          desc: 'Where you instruct the team. Brief the CEO for company-wide work or talk to a manager directly — the team meets, seniors instruct their staff down the chain, and the experts execute. The cascade is shown as a meeting transcript; anything they want to change waits for your sign-off in Approvals.',
          example: 'Tell the CEO “tighten financial controls and chase stalled deals” → watch Casey brief the department heads, who instruct their managers, who task their experts — with any changes queued for your approval.' },
        { title: 'Hiring Pipeline', href: '/hr/recruitment', meta: 'in HR module', metaTone: 'slate',
          desc: 'A stage-by-stage hiring pipeline driven by the HR manager and its specialists: Requisition → Advertisement → Shortlist → Interview → Background check → Offer. Each stage is drafted by its specialist; you approve to create the record and unlock the next stage. Lives under the HR module → Recruitment.',
          example: 'Start a hire for “Senior Backend Engineer” → the Job Requisitions Specialist drafts the requisition; approve it and the Advertisements Specialist drafts the ad referencing it, and so on through to the offer.' },
      ],
    },
    {
      group: 'Approvals',
      blurb: 'What your team brings you to sign off — one list, nothing changes until you approve it.',
      items: [
        { title: 'Approvals', href: '/nexacore/ai/review', meta: toReview ? `${toReview} to review` : undefined, metaTone: 'red',
          desc: 'One unified list of everything your team wants your okay on. Each item is tagged with where it came from — an Alert or Briefing they surfaced (acknowledge), a Proposed change to a record (approve/reject), or a Queued action (approve/reject). Nothing is written to your records until you approve it. You can also ask the team to run scans + briefings on demand.',
          example: 'A high-risk alert that 3 opportunities have stalled past their close date, an AI proposal to fix a status typed “In Progress” → “in_progress”, and a queued “summarize new lead” job — all in one list, each with Approve / Reject (or Acknowledge).' },
      ],
    },
    {
      group: 'Standing orders',
      blurb: 'Rules your team follows automatically when records change.',
      items: [
        { title: 'Automations', href: '/nexacore/automation',
          desc: 'Standing orders: trigger → condition → action rules that fire on record changes. Actions can set a field, create an activity, send email, enrol a journey, or hand work to an AI worker.',
          example: 'When a Lead’s status changes to “Qualified” → create a follow-up task and send the welcome email. Or: when an Opportunity is created → have the AI summarize it into its notes.' },
      ],
    },
    {
      group: 'Settings',
      blurb: 'Company-wide controls — the master switch, budget, and trust policy.',
      items: [
        { title: 'API Key', meta: keyOn ? 'Configured' : 'Not set', metaTone: keyOn ? 'green' : 'red',
          desc: 'The Anthropic API key the whole team uses to think. It is read from the backend environment (ANTHROPIC_API_KEY) so it stays secret. When set, the team can work; when missing, AI calls fail with a clear message.',
          example: keyOn
            ? `Currently set (${keyMasked || 'sk-ant-…'}). To rotate it, change ANTHROPIC_API_KEY in the backend .env and restart the core-backend service.`
            : 'Not set — add ANTHROPIC_API_KEY=sk-ant-… to the backend .env and restart core-backend to put the team to work.' },
        { title: 'Settings', href: '/nexacore/ai/governance',
          desc: 'Company-wide guardrails: the master on/off switch for the whole team, a monthly spend budget, who may approve work, and the confidence × risk policy that decides what the team applies automatically versus what waits for your review.',
          example: 'Cap spend at $50 / month, require admins to approve changes, and set the policy to “Review everything” so nothing the team does applies without a person signing off.' },
      ],
    },
    {
      group: 'Work log',
      blurb: 'What the team did, what it cost, and how to undo it. One page, three tabs.',
      items: [
        { title: 'Usage & Spend', href: '/nexacore/ai/activity',
          desc: 'Work-log tab 1 — what the team cost: budget vs. spend, a 14-day trend, breakdowns by department / skill / model, and a per-run log of every AI call with its tokens, latency and outcome.',
          example: 'See that “risk scanning” is your top spend this month, spot the runs that failed on low credit, and watch month-to-date spend against your budget cap.' },
        { title: 'Run History', href: '/nexacore/ai/activity?tab=runs',
          desc: 'Work-log tab 2 — every standing order (automation) that fired, with its trigger, action and result. The complete audit trail of automated behaviour, filterable by status and action.',
          example: '“Welcome new leads” fired on 8 records; each row shows the rule, the action taken, and success / failure.' },
        { title: 'Action Ledger', href: '/nexacore/ai/activity?tab=ledger',
          desc: 'Work-log tab 3 — a reversible record of every change the team applied, with before/after state. Undo any entry to restore a field or remove a created record.',
          example: 'Undo the AI’s summary write-back on the “George Evans” lead — the field reverts to its previous value; undo a “create activity” action and the created task is removed.' },
      ],
    },
  ]), [toReview, keyOn, keyMasked]);

  const allKeys = useMemo(() => GROUPS.flatMap((g) => g.items.map((i) => i.title)), [GROUPS]);
  const allOpen = allKeys.length > 0 && allKeys.every((k) => open[k]);
  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    allKeys.forEach((k) => { next[k] = !allOpen; });
    setOpen(next);
  };

  const toneStyle = (tone?: string) =>
    tone === 'green' ? { backgroundColor: '#dcfce7', color: '#166534' }
      : tone === 'red' ? { backgroundColor: '#fee2e2', color: '#991b1b' }
        : { backgroundColor: '#f1f5f9', color: '#475569' };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-700 leading-relaxed max-w-4xl">
          Think of this as running a <strong>company of AI staff</strong>. You hire a <strong>CEO, department heads, managers
          and section experts</strong>, and <strong>train</strong> each one on the <a className="underline" href="/nexacore/ai/team" style={{ color: '#5147e6' }}>Team</a> page —
          their character, what they can do, and how much you trust them to act. You instruct them in the
          <a className="underline" href="/nexacore/ai/boardroom" style={{ color: '#5147e6' }}> Meeting Room</a> (you only ever talk to the
          CEO and managers; they pass it down), and anything they want to change comes back to you in
          <a className="underline" href="/nexacore/ai/review" style={{ color: '#5147e6' }}> Approvals</a> — nothing touches your data until you sign off.
          You can give the team <strong>standing orders</strong> (automations), cap their spend with a <strong>budget</strong>, and
          see everything they did — with full <strong>undo</strong> — in the <strong>Work Log</strong>. Trusted workers can earn the
          right to act on their own over time.
        </p>
        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Click a name to open it, or the chevron to read what each one does.</p>
          <button onClick={toggleAll} className="text-xs font-semibold whitespace-nowrap" style={{ color: '#5147e6' }}>
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      {GROUPS.map((g) => (
        <section key={g.group} className="px-1">
          <div className="mb-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5147e6' }}>{g.group}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{g.blurb}</p>
          </div>
          <div className="border-t border-gray-100 pl-2">
            {g.items.map((it) => {
              const isOpen = !!open[it.title];
              return (
                <div key={it.title} className="border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-2 py-2.5">
                    <button
                      onClick={() => setOpen((p) => ({ ...p, [it.title]: !p[it.title] }))}
                      className="p-0.5 -ml-0.5 text-gray-400 hover:text-gray-600 shrink-0"
                      aria-expanded={isOpen} aria-label={isOpen ? 'Collapse' : 'Expand'}
                    >
                      {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                    </button>
                    {(it as any).href
                      ? <Link href={(it as any).href} className="text-sm font-semibold hover:underline" style={{ color: '#5147e6' }}>{it.title}</Link>
                      : <span className="text-sm font-semibold" style={{ color: '#5147e6' }}>{it.title}</span>}
                    {it.meta && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={toneStyle((it as any).metaTone)}>{it.meta}</span>
                    )}
                  </div>
                  {isOpen && (
                    <div className="pl-6 pr-2 pb-3 -mt-0.5 space-y-2">
                      <p className="text-sm text-gray-500 leading-relaxed">{it.desc}</p>
                      <p className="text-xs text-gray-500 leading-relaxed rounded px-3 py-2" style={{ backgroundColor: '#f8fafc', borderLeft: '2px solid #c7d2fe' }}>
                        <span className="font-semibold" style={{ color: '#5147e6' }}>Example — </span>{it.example}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
