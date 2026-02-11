import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to track online/offline status and manage offline actions
 */
export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queuedActions, setQueuedActions] = useState(() => {
    try {
      const stored = localStorage.getItem('offline_actions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueuedActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist queued actions
  useEffect(() => {
    try {
      localStorage.setItem('offline_actions', JSON.stringify(queuedActions));
    } catch (error) {
      console.error('Failed to persist offline actions:', error);
    }
  }, [queuedActions]);

  /**
   * Queue an action to be performed when back online
   */
  const queueAction = useCallback((action) => {
    const queuedAction = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...action,
    };

    setQueuedActions((prev) => [...prev, queuedAction]);

    // Try to register for background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('sync-offline-actions').catch(console.error);
      });
    }

    return queuedAction.id;
  }, []);

  /**
   * Remove an action from the queue
   */
  const removeAction = useCallback((actionId) => {
    setQueuedActions((prev) => prev.filter((a) => a.id !== actionId));
  }, []);

  /**
   * Clear all queued actions
   */
  const clearQueue = useCallback(() => {
    setQueuedActions([]);
  }, []);

  /**
   * Sync queued actions when back online
   */
  const syncQueuedActions = useCallback(async () => {
    if (!isOnline || queuedActions.length === 0) return;

    const actionsToSync = [...queuedActions];
    const failedActions = [];

    for (const action of actionsToSync) {
      try {
        const response = await fetch(action.url, {
          method: action.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...action.headers,
          },
          body: action.body ? JSON.stringify(action.body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        // Action synced successfully
        console.log(`Synced offline action: ${action.id}`);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        failedActions.push(action);
      }
    }

    // Keep only failed actions in queue
    setQueuedActions(failedActions);
    setLastSyncTime(new Date().toISOString());
  }, [isOnline, queuedActions]);

  /**
   * Get pending action count
   */
  const pendingCount = queuedActions.length;

  /**
   * Check if there are pending actions
   */
  const hasPendingActions = pendingCount > 0;

  return {
    isOnline,
    isOffline: !isOnline,
    queuedActions,
    pendingCount,
    hasPendingActions,
    lastSyncTime,
    queueAction,
    removeAction,
    clearQueue,
    syncQueuedActions,
  };
};

export default useOffline;
