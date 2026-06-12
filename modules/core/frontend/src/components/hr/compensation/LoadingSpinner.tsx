// Shared loading spinner component

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message = "Loading data...", size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const paddingClasses = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12'
  };

  return (
    <div className={`text-center ${paddingClasses[size]}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-600 mx-auto`}></div>
      {message && <p className="text-gray-600 mt-4">{message}</p>}
    </div>
  );
}
