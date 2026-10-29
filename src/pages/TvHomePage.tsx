import React, { useEffect, useState } from 'react';
import { HomeFeedData, VideoItem } from '../types/api';
import { fetchHomeFeed, initTvSession } from '../services/api';
import { TvNavbar } from '../components/TvNavbar';
import { TvHeroSpotlight } from '../components/TvHeroSpotlight';
import { TvRowRail } from '../components/TvRowRail';
import { SpatialNavigation } from '../services/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

export interface TvHomePageProps {
  onPlayVideo: (slug: string) => void;
}

export const TvHomePage: React.FC<TvHomePageProps> = ({ onPlayVideo }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'playlist' | 'history'>('home');
  const [feed, setFeed] = useState<HomeFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unbindKeys = SpatialNavigation.initGlobalKeyboardListener();

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        await initTvSession();
        const data = await fetchHomeFeed();
        setFeed(data);
      } catch (err: any) {
        console.error('Failed to load TV feed:', err);
        setError('Gagal menghubungkan ke server TV. Pastikan koneksi internet aktif.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      unbindKeys();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-white px-12 py-8 select-none">
      <TvNavbar activeTab={activeTab} onSelectTab={setActiveTab} />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <span className="text-sm font-medium text-slate-400">
            Menghubungkan ke Lapor Pak! Hub...
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm text-slate-300 max-w-md text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-brand text-slate-950 font-bold text-xs rounded-lg shadow-tv-focus"
          >
            Coba Lagi (OK)
          </button>
        </div>
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
