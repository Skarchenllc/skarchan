// Shared modal component for forms
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ModalFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
}

export function ModalFooter({
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false
}: ModalFooterProps) {
  return (
    <>
      <button
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        type="button"
        disabled={isSubmitting}
      >
        {cancelLabel}
      </button>
      <button
        onClick={onSubmit}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
        type="button"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </>
  );
}
