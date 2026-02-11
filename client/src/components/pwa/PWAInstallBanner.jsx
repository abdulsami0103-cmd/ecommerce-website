import usePWAInstall from '../../hooks/usePWAInstall';

const PWAInstallBanner = () => {
  const {
    isInstallable,
    isInstalled,
    shouldShowBanner,
    isIOSDevice,
    promptInstall,
    dismissBanner,
  } = usePWAInstall();

  // Don't show if already installed or banner shouldn't show
  if (isInstalled || !shouldShowBanner) {
    return null;
  }

  // iOS specific instructions (can't auto-prompt)
  if (isIOSDevice && !isInstallable) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Install App</h3>
            <p className="text-sm text-gray-600 mt-1">
              Tap{' '}
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 3a1 1 0 011 1v2.586l.293-.293a1 1 0 011.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L12 6.586V4a1 1 0 011-1zM5 11a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 010-2h1v-1a1 1 0 011-1zm12 0a1 1 0 011 1v1h1a1 1 0 110 2h-2a1 1 0 01-1-1v-2a1 1 0 011-1z" />
                </svg>
              </span>
              then "Add to Home Screen"
            </p>
          </div>
          <button
            onClick={dismissBanner}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Standard install prompt (Chrome, Edge, etc.)
  if (!isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Install App</h3>
          <p className="text-sm text-gray-600 mt-1">
            Add MarketPlace Admin to your home screen for quick access
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={promptInstall}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
            >
              Install
            </button>
            <button
              onClick={dismissBanner}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={dismissBanner}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
