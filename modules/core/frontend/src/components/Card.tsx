import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;
