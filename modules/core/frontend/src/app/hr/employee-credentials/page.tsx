'use client';

import EntityList from '@shared/components/EntityList';

export default function EmployeeCredentialsListPage() {
  return (
    <EntityList
      entityType="employee_credentials"
      title="Employee Credentials"
      newPath="/hr/employee-credentials/new"
    />
  );
}
