import React, { useEffect, useState, useCallback } from 'react';
import { HomeFeedData, VideoItem } from '../types/api';
import { fetchHomeFeed, fetchPlaylist, initTvSession } from '../services/api';
import { TvNavbar } from '../components/TvNavbar';
import { TvHeroSpotlight } from '../components/TvHeroSpotlight';
import { TvRowRail } from '../components/TvRowRail';
import { TvVideoCard } from '../components/TvVideoCard';
import { SpatialNavigation } from '../services/navigation';
import { useTvFocus } from '../hooks/useTvFocus';
import { getAllWatchedVideos } from '../services/localProgress';
import { Loader2, AlertTriangle, Tv, FolderArchive, History } from 'lucide-react';

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
      className={`px-8 py-3 bg-brand text-slate-950 font-black text-sm rounded-xl transition-all duration-150 cursor-pointer ${
        focused
          ? 'shadow-tv-focus scale-105 ring-4 ring-white/60'
          : 'hover:bg-amber-400 opacity-90 shadow-md'
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
  const [historyVideos, setHistoryVideos] = useState<VideoItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initData = useCallback(async () => {
    setIsInitialLoading(true);
    setError(null);
    SpatialNavigation.setScope(null);
    try {
      await initTvSession();
      const homeData = await fetchHomeFeed();
      setFeed(homeData);
      setHistoryVideos(getAllWatchedVideos());
    } catch (err: any) {
      console.error('Failed to load TV feed:', err);
      const detail = err?.message || String(err);
      setError(`Gagal menghubungkan ke server TV: ${detail}`);
      SpatialNavigation.setScope('error-screen');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    const unbindKeys = SpatialNavigation.initGlobalKeyboardListener();
    initData();

    return () => {
      unbindKeys();
    };
  }, [initData]);

  const handleTabChange = useCallback(async (tab: 'home' | 'playlist' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      setHistoryVideos(getAllWatchedVideos());
    } else if (tab === 'playlist' && playlistVideos.length === 0) {
      setIsTabLoading(true);
      try {
        const data = await fetchPlaylist();
        setPlaylistVideos(data.items || []);
      } catch (e) {
        console.error('Failed to load playlist:', e);
      } finally {
        setIsTabLoading(false);
      }
    }
  }, [playlistVideos.length]);

  return (
    <div className="h-screen overflow-y-auto scrollbar-none ambient-precinct-bg text-white px-8 md:px-12 py-3 select-none scroll-smooth">
      <TvNavbar activeTab={activeTab} onSelectTab={handleTabChange} />

      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-lg">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
          <p className="text-sm font-bold text-zinc-300">
            Menghubungkan ke Lapor Pak! TV...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="text-center max-w-lg space-y-1.5">
            <h3 className="text-base font-bold text-white">Gagal Memuat Konten</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
          </div>
          <TvRetryButton onRetry={initData} />
        </div>
      ) : activeTab === 'playlist' ? (
        <main className="animate-fade-in pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FolderArchive className="w-4 h-4" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Semua Berkas Playlist
            </h2>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              {playlistVideos.length} Berkas
            </span>
          </div>

          {isTabLoading ? (
            <div className="flex items-center justify-center py-20 text-zinc-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs font-semibold">Memuat berkas playlist...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 pb-12">
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
          )}
        </main>
      ) : activeTab === 'history' ? (
        <main className="animate-fade-in pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Riwayat Tontonan TV Ini
            </h2>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              {historyVideos.length} Episode
            </span>
          </div>

          {historyVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-[#0C111A]/60 border border-white/5 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-3">
                <Tv className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-300">
                Belum ada riwayat tontonan di perangkat TV ini.
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center">
                Episode komedi yang Anda tonton di TV ini akan otomatis disimpan secara lokal di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 pb-12">
              {historyVideos.map((video, idx) => (
                <TvVideoCard
                  key={video.id}
                  id={`history-card-${idx}`}
                  video={video}
                  className="w-full"
                  onSelect={() => onPlayVideo(video.slug)}
                />
              ))}
            </div>
          )}
        </main>
      ) : (
        <main className="animate-fade-in pb-12">
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
