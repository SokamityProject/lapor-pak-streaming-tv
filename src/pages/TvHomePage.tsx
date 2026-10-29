import React, { useEffect, useState, useCallback } from 'react';
import { HomeFeedData, VideoItem } from '../types/api';
import { fetchHomeFeed, fetchPlaylist, initTvSession } from '../services/api';
import { TvNavbar } from '../components/TvNavbar';
import { TvHeroSpotlight } from '../components/TvHeroSpotlight';
import { TvRowRail } from '../components/TvRowRail';
import { TvVideoCard } from '../components/TvVideoCard';
import { SpatialNavigation } from '../services/navigation';
import { useTvFocus } from '../hooks/useTvFocus';
import { Loader2, AlertCircle } from 'lucide-react';

export interface TvRetryButtonProps {
  onRetry: () => void;
  isFocused?: boolean;
}

export const TvRetryButton: React.FC<TvRetryButtonProps> = ({ onRetry, isFocused: externalFocused }) => {
  const { ref, isFocused: hookFocused } = useTvFocus<HTMLButtonElement>({
    id: 'btn-retry',
    autoFocus: true,
    onSelect: onRetry,
    groupId: 'error-screen',
  });

  const focused = externalFocused !== undefined ? externalFocused : hookFocused;

  return (
    <button
      ref={ref}
      onClick={onRetry}
      className={`px-6 py-2.5 bg-brand text-slate-950 font-extrabold text-sm rounded-xl transition-all duration-150 cursor-pointer ${
        focused
          ? 'shadow-tv-focus scale-105 ring-4 ring-white/50'
          : 'hover:bg-amber-400 opacity-90'
      }`}
    >
      Coba Lagi (OK)
    </button>
  );
};

export interface TvHomePageProps {
  onPlayVideo: (slug: string) => void;
}

export const TvHomePage: React.FC<TvHomePageProps> = ({ onPlayVideo }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'playlist' | 'history'>('home');
  const [feed, setFeed] = useState<HomeFeedData | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    SpatialNavigation.setScope(null);
    try {
      await initTvSession();
      if (activeTab === 'home' || activeTab === 'history') {
        const data = await fetchHomeFeed();
        setFeed(data);
      } else if (activeTab === 'playlist') {
        const data = await fetchPlaylist();
        setPlaylistVideos(data.items || []);
      }
    } catch (err: any) {
      console.error('Failed to load TV feed:', err);
      const detail = err?.message || String(err);
      setError(`Gagal menghubungkan ke server TV: ${detail}`);
      SpatialNavigation.setScope('error-screen');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const unbindKeys = SpatialNavigation.initGlobalKeyboardListener();
    loadData();

    return () => {
      unbindKeys();
    };
  }, [loadData]);

  const handleTabChange = (tab: 'home' | 'playlist' | 'history') => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background text-white px-12 py-8 select-none">
      <TvNavbar activeTab={activeTab} onSelectTab={handleTabChange} />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <span className="text-sm font-medium text-slate-400">
            Menghubungkan ke Lapor Pak! Hub...
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-sm text-slate-300 max-w-md text-center">{error}</p>
          <TvRetryButton onRetry={loadData} />
        </div>
      ) : activeTab === 'playlist' ? (
        <main>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-black text-white">Semua Episode Playlist</h2>
            <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
              {playlistVideos.length} Episode
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-16">
            {playlistVideos.map((video, idx) => (
              <TvVideoCard
                key={video.id}
                id={`playlist-card-${idx}`}
                video={video}
                className="w-full"
                onSelect={() => onPlayVideo(video.slug)}
              />
            ))}
          </div>
        </main>
      ) : (
        <main>
          {/* Hero Spotlight for latest video */}
          {feed?.hero && (
            <TvHeroSpotlight
              video={feed.hero}
              onPlay={(slug) => onPlayVideo(slug)}
            />
          )}

          {/* Continue Watching Rail */}
          {feed?.continue_watching && feed.continue_watching.length > 0 && (
            <TvRowRail
              railId="rail-continue"
              title="Lanjutkan Menonton"
              videos={feed.continue_watching}
              onSelectVideo={(v) => onPlayVideo(v.slug)}
            />
          )}

          {/* Recent Months Rails */}
          {feed?.recent_months?.map((group, idx) => (
            <TvRowRail
              key={group.month}
              railId={`rail-month-${idx}`}
              title={`Episode ${group.month}`}
              videos={group.videos}
              onSelectVideo={(v) => onPlayVideo(v.slug)}
            />
          ))}
        </main>
      )}
    </div>
  );
};
