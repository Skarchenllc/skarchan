'use client';

import { useParams } from 'next/navigation';
import DocumentBuilder from '@/components/DocumentBuilder';

export default function OrderBuilderPage() {
  const params = useParams();
  const id = String(params?.id || '');
  return <DocumentBuilder recordId={id} entityType="orders" backHref="/sales/builder" />;
}
