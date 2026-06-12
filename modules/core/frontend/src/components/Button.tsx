import React, { ButtonHTMLAttributes } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 inline-flex items-center justify-center';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-blue-300 disabled:text-blue-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'cursor-not-allowed opacity-60' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;
