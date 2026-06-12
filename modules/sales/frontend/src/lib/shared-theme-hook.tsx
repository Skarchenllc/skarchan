/**
 * React Hook for using shared theme across modules
 *
 * Usage in any module:
 *
 * import { useSharedTheme } from '@/../../shared-theme-hook';
 *
 * function MyComponent() {
 *   const { theme, loading } = useSharedTheme();
 *   return <div style={{ color: theme.primaryColor }}>{theme.appName}</div>;
 * }
 */

'use client';

import { useState, useEffect } from 'react';
import { fetchSharedTheme, onThemeUpdate, SharedTheme, defaultSharedTheme } from './shared-theme';

export function useSharedTheme() {
  const [theme, setTheme] = useState<SharedTheme>(defaultSharedTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load theme on mount
    const loadTheme = async () => {
      try {
        const fetchedTheme = await fetchSharedTheme();
        setTheme(fetchedTheme);
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();

    // Listen for theme updates from Core module or other tabs
    const unsubscribe = onThemeUpdate((updatedTheme) => {
      setTheme(updatedTheme);
    });

    // Refresh theme every 30 seconds to catch updates
    const interval = setInterval(() => {
      fetchSharedTheme().then(setTheme).catch(console.error);
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { theme, loading };
}
