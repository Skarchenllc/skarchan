'use client';

import Link from 'next/link';

export interface FooterProps {
  theme: {
    appName: string;
    primaryColor: string;
    secondaryColor: string;
  };
  moduleName?: string;
}

export default function Footer({ theme, moduleName }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto" style={{ borderColor: '#e5e7eb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          {/* Left side - Copyright */}
          <div className="text-xs text-gray-500">
            © {currentYear} <span style={{ color: theme.primaryColor }} className="font-medium">{theme.appName}</span>. All rights reserved.
          </div>

          {/* Right side - Links */}
          <div className="flex space-x-4 text-xs">
            <Link
              href="/rd/about"
              className="text-gray-500 transition"
              onMouseEnter={(e) => e.currentTarget.style.color = theme.primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              About
            </Link>
            <Link
              href="/rd/privacy"
              className="text-gray-500 transition"
              onMouseEnter={(e) => e.currentTarget.style.color = theme.primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              Privacy
            </Link>
            <Link
              href="/rd/terms"
              className="text-gray-500 transition"
              onMouseEnter={(e) => e.currentTarget.style.color = theme.primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              Terms
            </Link>
            <Link
              href="/rd/contact"
              className="text-gray-500 transition"
              onMouseEnter={(e) => e.currentTarget.style.color = theme.primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
