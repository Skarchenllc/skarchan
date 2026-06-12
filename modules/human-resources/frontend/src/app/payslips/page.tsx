'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function PayslipsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="payslips"
        title="Payslips"
        newPath="/payslips/new"
      />
    </>
  );
}
