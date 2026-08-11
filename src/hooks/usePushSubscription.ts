// hooks/usePushSubscription.ts

'use client';
import { useEffect, useState, useCallback } from 'react';
import { subscribeToPush, unsubscribeFromPush } from '@/libs/api/push';

export function usePushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(Notification.permission);
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSubscribed(!!sub);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);

  const subscribe = async () => {
    await subscribeToPush();
    await refresh();
  };

  const unsubscribe = async () => {
    await unsubscribeFromPush();
    await refresh();
  };

  return { permission, isSubscribed, loading, subscribe, unsubscribe };
}