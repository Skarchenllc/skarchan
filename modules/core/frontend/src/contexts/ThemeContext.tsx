'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userSettingsAPI } from '@/lib/api';

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  compactView: boolean;
  fontSize: number; // in pixels
  borderRadius: number; // in pixels
  animations: boolean;
  fontFamily: string;
  iconSize: number; // in pixels
  fontColor: string;
  iconColor: string;
  sidebarColor: string;
  headerColor: string;
  backgroundColor: string;
  backgroundImage: string;
  enableShadows: boolean;
  logoUrl: string;
  logoFile: string; // base64 encoded image
  faviconUrl: string;
  faviconFile: string; // base64 encoded image
  appName: string;
}

interface FeatureSettings {
  emailNotifications: boolean;
  systemNotifications: boolean;
  securityAlerts: boolean;
  showDashboard: boolean;
  showReports: boolean;
  showAnalytics: boolean;
  enableExports: boolean;
  enableImports: boolean;
}

interface ThemeContextType {
  theme: ThemeSettings;
  features: FeatureSettings;
  updateTheme: (settings: Partial<ThemeSettings>) => void;
  updateFeatures: (settings: Partial<FeatureSettings>) => void;
  resetTheme: () => void;
}

const defaultTheme: ThemeSettings = {
  primaryColor: '#002868',
  secondaryColor: '#006600',
  darkMode: false,
  compactView: false,
  fontSize: 16,
  borderRadius: 4,
  animations: true,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  iconSize: 20,
  fontColor: '#000000',
  iconColor: '#006600',
  sidebarColor: '#1f2937',
  headerColor: '#ffffff',
  backgroundColor: '#f9fafb',
  backgroundImage: '',
  enableShadows: false,
  logoUrl: '',
  logoFile: '',
  faviconUrl: '',
  faviconFile: '',
  appName: 'NexaCore',
};

const defaultFeatures: FeatureSettings = {
  emailNotifications: true,
  systemNotifications: true,
  securityAlerts: true,
  showDashboard: true,
  showReports: true,
  showAnalytics: true,
  enableExports: true,
  enableImports: true,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [features, setFeatures] = useState<FeatureSettings>(defaultFeatures);

  // Load theme from API or localStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Try to load from API first
          const response = await userSettingsAPI.getAll();
          if (response.data) {
            if (response.data.theme) {
              setTheme({ ...defaultTheme, ...response.data.theme });
            }
            if (response.data.features) {
              setFeatures({ ...defaultFeatures, ...response.data.features });
            }
          }
        } catch (error) {
          // Fall back to localStorage if API fails (user not logged in, etc.)
          console.log('Loading settings from localStorage (API unavailable)');
          const savedTheme = localStorage.getItem('theme_settings');
          const savedFeatures = localStorage.getItem('feature_settings');

          if (savedTheme) {
            setTheme(JSON.parse(savedTheme));
          }
          if (savedFeatures) {
            setFeatures(JSON.parse(savedFeatures));
          }
        }
      }
    };

    loadSettings();
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;

      // Apply CSS variables for colors
      root.style.setProperty('--color-primary', theme.primaryColor);
      root.style.setProperty('--color-secondary', theme.secondaryColor);
      root.style.setProperty('--color-sidebar', theme.sidebarColor);
      root.style.setProperty('--color-header', theme.headerColor);
      root.style.setProperty('--color-background', theme.backgroundColor);

      // Apply background image
      if (theme.backgroundImage) {
        document.body.style.backgroundImage = `url(${theme.backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = theme.backgroundColor;
      }

      // Apply dark mode
      if (theme.darkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Apply compact view
      if (theme.compactView) {
        root.classList.add('compact');
      } else {
        root.classList.remove('compact');
      }

      // Apply shadows
      if (!theme.enableShadows) {
        root.classList.add('no-shadows');
      } else {
        root.classList.remove('no-shadows');
      }

      // Apply font family
      root.style.setProperty('--font-family', theme.fontFamily);

      // Apply font size (numeric value in pixels)
      root.style.fontSize = `${theme.fontSize}px`;
      root.style.setProperty('--font-size-base', `${theme.fontSize}px`);

      // Apply icon size (numeric value in pixels)
      root.style.setProperty('--icon-size', `${theme.iconSize}px`);

      // Apply border radius (numeric value in pixels)
      root.style.setProperty('--border-radius', `${theme.borderRadius}px`);

      // Apply font color
      root.style.setProperty('--color-text', theme.fontColor);

      // Apply icon color
      root.style.setProperty('--icon-color', theme.iconColor);

      // Apply animations
      if (!theme.animations) {
        root.style.setProperty('--animation-duration', '0s');
      } else {
        root.style.setProperty('--animation-duration', '0.2s');
      }

      // Update favicon (prefer uploaded file over URL)
      const faviconSource = theme.faviconFile || theme.faviconUrl;
      if (faviconSource) {
        let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = faviconSource;
      }

      // Update page title
      if (theme.appName) {
        document.title = theme.appName;
      }

      // Create comprehensive style overrides
      const style = document.createElement('style');
      style.id = 'theme-override-styles';
      style.textContent = `
        /* Transitions */
        * {
          transition-duration: ${theme.animations ? '0.2s' : '0s'} !important;
        }

        /* Border Radius */
        .border, .rounded, .rounded-lg, .rounded-md, .rounded-sm, .rounded-full,
        [class*="rounded-"], [class*="border-"] {
          border-radius: ${theme.borderRadius}px !important;
        }

        /* Primary Color Backgrounds */
        [class*="bg-[#002868]"],
        .bg-blue-600, .bg-blue-700, .bg-blue-800,
        [class*="bg-primary"] {
          background-color: ${theme.primaryColor} !important;
        }

        /* Secondary Color Backgrounds */
        [class*="bg-[#006600]"],
        .bg-green-600, .bg-green-700, .bg-green-800,
        [class*="bg-secondary"] {
          background-color: ${theme.secondaryColor} !important;
        }

        /* Primary Color Text */
        [class*="text-[#002868]"],
        .text-blue-600, .text-blue-700, .text-blue-800,
        [class*="text-primary"] {
          color: ${theme.primaryColor} !important;
        }

        /* Secondary Color Text */
        [class*="text-[#006600]"],
        .text-green-600, .text-green-700, .text-green-800,
        [class*="text-secondary"] {
          color: ${theme.secondaryColor} !important;
        }

        /* Primary Color Borders */
        [class*="border-[#002868]"],
        .border-blue-600, .border-blue-700, .border-blue-800,
        [class*="border-primary"] {
          border-color: ${theme.primaryColor} !important;
        }

        /* Secondary Color Borders */
        [class*="border-[#006600]"],
        .border-green-600, .border-green-700, .border-green-800,
        [class*="border-secondary"] {
          border-color: ${theme.secondaryColor} !important;
        }

        /* Hover States - Primary */
        [class*="hover:bg-[#002868]"]:hover,
        [class*="hover:bg-primary"]:hover {
          background-color: ${theme.primaryColor} !important;
        }

        [class*="hover:text-[#002868]"]:hover,
        [class*="hover:text-primary"]:hover {
          color: ${theme.primaryColor} !important;
        }

        [class*="hover:border-[#002868]"]:hover,
        [class*="hover:border-primary"]:hover {
          border-color: ${theme.primaryColor} !important;
        }

        /* Hover States - Secondary */
        [class*="hover:bg-[#006600]"]:hover,
        [class*="hover:bg-secondary"]:hover {
          background-color: ${theme.secondaryColor} !important;
        }

        [class*="hover:text-[#006600]"]:hover,
        [class*="hover:text-secondary"]:hover {
          color: ${theme.secondaryColor} !important;
        }

        [class*="hover:border-[#006600]"]:hover,
        [class*="hover:border-secondary"]:hover {
          border-color: ${theme.secondaryColor} !important;
        }

        /* Sidebar */
        .bg-gray-900, aside[class*="bg-gray"] {
          background-color: ${theme.sidebarColor} !important;
        }

        /* Text Colors */
        ${theme.darkMode ? `
          .text-black, .text-gray-900, .text-gray-800, .text-gray-700 {
            color: #ffffff !important;
          }
          .bg-gray-50, .bg-gray-100 {
            background-color: #1f2937 !important;
          }
          .bg-white {
            background-color: #111827 !important;
          }
          .border-gray-200, .border-gray-300 {
            border-color: #374151 !important;
          }
        ` : `
          .text-black, .text-gray-900 {
            color: #000000 !important;
          }
          .bg-gray-50 {
            background-color: #f9fafb !important;
          }
          .bg-white {
            background-color: #ffffff !important;
          }
          .border-gray-200, .border-gray-300 {
            border-color: #e5e7eb !important;
          }
        `}

        /* Icon Sizes */
        svg, .icon {
          width: ${theme.iconSize}px !important;
          height: ${theme.iconSize}px !important;
        }

        /* Font Family */
        body, * {
          font-family: ${theme.fontFamily} !important;
        }

        /* Font Color */
        body {
          color: ${theme.fontColor} !important;
        }

        /* Icon Color */
        svg {
          color: ${theme.iconColor} !important;
        }

        /* Shadows */
        ${!theme.enableShadows ? `
          *, *::before, *::after {
            box-shadow: none !important;
          }
        ` : ''}
      `;

      // Remove old style if exists
      const oldStyle = document.getElementById('theme-override-styles');
      if (oldStyle) {
        oldStyle.remove();
      }
      document.head.appendChild(style);

      return () => {
        const styleToRemove = document.getElementById('theme-override-styles');
        if (styleToRemove) {
          styleToRemove.remove();
        }
      };
    }
  }, [theme]);

  const updateTheme = async (settings: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...settings };
    setTheme(newTheme);

    // Save to localStorage immediately for instant feedback
    localStorage.setItem('theme_settings', JSON.stringify(newTheme));

    // Save shared theme for other modules
    const sharedTheme = {
      primaryColor: newTheme.primaryColor,
      secondaryColor: newTheme.secondaryColor,
      logoUrl: newTheme.logoUrl,
      logoFile: newTheme.logoFile,
      appName: newTheme.appName,
    };
    localStorage.setItem('shared_theme', JSON.stringify(sharedTheme));

    // Dispatch event to notify other modules/tabs
    window.dispatchEvent(new CustomEvent('theme-updated', { detail: sharedTheme }));

    // Save to API in background
    try {
      await userSettingsAPI.saveTheme(newTheme);
    } catch (error) {
      console.log('Could not save theme to server, saved locally only');
    }
  };

  const updateFeatures = async (settings: Partial<FeatureSettings>) => {
    const newFeatures = { ...features, ...settings };
    setFeatures(newFeatures);

    // Save to localStorage immediately for instant feedback
    localStorage.setItem('feature_settings', JSON.stringify(newFeatures));

    // Save to API in background
    try {
      await userSettingsAPI.saveFeatures(newFeatures);
    } catch (error) {
      console.log('Could not save features to server, saved locally only');
    }
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    setFeatures(defaultFeatures);
    localStorage.removeItem('theme_settings');
    localStorage.removeItem('feature_settings');
  };

  return (
    <ThemeContext.Provider value={{ theme, features, updateTheme, updateFeatures, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
