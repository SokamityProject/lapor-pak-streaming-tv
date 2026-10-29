import React, { useState, useEffect, useCallback } from 'react';
import { TvHomePage } from './pages/TvHomePage';
import { TvPlayer } from './components/TvPlayer';
import { WatchVideoDetails } from './types/api';
import { fetchWatchDetails } from './services/api';
import { SpatialNavigation } from './services/navigation';
import { useTvFocus } from './hooks/useTvFocus';
import { AlertTriangle, LogOut } from 'lucide-react';

interface ExitModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ExitModal: React.FC<ExitModalProps> = ({ onConfirm, onCancel }) => {
  const cancelFocus = useTvFocus<HTMLButtonElement>({
    id: 'exit-cancel-btn',
    autoFocus: true,
    onSelect: onCancel,
    groupId: 'exit-modal',
  });

  const confirmFocus = useTvFocus<HTMLButtonElement>({
    id: 'exit-confirm-btn',
    onSelect: onConfirm,
    groupId: 'exit-modal',
  });

  useEffect(() => {
    SpatialNavigation.setScope('exit-modal');
    return () => {
      SpatialNavigation.setScope(null);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
      <div className="bg-[#0F172A] border border-white/20 rounded-2xl p-7 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center mb-3 text-brand">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black text-white mb-1.5 tracking-tight">Keluar dari Aplikasi?</h3>
        <p className="text-zinc-400 text-xs mb-6 leading-relaxed max-w-xs">
          Apakah Anda yakin ingin menutup Lapor Pak! Streaming TV?
        </p>

        <div className="flex items-center gap-3 w-full justify-center">
          <button
            ref={cancelFocus.ref}
            onClick={onCancel}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-100 cursor-pointer ${
              cancelFocus.isFocused
                ? 'bg-white/20 text-white shadow-tv-focus scale-105 ring-2 ring-white'
                : 'bg-white/10 text-zinc-300 hover:bg-white/15 border border-white/10'
            }`}
          >
            Batal
          </button>
          <button
            ref={confirmFocus.ref}
            onClick={onConfirm}
            className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-100 cursor-pointer ${
              confirmFocus.isFocused
                ? 'bg-red-600 text-white shadow-tv-focus scale-105 ring-2 ring-white'
                : 'bg-red-700/80 text-white hover:bg-red-600'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Ya, Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<WatchVideoDetails | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [homeKey, setHomeKey] = useState(0);

  const handlePlayVideo = async (slug: string) => {
    try {
      const details = await fetchWatchDetails(slug);
      setActiveVideo(details);
    } catch (err) {
      console.error('Failed to load video details:', err);
    }
  };

  const handleClosePlayer = useCallback(() => {
    setActiveVideo(null);
    setHomeKey((k) => k + 1);
  }, []);

  const handleHardwareBack = useCallback(() => {
    if (activeVideo) {
      handleClosePlayer();
    } else if (showExitModal) {
      setShowExitModal(false);
    } else {
      // Intuitive TV Back: If focused on content, return to Topbar first!
      const current = SpatialNavigation.getCurrentFocus();
      if (current && !current.startsWith('nav-')) {
        SpatialNavigation.setFocus('nav-home');
      } else {
        // If already on topbar, prompt exit confirmation
        setShowExitModal(true);
      }
    }
  }, [activeVideo, showExitModal, handleClosePlayer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = (e as any).keyCode;
      if (
        key === 'Escape' ||
        key === 'Backspace' ||
        key === 'GoBack' ||
        key === 'Back' ||
        code === 4 ||
        code === 27
      ) {
        e.preventDefault();
        handleHardwareBack();
      }
    };

    const handleCustomBack = (e: Event) => {
      e.preventDefault();
      handleHardwareBack();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('tvbackbutton', handleCustomBack);
    document.addEventListener('backbutton', handleCustomBack);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('tvbackbutton', handleCustomBack);
      document.removeEventListener('backbutton', handleCustomBack);
    };
  }, [handleHardwareBack]);

  const handleExitApp = () => {
    if ((window as any).TvAppBridge?.exitApp) {
      (window as any).TvAppBridge.exitApp();
    } else if ((window as any).navigator?.app?.exitApp) {
      (window as any).navigator.app.exitApp();
    } else {
      window.close();
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#080B11] text-white">
      {activeVideo ? (
        <TvPlayer video={activeVideo} onClose={handleClosePlayer} />
      ) : (
        <TvHomePage key={homeKey} onPlayVideo={handlePlayVideo} />
      )}

      {showExitModal && (
        <ExitModal
          onConfirm={handleExitApp}
          onCancel={() => setShowExitModal(false)}
        />
      )}
    </div>
  );
};
