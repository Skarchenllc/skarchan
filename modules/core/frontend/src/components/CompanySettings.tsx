'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { companyAPI } from '@/lib/api';
import { resizeLogo } from '@/components/ai/kit';

// The tenant's identity. Edited here, surfaced in the app shell and on
// generated documents (invoices, bills, payslips, mail).
type Profile = {
  org_code?: string;
  org_name: string;
  legal_name: string;
  org_description: string;
  industry: string;
  business_type: string;
  company_size: string;
  logo_url: string;
  primary_color: string;
  currency_code: string;
  timezone: string;
  tax_id: string;
  registration_number: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  website: string;
  custom_domain: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  footer_note: string;
};

const EMPTY: Profile = {
  org_name: '', legal_name: '', org_description: '', industry: '', business_type: '',
  company_size: '', logo_url: '', primary_color: '', currency_code: 'USD', timezone: 'UTC',
  tax_id: '', registration_number: '', primary_contact_name: '', primary_contact_email: '',
  primary_contact_phone: '', website: '', custom_domain: '', street: '', city: '', state: '',
  postal_code: '', country: '', footer_note: '',
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD', 'JPY', 'CNY'];

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="pt-2">
      <div className="mb-3">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        {hint && <div className="text-xs text-gray-500">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export default function CompanySettings({
  onMessage,
  onSaved,
}: {
  onMessage: (m: { type: 'success' | 'error'; text: string } | null) => void;
  onSaved?: (p: Profile) => void;
}) {
  const [p, setP] = useState<Profile>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    companyAPI
      .get()
      .then((r) => setP({ ...EMPTY, ...r.data }))
      .catch(() => onMessage({ type: 'error', text: 'Could not load company profile.' }))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setP((prev) => ({ ...prev, [k]: e.target.value }));

  const pickLogo = async (file: File) => {
    try {
      const dataUrl = await resizeLogo(file, 320);
      setP((prev) => ({ ...prev, logo_url: dataUrl }));
    } catch (err: any) {
      onMessage({ type: 'error', text: err?.message || 'Could not read that image.' });
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    onMessage(null);
    try {
      const { org_code, ...payload } = p;
      const r = await companyAPI.update(payload);
      const saved = { ...EMPTY, ...r.data };
      setP(saved);
      onSaved?.(saved);
      // Let the app shell refresh its brand without a reload.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('company-changed', { detail: saved }));
      }
      onMessage({ type: 'success', text: 'Company profile saved.' });
    } catch {
      onMessage({ type: 'error', text: 'Failed to save company profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <Card title="Company"><div className="py-8 text-center text-gray-500">Loading…</div></Card>;
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card title="Company Identity">
        {/* Logo + name header */}
        <div className="flex items-start gap-5 mb-6">
          <div className="shrink-0">
            <label className="block cursor-pointer group" title="Upload logo">
              <div
                className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:border-blue-400 transition-colors"
              >
                {p.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo_url} alt="Company logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400 text-center px-2">Click to<br />upload logo</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickLogo(f); e.target.value = ''; }}
              />
            </label>
            {p.logo_url && (
              <button
                type="button"
                onClick={() => setP((prev) => ({ ...prev, logo_url: '' }))}
                className="mt-2 text-xs text-gray-500 hover:text-red-600 w-28 text-center"
              >
                Remove logo
              </button>
            )}
          </div>
          <div className="flex-1 space-y-4">
            <Input label="Company Name" value={p.org_name} onChange={set('org_name')} placeholder="Acme Inc." required />
            <Input label="Legal / Registered Name" value={p.legal_name} onChange={set('legal_name')} placeholder="Acme Incorporated LLC" helperText="Shown on invoices and legal documents" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Industry" value={p.industry} onChange={set('industry')} placeholder="Software" />
          <Input label="Business Type" value={p.business_type} onChange={set('business_type')} placeholder="LLC / Pvt Ltd" />
          <Input label="Company Size" value={p.company_size} onChange={set('company_size')} placeholder="1-10, 11-50, 51-200…" />
          <Input label="Website" value={p.website} onChange={set('website')} placeholder="https://acme.com" />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={p.org_description}
            onChange={set('org_description')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What your company does — appears on some documents."
          />
        </div>
      </Card>

      <Card title="Address">
        <div className="space-y-4">
          <Input label="Street" value={p.street} onChange={set('street')} placeholder="123 Market St, Suite 400" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" value={p.city} onChange={set('city')} />
            <Input label="State / Province" value={p.state} onChange={set('state')} />
            <Input label="Postal Code" value={p.postal_code} onChange={set('postal_code')} />
            <Input label="Country" value={p.country} onChange={set('country')} />
          </div>
        </div>
      </Card>

      <Card title="Contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Contact Name" value={p.primary_contact_name} onChange={set('primary_contact_name')} />
          <Input label="Contact Email" type="email" value={p.primary_contact_email} onChange={set('primary_contact_email')} placeholder="billing@acme.com" />
          <Input label="Contact Phone" value={p.primary_contact_phone} onChange={set('primary_contact_phone')} />
          <Input label="Custom Domain" value={p.custom_domain} onChange={set('custom_domain')} placeholder="app.acme.com" />
        </div>
      </Card>

      <Card title="Finance & Legal">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
            <select
              value={p.currency_code}
              onChange={(e) => setP((prev) => ({ ...prev, currency_code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Timezone" value={p.timezone} onChange={set('timezone')} placeholder="UTC, Asia/Karachi…" />
          <Input label="Tax / VAT ID" value={p.tax_id} onChange={set('tax_id')} placeholder="Shown on invoices" />
          <Input label="Registration No." value={p.registration_number} onChange={set('registration_number')} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Footer Note</label>
          <textarea
            value={p.footer_note}
            onChange={set('footer_note')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Thank you for your business. Payment due within 30 days."
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>Save Company Profile</Button>
      </div>
    </form>
  );
}
