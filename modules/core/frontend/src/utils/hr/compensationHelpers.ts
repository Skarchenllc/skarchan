// Shared utility functions for Compensation Module
import { Employee, AdjustmentType } from '@/types/hr/compensation';

/**
 * Get employee full name from employee ID
 */
export function getEmployeeName(employeeId: string, employees: Employee[]): string {
  const emp = employees.find(e => e.id === employeeId);
  return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
}

/**
 * Format adjustment type to human-readable string
 */
export function formatAdjustmentType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format bonus type to human-readable string
 */
export function formatBonusType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format currency amount with locale
 */
export function formatCurrency(amount: number, locale: string = 'en-US', currency: string = 'USD'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format currency amount without currency symbol (for compact display)
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * Format date to locale string
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
}

/**
 * Get status badge color classes
 */
export function getStatusBadgeClasses(status: string): string {
  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case 'paid':
    case 'active':
    case 'hired':
      return 'bg-green-100 text-green-800';

    case 'approved':
    case 'interview':
      return 'bg-blue-100 text-blue-800';

    case 'pending':
    case 'screening':
      return 'bg-yellow-100 text-yellow-800';

    case 'cancelled':
    case 'rejected':
    case 'paused':
      return 'bg-red-100 text-red-800';

    case 'offer':
      return 'bg-purple-100 text-purple-800';

    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get plan type icon name (for lucide-react)
 */
export function getPlanTypeIcon(planType: string): string {
  const type = planType.toLowerCase();

  switch (type) {
    case 'health':
      return 'Heart';
    case 'dental':
      return 'Smile';
    case 'vision':
      return 'Eye';
    case 'life':
      return 'Shield';
    case '401k':
      return 'PiggyBank';
    case 'disability':
      return 'Activity';
    default:
      return 'FileText';
  }
}

/**
 * Validate salary range (min < mid < max)
 */
export function validateSalaryRange(min: number, mid: number, max: number): { valid: boolean; error?: string } {
  if (min >= mid) {
    return { valid: false, error: 'Minimum salary must be less than mid salary' };
  }
  if (mid >= max) {
    return { valid: false, error: 'Mid salary must be less than max salary' };
  }
  if (min < 0 || mid < 0 || max < 0) {
    return { valid: false, error: 'Salary values cannot be negative' };
  }
  return { valid: true };
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Get plan type badge color
 */
export function getPlanTypeBadgeClass(planType: string): string {
  const type = planType.toLowerCase();

  switch (type) {
    case 'health':
      return 'bg-red-100 text-red-800';
    case 'dental':
      return 'bg-blue-100 text-blue-800';
    case 'vision':
      return 'bg-purple-100 text-purple-800';
    case 'life':
      return 'bg-green-100 text-green-800';
    case '401k':
      return 'bg-yellow-100 text-yellow-800';
    case 'disability':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
