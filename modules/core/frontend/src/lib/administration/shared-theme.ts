/**
 * Shared Theme Configuration
 * This file can be imported by all modules to maintain consistent branding
 */

export interface SharedTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  logoFile?: string;
  appName: string;
}

export const defaultSharedTheme: SharedTheme = {
  primaryColor: '#002868',
  secondaryColor: '#006600',
  appName: 'NexaCore',
};

/**
 * Fetch theme from Core module's API
 */
export async function fetchSharedTheme(): Promise<SharedTheme> {
  if (typeof window !== 'undefined') {
    // Try to fetch from Core API (public endpoint, no auth required)
    try {
      const response = await fetch('http://localhost:8012/api/v1/public/theme', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const theme: SharedTheme = {
          primaryColor: data.primaryColor || defaultSharedTheme.primaryColor,
          secondaryColor: data.secondaryColor || defaultSharedTheme.secondaryColor,
          logoUrl: data.logoUrl || undefined,
          logoFile: data.logoFile || undefined,
          appName: data.appName || defaultSharedTheme.appName,
        };

        // Cache in localStorage for faster subsequent loads
        localStorage.setItem('shared_theme', JSON.stringify(theme));
        return theme;
      }
    } catch (error) {
      console.warn('Failed to fetch theme from API, using cached or default theme:', error);
    }

    // Fallback to localStorage if API fails
    try {
      const stored = localStorage.getItem('shared_theme');
      if (stored) {
        return { ...defaultSharedTheme, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }

  return defaultSharedTheme;
}

/**
 * Save shared theme to localStorage
 * This should be called by the Core module when theme is updated
 */
export function saveSharedTheme(theme: Partial<SharedTheme>): void {
  if (typeof window !== 'undefined') {
    const current = localStorage.getItem('shared_theme');
    const currentTheme = current ? JSON.parse(current) : defaultSharedTheme;
    const updated = { ...currentTheme, ...theme };
    localStorage.setItem('shared_theme', JSON.stringify(updated));

    // Dispatch event to notify other modules
    window.dispatchEvent(new CustomEvent('theme-updated', { detail: updated }));
  }
}

/**
 * Listen for theme updates
 */
export function onThemeUpdate(callback: (theme: SharedTheme) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<SharedTheme>;
    callback(customEvent.detail);
  };

  window.addEventListener('theme-updated', handler);

  return () => window.removeEventListener('theme-updated', handler);
}
