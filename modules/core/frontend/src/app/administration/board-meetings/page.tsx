'use client';

import EntityList from '@shared/components/EntityList';

export default function BoardMeetingListPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EntityList
        entityType="board_meetings"
        title="Board Meetings & Minutes"
        newPath="/administration/board-meetings/new"
      />
    </div>
  );
}
