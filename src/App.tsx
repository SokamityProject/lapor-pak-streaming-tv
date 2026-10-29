import React, { useState, useCallback, useEffect } from 'react';
import { TvHomePage } from './pages/TvHomePage';
import { TvPlayer } from './components/TvPlayer';
import { WatchVideoDetails } from './types/api';
import { fetchWatchDetails } from './services/api';
import { exitTvApp } from './components/TvExitModal';

export const App: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<WatchVideoDetails | null>(null);
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

  // Back button handling when video player is active
  useEffect(() => {
    if (!activeVideo) return;

    const handleCustomBack = (e: Event) => {
      e.preventDefault();
      handleClosePlayer();
    };

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
        handleClosePlayer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('tvbackbutton', handleCustomBack);
    document.addEventListener('backbutton', handleCustomBack);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('tvbackbutton', handleCustomBack);
      document.removeEventListener('backbutton', handleCustomBack);
    };
  }, [activeVideo, handleClosePlayer]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#060913] text-white">
      {activeVideo ? (
        <TvPlayer video={activeVideo} onClose={handleClosePlayer} />
      ) : (
        <TvHomePage
          key={homeKey}
          onPlayVideo={handlePlayVideo}
          onExitApp={exitTvApp}
        />
      )}
    </div>
  );
};
