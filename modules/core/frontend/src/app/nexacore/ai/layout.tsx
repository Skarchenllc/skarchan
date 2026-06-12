'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import HealthBanner from '@/components/ai/HealthBanner';

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-6">
          <HealthBanner />
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
