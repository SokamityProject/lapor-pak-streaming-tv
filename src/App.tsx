import React, { useState } from 'react';
import { TvHomePage } from './pages/TvHomePage';
import { TvPlayer } from './components/TvPlayer';
import { WatchVideoDetails } from './types/api';
import { fetchWatchDetails } from './services/api';

export const App: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<WatchVideoDetails | null>(null);

  const handlePlayVideo = async (slug: string) => {
    try {
      const details = await fetchWatchDetails(slug);
      setActiveVideo(details);
    } catch (err) {
      console.error('Failed to load video details:', err);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
      {activeVideo ? (
        <TvPlayer video={activeVideo} onClose={() => setActiveVideo(null)} />
      ) : (
        <TvHomePage onPlayVideo={handlePlayVideo} />
      )}
    </div>
  );
};
