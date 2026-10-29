import React, { useEffect, useState, useCallback, useRef } from 'react';
import { HomeFeedData, VideoItem } from '../types/api';
import { fetchHomeFeed, fetchPlaylist, initTvSession } from '../services/api';
import { TvSidebar } from '../components/TvSidebar';
import { TvHeroSpotlight } from '../components/TvHeroSpotlight';
import { TvRowRail } from '../components/TvRowRail';
import { TvVideoCard } from '../components/TvVideoCard';
import { TvExitModal, exitTvApp } from '../components/TvExitModal';
import { SpatialNavigation } from '../services/navigation';
import { useTvFocus } from '../hooks/useTvFocus';
import { getAllWatchedVideos } from '../services/localProgress';
import { Loader2, AlertTriangle, Tv, FolderArchive, History } from 'lucide-react';

export interface TvRetryButtonProps {
  onRetry: () => void;
  isFocused?: boolean;
}

export const TvRetryButton: React.FC<TvRetryButtonProps> = ({
  onRetry,
  isFocused: externalFocused,
}) => {
  const { ref, isFocused: hookFocused } = useTvFocus<HTMLButtonElement>({
    id: 'btn-retry',
    autoFocus: true,
    onSelect: onRetry,
  });

  const focused = externalFocused !== undefined ? externalFocused : hookFocused;

  return (
    <button
      ref={ref}
      id="btn-retry"
      data-testid="btn-retry"
      onClick={onRetry}
      className={`px-8 py-3 bg-brand text-slate-950 font-black text-sm rounded-xl transition-all duration-100 cursor-pointer ${
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
  onExitApp?: () => void;
}

export const TvHomePage: React.FC<TvHomePageProps> = ({
  onPlayVideo,
  onExitApp,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'playlist' | 'history'>('home');
  const [feed, setFeed] = useState<HomeFeedData | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<VideoItem[]>([]);
  const [historyVideos, setHistoryVideos] = useState<VideoItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const previousFocusRef = useRef<string | null>(null);

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

  const handleTabChange = useCallback(
    async (tab: 'home' | 'playlist' | 'history') => {
      setActiveTab(tab);
      SpatialNavigation.setActiveSidebarItem(`nav-${tab}`);
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
    },
    [playlistVideos.length]
  );

  const handleOpenExitModal = useCallback(() => {
    previousFocusRef.current = SpatialNavigation.getCurrentFocus();
    setShowExitModal(true);
  }, []);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
    const restoreFocus = previousFocusRef.current || `nav-${activeTab}`;
    SpatialNavigation.setFocus(restoreFocus);
  }, [activeTab]);

  const handleConfirmExit = useCallback(() => {
    if (onExitApp) {
      onExitApp();
    } else {
      exitTvApp();
    }
  }, [onExitApp]);

  // Two-tier remote back handler
  const handleRemoteBack = useCallback(() => {
    if (showExitModal) {
      handleCancelExit();
      return;
    }

    const currentFocus = SpatialNavigation.getCurrentFocus();
    if (currentFocus && currentFocus.startsWith('nav-')) {
      handleOpenExitModal();
    } else {
      const targetNav = `nav-${activeTab}`;
      SpatialNavigation.setActiveSidebarItem(targetNav);
      SpatialNavigation.setFocus(targetNav);
    }
  }, [showExitModal, activeTab, handleCancelExit, handleOpenExitModal]);

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
        e.stopPropagation();
        handleRemoteBack();
      }
    };

    const handleCustomBack = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      handleRemoteBack();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('tvbackbutton', handleCustomBack);
    document.addEventListener('backbutton', handleCustomBack);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('tvbackbutton', handleCustomBack);
      document.removeEventListener('backbutton', handleCustomBack);
    };
  }, [handleRemoteBack]);

  return (
    <div className="flex h-screen w-screen bg-[#060913] text-white overflow-hidden select-none">
      {/* Left Pane: Sidebar */}
      <TvSidebar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenExitModal={handleOpenExitModal}
      />

      {/* Right Pane: Content Feed */}
      <div className="flex-1 h-full overflow-y-auto px-8 md:px-12 py-6 scrollbar-none ml-20">
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-brand" />
            </div>
            <p className="text-sm font-bold text-zinc-300">
              Menghubungkan ke Lapor Pak! TV...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center max-w-md space-y-1">
              <h3 className="text-sm font-bold text-white">Gagal Memuat Konten</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
            </div>
            <TvRetryButton onRetry={initData} />
          </div>
        ) : activeTab === 'playlist' ? (
          <main className="pb-8">
            <div className="flex items-center gap-2 mb-4">
              <FolderArchive className="w-4 h-4 text-brand" />
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                Semua Berkas Playlist
              </h2>
              <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                {playlistVideos.length} Berkas
              </span>
            </div>

            {isTabLoading ? (
              <div className="flex items-center justify-center py-16 text-zinc-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-brand" />
                <span className="text-xs font-medium">Memuat berkas playlist...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
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
          <main className="pb-8">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-blue-400" />
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                Riwayat Tontonan TV Ini
              </h2>
              <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                {historyVideos.length} Episode
              </span>
            </div>

            {historyVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500 bg-[#0F172A]/50 border border-white/5 rounded-xl">
                <Tv className="w-10 h-10 text-zinc-500 mb-2" />
                <p className="text-sm font-bold text-zinc-300">
                  Belum ada riwayat tontonan di TV ini.
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm text-center">
                  Episode komedi yang Anda tonton di TV akan otomatis tercatat di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
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
          <main className="pb-8">
            {/* Hero Billboard / Spotlight */}
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

      {/* Exit Confirmation Modal */}
      <TvExitModal
        isOpen={showExitModal}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </div>
  );
};
