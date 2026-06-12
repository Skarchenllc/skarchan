'use client';

import EntityList from '@shared/components/EntityList';

export default function EmailTemplatesListPage() {
  return (
    <EntityList
      entityType="marketing_email_templates"
      title="Email Templates"
      newPath="/marketing/email-templates/new"
    />
  );
}
