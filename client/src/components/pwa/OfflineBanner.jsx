import useOffline from '../../hooks/useOffline';

const OfflineBanner = () => {
  const { isOffline, hasPendingActions, pendingCount } = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 py-2 px-4 z-50 flex items-center justify-center gap-2">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
      </svg>
      <span className="text-sm font-medium">
        You're offline
        {hasPendingActions && ` - ${pendingCount} action${pendingCount > 1 ? 's' : ''} pending`}
      </span>
    </div>
  );
};

// Floating offline indicator (smaller, for bottom of screen)
export const OfflineIndicator = () => {
  const { isOffline, hasPendingActions, pendingCount, syncQueuedActions } = useOffline();

  if (!isOffline && !hasPendingActions) {
    return null;
  }

  return (
    <div className={`fixed bottom-20 left-4 z-40 md:bottom-4 ${isOffline ? 'right-4' : ''}`}>
      {isOffline ? (
        <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-sm text-yellow-800">
            Offline mode
            {hasPendingActions && ` (${pendingCount} pending)`}
          </span>
        </div>
      ) : hasPendingActions ? (
        <button
          onClick={syncQueuedActions}
          className="bg-green-100 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm hover:bg-green-200"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm text-green-800">
            Sync {pendingCount} action{pendingCount > 1 ? 's' : ''}
          </span>
        </button>
      ) : null}
    </div>
  );
};

export default OfflineBanner;
