import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose, className = '' }) => {
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: FiCheckCircle,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: FiXCircle,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: FiAlertCircle,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: FiInfo,
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div
      className={`${style.bg} ${style.border} ${style.text} border rounded-lg p-4 flex items-start gap-3 ${className}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiXCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
