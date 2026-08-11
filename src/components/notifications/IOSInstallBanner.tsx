// components/notifications/IOSInstallBanner.tsx

'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { isIOS, isStandalone } from '@/libs/api/platform';

export function IOSInstallBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(isIOS() && !isStandalone());
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="relative z-20 flex flex-col gap-3 bg-pry-clr rounded-2xl px-4 py-4 shadow-sm mb-4">
      <div className="relative flex items-center gap-3">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-0 right-0 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-acc-clr text-white shrink-0">
          <Download size={20} />
        </span>

        <div className="flex-1 min-w-0 pr-6">
          <p className="text-sm font-semibold text-sec-clr">Install PetArk</p>
          <p className="text-sm text-gray-500">Install PetArk for a faster, better experience.</p>
        </div>

        <button
          onClick={() => setShowInstructions((v) => !v)}
          className="px-4 py-1.5 bg-acc-clr text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity shrink-0"
        >
          Install Now
        </button>
      </div>

      {showInstructions && (
        <p className="text-sm text-gray-500 pl-[3.25rem]">
          Tap the <strong className="text-sec-clr">Share</strong> icon, then <strong className="text-sec-clr">&quot;Add to Home Screen&quot;</strong> — then open PetArk from your home screen.
        </p>
      )}
    </div>
  );
}