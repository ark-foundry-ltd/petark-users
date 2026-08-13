// components/notifications/NotificationPermissionBanner.tsx

'use client';
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { isIOS, isStandalone } from '@/libs/api/platform';
import { toast } from 'sonner';

export function NotificationPermissionBanner() {
  const { permission, isSubscribed, loading, subscribe } = usePushSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [suppressForIOS, setSuppressForIOS] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSuppressForIOS(isIOS() && !isStandalone());
  }, []);

  if (loading || dismissed || suppressForIOS || permission !== 'default' || isSubscribed) return null;

  const handleEnable = async () => {
    try {
      await subscribe();
      toast.success('Notifications enabled');
    } catch {
      toast.error('Could not enable notifications');
    }
    setDismissed(true);
  };

  return (
    <div className="relative z-20 flex items-center gap-3 bg-pry-clr rounded-2xl px-4 py-4 shadow-sm mb-4 pry-ff">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-clr text-acc-clr shrink-0">
        <Bell size={20} />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sec-clr">Enable Notifications</p>
        <p className="text-sm text-gray-500">Turn on notifications to get reminders and updates.</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleEnable}
          className="px-4 py-1.5 bg-acc-clr text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
        >
          Enable
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Not now
        </button>
      </div>
    </div>
  );
}