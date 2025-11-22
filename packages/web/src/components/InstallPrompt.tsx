import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User accepted install');
    }

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    // Remember dismissal for 7 days
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  // Check if user dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        setShowInstall(false);
      }
    }
  }, []);

  if (!showInstall) return null;

  return (
    <div className="
      fixed bottom-20 left-4 right-4
      md:bottom-4 md:left-auto md:right-4 md:max-w-md
      bg-primary-500 text-white
      p-4 rounded-lg shadow-lg
      z-50
      animate-slide-up
    ">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
        aria-label="Đóng"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="text-3xl">📱</div>
        <div className="flex-1">
          <p className="font-semibold text-lg mb-1">Cài đặt ứng dụng</p>
          <p className="text-sm text-white/90 mb-3">
            Truy cập nhanh hơn từ màn hình chính và sử dụng offline
          </p>
          <button
            onClick={handleInstall}
            className="
              w-full bg-white text-primary-500
              px-4 py-2 rounded-lg
              font-semibold
              btn-active
              hover:bg-gray-100
            "
          >
            Cài đặt ngay
          </button>
        </div>
      </div>
    </div>
  );
}
