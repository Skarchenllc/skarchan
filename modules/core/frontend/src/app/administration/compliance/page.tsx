'use client';

import { useState } from 'react';
import EntityList from '@shared/components/EntityList';

type Tab = 'policies' | 'audits';

/**
 * Compliance — combines Policies and Audits under one tabbed view.
 * No outer wrapper/heading: the module banner above already announces
 * the section, and each EntityList renders its own sub-heading.
 */
export default function CompliancePage() {
  const [tab, setTab] = useState<Tab>('policies');

  return (
    <>
      <div className="flex gap-3 mb-3 px-4 text-sm">
        <button
          type="button"
          onClick={() => setTab('policies')}
          className="px-3 py-2"
          style={tab === 'policies'
            ? { borderBottom: '2px solid #5147e6', fontWeight: 600 }
            : {}}
        >
          Policies
        </button>
        <button
          type="button"
          onClick={() => setTab('audits')}
          className="px-3 py-2"
          style={tab === 'audits'
            ? { borderBottom: '2px solid #5147e6', fontWeight: 600 }
            : {}}
        >
          Audits
        </button>
      </div>

      {tab === 'policies' && (
        <EntityList
          entityType="compliance_policies"
          title="Policies"
          newPath="/administration/compliance-policies/new"
        />
      )}
      {tab === 'audits' && (
        <EntityList
          entityType="compliance_audits"
          title="Audits"
          newPath="/administration/compliance-audits/new"
        />
      )}
    </>
  );
}
