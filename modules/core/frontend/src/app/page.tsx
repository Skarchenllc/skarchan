'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSharedTheme } from '@/lib/shared-theme-hook';
import { moduleBuilderAPI } from '@/lib/api';
import {
  FiZap,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiSettings,
  FiPackage,
  FiBarChart2,
  FiCheckCircle,
  FiArrowRight,
  FiShoppingCart,
} from 'react-icons/fi';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, loading: themeLoading } = useSharedTheme();
  const [activeModuleCodes, setActiveModuleCodes] = useState<Set<string> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await moduleBuilderAPI.listModules({});
        const list: any[] = (resp.data as any)?.data || (resp.data as any) || [];
        setActiveModuleCodes(new Set(list.filter(m => m.is_active).map(m => m.module_code)));
      } catch {
        setActiveModuleCodes(new Set()); // on error, show none from filtered list
      }
    })();
  }, []);

  // Get logo source (prefer uploaded file over URL)
  const logoSource = theme.logoFile || theme.logoUrl;

  // Redirect to control room if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/nexacore');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth
  if (loading || (user && !loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const allModules = [
    { code: 'accounting',     name: 'Accounting', icon: FiDollarSign,  description: 'Financial Management' },
    { code: 'hr',             name: 'HR',         icon: FiUsers,       description: 'Human Resources' },
    { code: 'marketing',      name: 'Marketing',  icon: FiTrendingUp,  description: 'Marketing Automation' },
    { code: 'sales',          name: 'Sales',      icon: FiBarChart2,   description: 'Sales Pipeline' },
    { code: 'contacts',       name: 'Contacts',   icon: FiUsers,       description: 'People & Organizations' },
    { code: 'production',     name: 'Production', icon: FiPackage,     description: 'Manufacturing Operations' },
    { code: 'rd',             name: 'R&D',        icon: FiZap,         description: 'Research & Development' },
    { code: 'administration', name: 'Admin',      icon: FiSettings,    description: 'Administration' },
    { code: 'ecommerce',      name: 'E-commerce', icon: FiShoppingCart,description: 'E-commerce / POS' },
  ];
  // Hide modules disabled in settings. While the active list is loading
  // we show everything (avoids a flash of empty grid for unauthenticated
  // visitors who shouldn't pay the wait either).
  const modules = activeModuleCodes
    ? allModules.filter(m => activeModuleCodes.has(m.code))
    : allModules;

  const features = [
    'Unified Business Management',
    'Real-time Analytics & Reporting',
    'Modular Architecture',
    'Enterprise-Grade Security',
    'Customizable Workflows',
    'Multi-Module Integration',
  ];

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: 'smooth' }}>
      {/* Navigation */}
      <nav className="bg-white border-b-2 sticky top-0 z-50 backdrop-blur-sm bg-white/95" style={{ borderColor: theme.secondaryColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                {logoSource ? (
                  <img src={logoSource} alt="Logo" className="h-10 w-auto object-contain" />
                ) : (
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <FiZap className="w-6 h-6" style={{ color: theme.secondaryColor }} />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold" style={{ color: theme.primaryColor }}>
                    {theme.appName}
                  </span>
                  <span className="text-xl text-black">|</span>
                  <span className="text-sm font-medium text-gray-600 italic">
                    Powering Your Business Forward
                  </span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="#modules"
                className="text-sm font-medium text-gray-700 hover:opacity-80 transition-opacity"
              >
                Products
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-gray-700 hover:opacity-80 transition-opacity"
              >
                Pricing
              </a>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-black hover:opacity-80 transition-opacity"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
              Enterprise Business Management
              <span className="block mt-2" style={{ color: theme.primaryColor }}>
                All-in-One Platform
              </span>
            </h1>
            <div className="flex justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 text-lg font-medium text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                Start Free Trial
                <FiArrowRight className="inline-block ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 text-lg font-medium border-2 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
              >
                Sign In to Control Room
              </Link>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: theme.primaryColor }}
          ></div>
          <div
            className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: theme.secondaryColor }}
          ></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Why Choose {theme.appName}?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border-2 border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: theme.secondaryColor }} />
                  <div>
                    <h3 className="font-semibold text-lg text-black mb-2">{feature}</h3>
                    <p className="text-gray-600 text-sm">
                      {index === 0 && 'Manage all aspects of your business from a single platform'}
                      {index === 1 && 'Get instant insights with powerful analytics and dashboards'}
                      {index === 2 && 'Choose only the modules you need, scale as you grow'}
                      {index === 3 && 'Bank-level security with role-based access control'}
                      {index === 4 && 'Tailor workflows to match your business processes'}
                      {index === 5 && 'Seamless data flow between all modules'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div id="modules" className="py-20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Integrated Business Modules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm border-2 hover:shadow-lg transition-all cursor-pointer group"
                  style={{ borderColor: index % 2 === 0 ? theme.primaryColor : theme.secondaryColor }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: index % 2 === 0 ? theme.primaryColor : theme.secondaryColor }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-black mb-2">{module.name}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-gray-50 py-20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Simple, Transparent Pricing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Starter</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-black">$49</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Up to 3 modules</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">10 users included</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">5GB storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Email support</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Basic analytics</span>
                </li>
              </ul>

              <Link
                href="/register?plan=starter"
                className="block w-full text-center px-6 py-3 border-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
              >
                Get Started
              </Link>
            </div>

            {/* Professional Plan (Highlighted) */}
            <div className="bg-white rounded-lg shadow-lg border-2 p-8 relative transform md:scale-105 hover:shadow-xl transition-all" style={{ borderColor: theme.secondaryColor }}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="px-4 py-1 text-sm font-bold text-white rounded-full" style={{ backgroundColor: theme.secondaryColor }}>
                  MOST POPULAR
                </span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Professional</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-black">$149</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Up to 6 modules</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">50 users included</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">50GB storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Advanced analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Custom workflows</span>
                </li>
              </ul>

              <Link
                href="/register?plan=professional"
                className="block w-full text-center px-6 py-3 rounded-lg font-medium text-white hover:opacity-90 transition-opacity shadow-lg"
                style={{ backgroundColor: theme.secondaryColor }}
              >
                Get Started
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-black mb-2">Enterprise</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-black">$399</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">All 8 modules</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Unlimited users</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Unlimited storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">24/7 dedicated support</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">White-label options</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">Custom integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme.secondaryColor }} />
                  <span className="text-gray-700">SLA guarantee</span>
                </li>
              </ul>

              <Link
                href="/register?plan=enterprise"
                className="block w-full text-center px-6 py-3 border-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
              >
                Contact Sales
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-12">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20" style={{ backgroundColor: theme.primaryColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using {theme.appName} to streamline their operations
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 text-lg font-medium bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              style={{ color: theme.primaryColor }}
            >
              Create Your Account
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 text-lg font-medium border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {logoSource ? (
                  <img src={logoSource} alt="Logo" className="h-10 w-auto object-contain" />
                ) : (
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <FiZap className="w-6 h-6" style={{ color: theme.secondaryColor }} />
                  </div>
                )}
                <span className="text-xl font-bold">{theme.appName}</span>
              </div>
              <p className="text-gray-400 mb-4">
                Enterprise-grade business management platform designed to scale with your organization.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Register
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} {theme.appName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
