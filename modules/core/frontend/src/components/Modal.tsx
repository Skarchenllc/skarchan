'use client';

/**
 * Modal — the canonical dialog chrome used everywhere in the app.
 *
 * Square corners · light navy hairline · single primary header (navy
 * accent), no shadow-xl drama. Body and footer are slot-friendly: callers
 * can render their own footer by composing children, or use the `footer`
 * prop for the standard right-aligned button row.
 */

import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;          // optional one-liner under the title
  children: ReactNode;
  footer?: ReactNode;            // right-aligned footer row (e.g. Cancel/Save)
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: '28rem',
  md: '40rem',
  lg: '56rem',
  xl: '72rem',
};

const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, description, children, footer, size = 'md',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', padding: '3rem 1rem' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full flex flex-col"
        style={{
          maxWidth: SIZES[size],
          maxHeight: 'calc(100vh - 6rem)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <div className="min-w-0">
            <h2
              className="text-base font-bold leading-none"
              style={{ color: '#5147e6', letterSpacing: '0.02em' }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center shrink-0"
            style={{ width: '28px', height: '28px', color: '#6b7280' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-auto px-5 py-4">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div
            className="flex items-center justify-end gap-2 px-5 py-3 shrink-0"
            style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
