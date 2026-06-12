'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useParams, useRouter } from 'next/navigation';

export default function BoardMeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Board Meetings & Minutes</h1>
      <DynamicEntityForm
        entityType="board_meetings"
        entityId={id}
        onSave={() => router.push('/administration/board-meetings')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
