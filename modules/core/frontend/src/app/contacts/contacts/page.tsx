'use client';

import EntityList from '@shared/components/EntityList';

export default function ContactsListPage() {
  return (
    <EntityList
      entityType="contacts"
      title="Contacts"
      newPath="/contacts/contacts/new"
    />
  );
}
