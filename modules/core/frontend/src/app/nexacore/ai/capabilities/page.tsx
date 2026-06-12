'use client';

import { useEffect, useState } from 'react';
import { Cap, getJSON } from '@/components/ai/kit';

// Capability catalog — the reusable expert skills the gateway can run.
export default function CapabilitiesPage() {
  const [caps, setCaps] = useState<Cap[]>([]);
  useEffect(() => { getJSON('/api/v1/ai/capabilities').then((r) => setCaps(r?.data || [])); }, []);

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {caps.map((c) => (
        <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">{c.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}>{c.model_tier}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{c.description}</p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
            <span>Applies to: {c.applies_to.join(', ')}</span>
            <span>· default autonomy: {c.autonomy_default}</span>
            {c.structured && <span>· structured</span>}
            {c.persists && <span>· writes data</span>}
          </div>
        </div>
      ))}
      {caps.length === 0 && <div className="text-sm text-gray-400 py-10 text-center">Loading capabilities…</div>}
    </div>
  );
}
