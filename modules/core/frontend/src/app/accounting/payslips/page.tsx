'use client';

import EntityList from '@shared/components/EntityList';

export default function PayslipsListPage() {
  return (
    <EntityList
      entityType="payslips"
      title="Payslips"
      newPath="/accounting/payslips/new"
    />
  );
}
