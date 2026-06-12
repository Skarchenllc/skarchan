// Shared status badge component
import { getStatusBadgeClasses } from '@/utils/hr/compensationHelpers';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClasses(status)} ${className}`}>
      {status}
    </span>
  );
}
