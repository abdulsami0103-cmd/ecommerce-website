import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to handle PWA installation prompt
 * Shows install banner after 2nd visit
 */
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running in iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = 'standalone' in window.navigator && window.navigator.standalone;

    if (isIOS && isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Track visit count
    const visitCount = parseInt(localStorage.getItem('pwa_visit_count') || '0', 10);
    localStorage.setItem('pwa_visit_count', String(visitCount + 1));

    // Show banner after 2nd visit (if not dismissed)
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    if (visitCount >= 1 && !dismissed) {
      setShouldShowBanner(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShouldShowBanner(false);
      localStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Trigger the installation prompt
   */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('PWA install prompt not available');
      return { outcome: 'unavailable' };
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted PWA install');
      setIsInstalled(true);
      setShouldShowBanner(false);
    } else {
      console.log('User dismissed PWA install');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsInstallable(false);

    return { outcome };
  }, [deferredPrompt]);

  /**
   * Dismiss the install banner
   */
  const dismissBanner = useCallback(() => {
    setShouldShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  }, []);

  /**
   * Reset banner dismissal (for testing)
   */
  const resetBanner = useCallback(() => {
    localStorage.removeItem('pwa_banner_dismissed');
    localStorage.removeItem('pwa_visit_count');
    setShouldShowBanner(true);
  }, []);

  /**
   * Check if iOS and provide manual instructions
   */
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return {
    isInstallable,
    isInstalled,
    shouldShowBanner,
    isIOSDevice,
    promptInstall,
    dismissBanner,
    resetBanner,
  };
};

export default usePWAInstall;
