// Shared table styling components for Compensation module

export const tableHeaderClasses = "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100";
export const tableCellClasses = "px-4 py-3 text-sm text-gray-700 border border-gray-300";
export const tableRowClasses = "hover:bg-blue-50 transition";

interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableHeaderCell({ children, className = '', align = 'left' }: TableHeaderCellProps) {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <th className={`px-4 py-3 text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100 ${alignClass} ${className}`}>
      {children}
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  bold?: boolean;
}

export function TableCell({ children, className = '', bold = false }: TableCellProps) {
  const fontClass = bold ? 'font-medium text-gray-900' : 'text-gray-700';
  return (
    <td className={`px-4 py-3 text-sm border border-gray-300 ${fontClass} ${className}`}>
      {children}
    </td>
  );
}

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className = '' }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-blue-50">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="bg-white">{children}</tbody>;
}

export function TableRow({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr className={tableRowClasses} onClick={onClick}>
      {children}
    </tr>
  );
}
