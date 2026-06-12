'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, Briefcase, Check, X, Plus, ClipboardList, Shield, MessageSquare, FileText } from 'lucide-react';
import Navigation from '@/components/hr/Navigation';
import { api } from '@/lib/hr/api';

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  current_stage?: string;
  applied_date?: string;
  job_id?: string;
  job_requisition_id?: string;  // legacy alias
  resume_url?: string;
  cover_letter?: string;
  notes?: string;
}

interface Requisition {
  id: string;
  job_title: string;
  department?: string;
}

const PHASES = [
  { key: 'NEW', label: 'New', desc: 'Application received' },
  { key: 'SCREENING', label: 'Screening', desc: 'Resume review' },
  { key: 'INTERVIEW', label: 'Interview', desc: 'Technical / cultural' },
  { key: 'OFFER', label: 'Offer', desc: 'Offer extended' },
  { key: 'HIRED', label: 'Hired', desc: 'Joined the team' },
];

const PHASE_COLOR: Record<string, string> = {
  NEW: 'bg-gray-500',
  SCREENING: 'bg-blue-500',
  INTERVIEW: 'bg-amber-500',
  OFFER: 'bg-purple-500',
  HIRED: 'bg-green-500',
  REJECTED: 'bg-red-500',
};

const ASSESSMENT_TYPES = ['CODING_TEST', 'WRITTEN_TEST', 'APTITUDE_TEST', 'PERSONALITY_TEST', 'SKILL_TEST', 'CASE_STUDY'];
const BACKGROUND_CHECK_TYPES = ['CRIMINAL', 'EMPLOYMENT', 'EDUCATION', 'CREDIT', 'REFERENCE', 'IDENTITY'];
const INTERVIEW_TYPES = ['PHONE_SCREENING', 'VIDEO_INTERVIEW', 'IN_PERSON', 'TECHNICAL', 'PANEL', 'BEHAVIORAL', 'CASE_STUDY'];

export default function ApplicantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [requisition, setRequisition] = useState<Requisition | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [bgChecks, setBgChecks] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // inline create form state
  const [newAssessment, setNewAssessment] = useState({ open: false, assessment_type: 'CODING_TEST', title: '' });
  const [newBgCheck, setNewBgCheck] = useState({ open: false, check_type: 'EMPLOYMENT' });
  const [newInterview, setNewInterview] = useState({ open: false, interview_type: 'PHONE_SCREENING', scheduled_date: '' });
  const [newOffer, setNewOffer] = useState({ open: false, position_title: '', base_salary: '' });

  const load = async () => {
    setLoading(true);
    try {
      const aResp = await api.applicants.get(id);
      const a = aResp.data as Applicant;
      setApplicant(a);

      const jobId = a?.job_id || a?.job_requisition_id;
      if (jobId) {
        try {
          const rResp = await api.job_requisitions.get(jobId);
          setRequisition(rResp.data as Requisition);
        } catch {
          setRequisition(null);
        }
      }

      // Per-phase records, filtered by applicant
      const [as, bc, iv, of] = await Promise.all([
        api.assessments.list({ applicant_id: id }).catch(() => ({ data: [] })),
        api.background_checks.list({ applicant_id: id }).catch(() => ({ data: [] })),
        api.interviews.list({ applicant_id: id }).catch(() => ({ data: [] })),
        api.job_offers.list({ applicant_id: id }).catch(() => ({ data: [] })),
      ]);
      const unwrap = (r: any) => Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setAssessments(unwrap(as));
      setBgChecks(unwrap(bc));
      setInterviews(unwrap(iv));
      setOffers(unwrap(of));
    } catch (err) {
      console.error('Failed to load applicant:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const transition = async (next: string) => {
    if (!applicant) return;
    try {
      setBusy(true);
      await api.applicants.updateStatus(applicant.id, next);
      await load();
    } catch (err: any) {
      alert(`Status change failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const createAssessment = async () => {
    if (!(applicant?.job_id || applicant?.job_requisition_id) || !newAssessment.title) {
      alert('A linked job requisition and a title are required.');
      return;
    }
    try {
      await api.assessments.create({
        job_id: (applicant.job_id || applicant.job_requisition_id),
        applicant_id: applicant.id,
        assessment_type: newAssessment.assessment_type,
        title: newAssessment.title,
      });
      setNewAssessment({ open: false, assessment_type: 'CODING_TEST', title: '' });
      await load();
    } catch (err: any) {
      alert(`Failed: ${err?.response?.data?.detail || err.message}`);
    }
  };

  const createBgCheck = async () => {
    if (!(applicant?.job_id || applicant?.job_requisition_id)) return;
    try {
      await api.background_checks.create({
        job_id: (applicant.job_id || applicant.job_requisition_id),
        applicant_id: applicant.id,
        check_type: newBgCheck.check_type,
      });
      setNewBgCheck({ open: false, check_type: 'EMPLOYMENT' });
      await load();
    } catch (err: any) {
      alert(`Failed: ${err?.response?.data?.detail || err.message}`);
    }
  };

  const createInterview = async () => {
    if (!(applicant?.job_id || applicant?.job_requisition_id)) {
      alert('Applicant must be linked to a job requisition.');
      return;
    }
    try {
      const payload: any = {
        job_id: (applicant.job_id || applicant.job_requisition_id),
        applicant_id: applicant.id,
        interview_type: newInterview.interview_type,
      };
      if (newInterview.scheduled_date) payload.scheduled_date = newInterview.scheduled_date;
      await api.interviews.create(payload);
      setNewInterview({ open: false, interview_type: 'PHONE_SCREENING', scheduled_date: '' });
      await load();
    } catch (err: any) {
      alert(`Failed: ${err?.response?.data?.detail || err.message}`);
    }
  };

  const createOffer = async () => {
    if (!(applicant?.job_id || applicant?.job_requisition_id) || !newOffer.position_title || !newOffer.base_salary) {
      alert('Job requisition, position title, and base salary are required.');
      return;
    }
    try {
      await api.job_offers.create({
        job_id: (applicant.job_id || applicant.job_requisition_id),
        applicant_id: applicant.id,
        position_title: newOffer.position_title,
        base_salary: parseFloat(newOffer.base_salary),
      });
      setNewOffer({ open: false, position_title: '', base_salary: '' });
      await load();
    } catch (err: any) {
      alert(`Failed: ${err?.response?.data?.detail || err.message}`);
    }
  };

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-5xl mx-auto px-4 text-gray-500">Loading…</div>
        </div>
      </>
    );
  }

  if (!applicant) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-5xl mx-auto px-4">
            <Link href="/hr/applicants" className="text-blue-600 hover:underline">← Back to Applicants</Link>
            <p className="mt-4 text-red-700">Applicant not found.</p>
          </div>
        </div>
      </>
    );
  }

  const currentIdx = PHASES.findIndex(p => p.key === applicant.status);
  const isRejected = applicant.status === 'REJECTED';
  const isHired = applicant.status === 'HIRED';

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          <Link href="/hr/applicants" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Applicants
          </Link>

          {/* Applicant info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{applicant.name}</h1>
                {requisition && (
                  <p className="text-sm text-gray-600">
                    Applied for{' '}
                    <Link href={`/hr/job-requisitions/${requisition.id}`} className="text-blue-600 hover:underline">
                      <Briefcase className="inline w-3 h-3 mr-1" />
                      {requisition.job_title}
                    </Link>
                    {requisition.department && <span> · {requisition.department}</span>}
                  </p>
                )}
              </div>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-gray-500"><Mail className="inline w-4 h-4 mr-1" />Email</dt>
                <dd className="text-gray-900 mt-0.5">{applicant.email}</dd>
              </div>
              {applicant.phone && (
                <div>
                  <dt className="text-gray-500"><Phone className="inline w-4 h-4 mr-1" />Phone</dt>
                  <dd className="text-gray-900 mt-0.5">{applicant.phone}</dd>
                </div>
              )}
              {applicant.applied_date && (
                <div>
                  <dt className="text-gray-500">Applied</dt>
                  <dd className="text-gray-900 mt-0.5">{applicant.applied_date}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Phase tracker */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Pipeline Status</h2>
            {isRejected ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800 flex items-center gap-2">
                <X className="w-5 h-5" /> Rejected
                <button type="button" disabled={busy} onClick={() => transition('NEW')}
                  className="ml-auto text-xs px-2 py-1 rounded bg-white border border-red-300 hover:bg-red-100">
                  Reopen
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {PHASES.map((p, idx) => {
                  const reached = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={p.key} className="flex-1 flex items-center">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${reached ? PHASE_COLOR[p.key] : 'bg-gray-300'}`}>
                          {reached && idx < currentIdx ? <Check className="w-5 h-5" /> : idx + 1}
                        </div>
                        <p className={`text-xs mt-2 font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>{p.label}</p>
                      </div>
                      {idx < PHASES.length - 1 && (
                        <div className={`flex-1 h-0.5 ${idx < currentIdx ? PHASE_COLOR[PHASES[idx].key] : 'bg-gray-300'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-6 flex gap-2 justify-end">
              {!isRejected && !isHired && currentIdx < PHASES.length - 1 && (
                <button type="button" disabled={busy} onClick={() => transition(PHASES[currentIdx + 1].key)}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">
                  Advance to {PHASES[currentIdx + 1].label}
                </button>
              )}
              {!isRejected && !isHired && (
                <button type="button" disabled={busy} onClick={() => transition('REJECTED')}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50">
                  Reject
                </button>
              )}
            </div>
          </div>

          {/* PHASE 1: SCREENING */}
          <PhaseSection
            phaseKey="SCREENING"
            currentPhase={applicant.status}
            title="Phase 1 · Screening"
            icon={<ClipboardList className="w-5 h-5" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assessments */}
              <Sub title="Assessments" count={assessments.length}>
                {assessments.length === 0 && <p className="text-xs text-gray-500 italic">No assessments yet.</p>}
                {assessments.map(a => (
                  <Row key={a.id}>
                    <span className="font-medium">{a.title || a.assessment_type}</span>
                    <span className="text-xs text-gray-500">{a.assessment_type} · {a.status || 'pending'}</span>
                    {a.score != null && <span className="text-xs">Score: {a.score}</span>}
                  </Row>
                ))}
                {newAssessment.open ? (
                  <div className="mt-2 p-3 bg-gray-50 rounded space-y-2">
                    <select value={newAssessment.assessment_type}
                      onChange={(e) => setNewAssessment({ ...newAssessment, assessment_type: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                      {ASSESSMENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                    <input value={newAssessment.title}
                      onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                      placeholder="Title (e.g. Senior Backend Coding)"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
                    <div className="flex gap-2">
                      <button type="button" onClick={createAssessment}
                        className="flex-1 px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">Create</button>
                      <button type="button" onClick={() => setNewAssessment({ open: false, assessment_type: 'CODING_TEST', title: '' })}
                        className="flex-1 px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setNewAssessment({ ...newAssessment, open: true })}
                    className="mt-2 text-xs text-blue-600 hover:underline">+ Add assessment</button>
                )}
              </Sub>
              {/* Background Checks */}
              <Sub title="Background Checks" count={bgChecks.length}>
                {bgChecks.length === 0 && <p className="text-xs text-gray-500 italic">No background checks yet.</p>}
                {bgChecks.map(b => (
                  <Row key={b.id}>
                    <span className="font-medium">{b.check_type}</span>
                    <span className="text-xs text-gray-500">{b.status || 'pending'}</span>
                  </Row>
                ))}
                {newBgCheck.open ? (
                  <div className="mt-2 p-3 bg-gray-50 rounded space-y-2">
                    <select value={newBgCheck.check_type}
                      onChange={(e) => setNewBgCheck({ ...newBgCheck, check_type: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                      {BACKGROUND_CHECK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button type="button" onClick={createBgCheck}
                        className="flex-1 px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">Initiate</button>
                      <button type="button" onClick={() => setNewBgCheck({ open: false, check_type: 'EMPLOYMENT' })}
                        className="flex-1 px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setNewBgCheck({ ...newBgCheck, open: true })}
                    className="mt-2 text-xs text-blue-600 hover:underline">+ Initiate background check</button>
                )}
              </Sub>
            </div>
          </PhaseSection>

          {/* PHASE 2: INTERVIEW */}
          <PhaseSection
            phaseKey="INTERVIEW"
            currentPhase={applicant.status}
            title="Phase 2 · Interviews"
            icon={<MessageSquare className="w-5 h-5" />}
          >
            {interviews.length === 0 && <p className="text-sm text-gray-500 italic">No interviews scheduled.</p>}
            {interviews.map(iv => (
              <Row key={iv.id}>
                <span className="font-medium">{iv.interview_type?.replace(/_/g, ' ')}</span>
                <span className="text-xs text-gray-500">
                  {iv.scheduled_date || 'unscheduled'} · {iv.status || 'pending'}
                </span>
                {iv.outcome && <span className="text-xs">Outcome: {iv.outcome}</span>}
              </Row>
            ))}
            {newInterview.open ? (
              <div className="mt-2 p-3 bg-gray-50 rounded space-y-2">
                <select value={newInterview.interview_type}
                  onChange={(e) => setNewInterview({ ...newInterview, interview_type: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                  {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
                <input type="datetime-local" value={newInterview.scheduled_date}
                  onChange={(e) => setNewInterview({ ...newInterview, scheduled_date: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
                <div className="flex gap-2">
                  <button type="button" onClick={createInterview}
                    className="flex-1 px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">Schedule</button>
                  <button type="button" onClick={() => setNewInterview({ open: false, interview_type: 'PHONE_SCREENING', scheduled_date: '' })}
                    className="flex-1 px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded">Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setNewInterview({ ...newInterview, open: true })}
                className="mt-2 text-xs text-blue-600 hover:underline">+ Schedule interview</button>
            )}
          </PhaseSection>

          {/* PHASE 3: OFFER */}
          <PhaseSection
            phaseKey="OFFER"
            currentPhase={applicant.status}
            title="Phase 3 · Offer"
            icon={<FileText className="w-5 h-5" />}
          >
            {offers.length === 0 && <p className="text-sm text-gray-500 italic">No offers extended yet.</p>}
            {offers.map(o => (
              <Row key={o.id}>
                <span className="font-medium">{o.position_title}</span>
                <span className="text-xs text-gray-500">{o.status} · ${Number(o.base_salary || 0).toLocaleString()}</span>
              </Row>
            ))}
            {newOffer.open ? (
              <div className="mt-2 p-3 bg-gray-50 rounded space-y-2">
                <input value={newOffer.position_title}
                  onChange={(e) => setNewOffer({ ...newOffer, position_title: e.target.value })}
                  placeholder="Position title"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
                <input type="number" value={newOffer.base_salary}
                  onChange={(e) => setNewOffer({ ...newOffer, base_salary: e.target.value })}
                  placeholder="Base salary"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
                <div className="flex gap-2">
                  <button type="button" onClick={createOffer}
                    className="flex-1 px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">Draft Offer</button>
                  <button type="button" onClick={() => setNewOffer({ open: false, position_title: '', base_salary: '' })}
                    className="flex-1 px-3 py-1 text-xs text-gray-700 border border-gray-300 rounded">Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setNewOffer({ ...newOffer, open: true })}
                className="mt-2 text-xs text-blue-600 hover:underline">+ Draft offer</button>
            )}
          </PhaseSection>
        </div>
      </div>
    </>
  );
}

function PhaseSection({ phaseKey, currentPhase, title, icon, children }: {
  phaseKey: string; currentPhase: string; title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  const PHASE_ORDER = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];
  const isCurrent = currentPhase === phaseKey;
  const isPast = PHASE_ORDER.indexOf(currentPhase) > PHASE_ORDER.indexOf(phaseKey);
  return (
    <div className={`rounded-lg shadow p-6 ${isCurrent ? 'bg-blue-50 border-2 border-blue-300' : 'bg-white'}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={isCurrent ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-gray-400'}>{icon}</div>
        <h2 className={`text-lg font-semibold ${isCurrent ? 'text-blue-900' : isPast ? 'text-gray-900' : 'text-gray-500'}`}>{title}</h2>
        {isCurrent && <span className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white">Active</span>}
        {isPast && <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Completed</span>}
      </div>
      {children}
    </div>
  );
}

function Sub({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title} <span className="text-gray-400">({count})</span></h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-gray-50 rounded text-sm">
      {children}
    </div>
  );
}
