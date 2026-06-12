'use client';

import EntityList from '@shared/components/EntityList';

export default function TeamMembersListPage() {
  return (
    <EntityList
      entityType="research_team_members"
      title="Team Members"
      newPath="/rd/team-members/new"
    />
  );
}
