interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  href?: string;
}

export default function StatCard({ title, value, subtitle, href }: StatCardProps) {
  const CardContent = () => (
    <>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-black">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block bg-white overflow-hidden border border-gray-200 rounded-lg hover:border-primary transition-colors"
      >
        <div className="px-4 py-5 sm:p-6">
          <CardContent />
        </div>
      </a>
    );
  }

  return (
    <div className="bg-white overflow-hidden border border-gray-200 rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <CardContent />
      </div>
    </div>
  );
}
