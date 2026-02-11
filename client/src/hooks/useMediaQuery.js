import { useState, useEffect } from 'react';

/**
 * Hook to track media query matches
 * @param {string} query - CSS media query string
 * @returns {boolean} - Whether the media query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Add listener
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
    } else {
      mediaQuery.addEventListener('change', handler);
    }

    return () => {
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handler);
      } else {
        mediaQuery.removeEventListener('change', handler);
      }
    };
  }, [query]);

  return matches;
};

/**
 * Check if device is mobile (<768px)
 */
export const useIsMobile = () => {
  return useMediaQuery('(max-width: 767px)');
};

/**
 * Check if device is tablet (768px - 1023px)
 */
export const useIsTablet = () => {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
};

/**
 * Check if device is desktop (>=1024px)
 */
export const useIsDesktop = () => {
  return useMediaQuery('(min-width: 1024px)');
};

/**
 * Check if device supports touch
 */
export const useIsTouchDevice = () => {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
};

/**
 * Check if user prefers reduced motion
 */
export const usePrefersReducedMotion = () => {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
};

/**
 * Check if user prefers dark mode
 */
export const usePrefersDarkMode = () => {
  return useMediaQuery('(prefers-color-scheme: dark)');
};

/**
 * Get current breakpoint
 */
export const useBreakpoint = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'unknown';
};

export default useMediaQuery;
