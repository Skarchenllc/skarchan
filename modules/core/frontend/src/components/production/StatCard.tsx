import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

export default function StatCard({ title, value, icon: Icon, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-black">{value}</p>
        </div>
        <div className="p-3 rounded-lg">
          <Icon className="w-5 h-5 text-gray-900" />
        </div>
      </div>
    </div>
  );
}
