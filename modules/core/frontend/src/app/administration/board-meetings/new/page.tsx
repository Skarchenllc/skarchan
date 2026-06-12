'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useRouter } from 'next/navigation';

export default function NewBoardMeetingPage() {
  const router = useRouter();
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">New Board Meetings & Minutes</h1>
      <DynamicEntityForm
        entityType="board_meetings"
        onSave={() => router.push('/administration/board-meetings')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
