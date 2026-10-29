import React, { useState, useEffect, useCallback } from 'react';
import { TvHomePage } from './pages/TvHomePage';
import { TvPlayer } from './components/TvPlayer';
import { WatchVideoDetails } from './types/api';
import { fetchWatchDetails } from './services/api';
import { SpatialNavigation } from './services/navigation';
import { useTvFocus } from './hooks/useTvFocus';
import { AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-card border-2 border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-brand" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Keluar dari Aplikasi?</h3>
        <p className="text-slate-400 text-xs mb-8">
          Apakah Anda yakin ingin menutup Lapor Pak! Streaming TV?
        </p>

        <div className="flex items-center gap-4 w-full justify-center">
          <button
            ref={cancelFocus.ref}
            onClick={onCancel}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer ${
              cancelFocus.isFocused
                ? 'bg-slate-700 text-white shadow-tv-focus scale-105 ring-2 ring-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Batal
          </button>
          <button
            ref={confirmFocus.ref}
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer ${
              confirmFocus.isFocused
                ? 'bg-red-600 text-white shadow-tv-focus scale-105 ring-2 ring-white'
                : 'bg-red-700 text-white hover:bg-red-600'
            }`}
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<WatchVideoDetails | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const handlePlayVideo = async (slug: string) => {
    try {
      const details = await fetchWatchDetails(slug);
      setActiveVideo(details);
    } catch (err) {
      console.error('Failed to load video details:', err);
    }
  };

  const handleHardwareBack = useCallback(() => {
    if (activeVideo) {
      setActiveVideo(null);
    } else if (showExitModal) {
      setShowExitModal(false);
    } else {
      setShowExitModal(true);
    }
  }, [activeVideo, showExitModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack') {
        if (!activeVideo) {
          e.preventDefault();
          handleHardwareBack();
        }
      }
    };

    const handleCapacitorBack = () => {
      handleHardwareBack();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('backbutton', handleCapacitorBack);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('backbutton', handleCapacitorBack);
    };
  }, [handleHardwareBack, activeVideo]);

  const handleExitApp = () => {
    if ((window as any).navigator?.app?.exitApp) {
      (window as any).navigator.app.exitApp();
    } else {
      window.close();
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
      {activeVideo ? (
        <TvPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />
      ) : (
        <TvHomePage onPlayVideo={handlePlayVideo} />
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
