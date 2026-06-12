'use client';

import { useParams } from 'next/navigation';
import DocumentBuilder from '@/components/DocumentBuilder';

export default function QuoteBuilderPage() {
  const params = useParams();
  const id = String(params?.id || '');
  return <DocumentBuilder recordId={id} entityType="quotes" backHref="/sales/builder" />;
}
