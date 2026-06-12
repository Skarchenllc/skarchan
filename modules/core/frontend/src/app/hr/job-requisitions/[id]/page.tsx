'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Calendar, Users, Plus, Edit } from 'lucide-react';
import Navigation from '@/components/hr/Navigation';
import { api } from '@/lib/hr/api';

interface JobRequisition {
  id: string;
  job_title: string;
  department?: string;
  location?: string;
  employment_type?: string;
  status?: string;
  positions?: number;
  salary_range_min?: number;
  salary_range_max?: number;
  posted_date?: string;
  closing_date?: string;
  job_summary?: string;
}

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  current_stage?: string;
  applied_date?: string;
  job_id?: string;
  job_requisition_id?: string;
}

const PHASES = [
  { key: 'NEW', label: 'New' },
  { key: 'SCREENING', label: 'Screening' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'OFFER', label: 'Offer' },
  { key: 'HIRED', label: 'Hired' },
];

const STATUS_BADGE: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  SCREENING: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-amber-100 text-amber-700',
  OFFER: 'bg-purple-100 text-purple-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function JobRequisitionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [req, setReq] = useState<JobRequisition | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyApplicantId, setBusyApplicantId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      let reqData: any = null;
      try {
        const r = await api.job_requisitions.get(id);
        reqData = r.data;
      } catch {
        // Legacy records may live in entity_records (created during the brief
        // window when DynamicEntityForm wrote to the generic store).
        try {
          const r = await fetch(`/api/v1/development/entity-records/${id}`).then(x => x.json());
          const rec = r?.data || r;
          reqData = rec?.data ? { id: rec.id, ...rec.data } : rec;
        } catch {
          reqData = null;
        }
      }
      setReq(reqData);

      try {
        const a = await api.applicants.list({ job_id: id, limit: 200 } as any);
        const list = Array.isArray(a.data) ? a.data : ((a.data as any)?.data || []);
        setApplicants(list as Applicant[]);
      } catch {
        setApplicants([]);
      }
    } catch (err) {
      console.error('Failed to load requisition:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const advance = async (applicant: Applicant, nextStatus: string) => {
    try {
      setBusyApplicantId(applicant.id);
      await api.applicants.updateStatus(applicant.id, nextStatus);
      await load();
    } catch (err: any) {
      console.error('Status update failed:', err);
      alert(`Couldn't change status: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setBusyApplicantId(null);
    }
  };

  const byPhase: Record<string, Applicant[]> = {};
  for (const p of PHASES) byPhase[p.key] = [];
  byPhase['REJECTED'] = [];
  for (const a of applicants) (byPhase[a.status] ||= []).push(a);

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 text-gray-500">Loading…</div>
        </div>
      </>
    );
  }

  if (!req) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <Link href="/hr/job-requisitions" className="text-blue-600 hover:underline">← Back to Job Requisitions</Link>
            <p className="mt-4 text-red-700">Requisition not found.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <Link href="/hr/job-requisitions" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Job Requisitions
          </Link>

          {/* Header card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">{req.job_title}</h1>
                  {req.status && (
                    <span className={`text-xs px-2 py-1 rounded ${STATUS_BADGE[req.status?.toUpperCase()] || 'bg-gray-100 text-gray-700'}`}>
                      {req.status}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {req.department && <span>{req.department}</span>}
                  {req.location && (<><span>•</span><span><MapPin className="inline w-4 h-4" /> {req.location}</span></>)}
                  {req.employment_type && (<><span>•</span><span>{req.employment_type.replace(/_/g, ' ')}</span></>)}
                  {req.positions && (<><span>•</span><span>{req.positions} {req.positions === 1 ? 'position' : 'positions'}</span></>)}
                </div>
                {(req.salary_range_min || req.salary_range_max) && (
                  <p className="text-sm text-gray-700 mt-3">
                    <DollarSign className="inline w-4 h-4" /> {req.salary_range_min?.toLocaleString()} – {req.salary_range_max?.toLocaleString()}
                  </p>
                )}
                {req.posted_date && (
                  <p className="text-xs text-gray-500 mt-2">
                    <Calendar className="inline w-3 h-3 mr-1" />Posted {req.posted_date}{req.closing_date ? ` · Closes ${req.closing_date}` : ''}
                  </p>
                )}
                {req.job_summary && (
                  <p className="text-sm text-gray-700 mt-4 whitespace-pre-line">{req.job_summary}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <Link
                  href={`/hr/applicants/new?job_requisition_id=${id}`}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Add Applicant
                </Link>
                <Link
                  href={`/hr/job-requisitions/${id}/edit`}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" /> Edit
                </Link>
              </div>
            </div>
          </div>

          {/* Applicant pipeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Applicants
              <span className="text-sm font-normal text-gray-500">({applicants.length})</span>
            </h2>

            {applicants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applicants yet. <Link href={`/hr/applicants/new?job_requisition_id=${id}`} className="text-blue-600 hover:underline">Add the first applicant →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {PHASES.map((phase, idx) => (
                  <div key={phase.key} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                        {phase.label}
                        <span className="text-xs text-gray-500">{(byPhase[phase.key] || []).length}</span>
                      </h3>
                    </div>
                    <div className="p-2 space-y-2 min-h-[120px] bg-white">
                      {(byPhase[phase.key] || []).map(a => {
                        const nextPhase = PHASES[idx + 1]?.key;
                        return (
                          <div key={a.id} className="border border-gray-200 rounded p-2 text-sm">
                            <Link href={`/hr/applicants/${a.id}`} className="font-medium text-gray-900 hover:underline">
                              {a.name}
                            </Link>
                            <p className="text-xs text-gray-600">{a.email}</p>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {nextPhase && (
                                <button
                                  type="button"
                                  onClick={() => advance(a, nextPhase)}
                                  disabled={busyApplicantId === a.id}
                                  className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                >
                                  → {PHASES[idx + 1].label}
                                </button>
                              )}
                              {a.status !== 'REJECTED' && a.status !== 'HIRED' && (
                                <button
                                  type="button"
                                  onClick={() => advance(a, 'REJECTED')}
                                  disabled={busyApplicantId === a.id}
                                  className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {byPhase['REJECTED']?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Rejected</h3>
                <div className="flex flex-wrap gap-2">
                  {byPhase['REJECTED'].map(a => (
                    <Link
                      key={a.id}
                      href={`/hr/applicants/${a.id}`}
                      className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                    >
                      {a.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
