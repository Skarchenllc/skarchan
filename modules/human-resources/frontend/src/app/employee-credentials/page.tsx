'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function EmployeeCredentialsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="employee_credentials"
        title="Employee Credentials"
        newPath="/employee-credentials/new"
      />
    </>
  );
}
