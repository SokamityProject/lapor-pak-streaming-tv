import React from 'react';
import { VideoItem } from '../types/api';
import { useTvFocus } from '../hooks/useTvFocus';
import { Play } from 'lucide-react';

export interface TvHeroSpotlightProps {
  video: VideoItem | null;
  onPlay: (slug: string) => void;
}

export const TvHeroSpotlight: React.FC<TvHeroSpotlightProps> = ({ video, onPlay }) => {
  const playFocus = useTvFocus<HTMLButtonElement>({
    id: 'hero-play-btn',
    onSelect: () => video && onPlay(video.slug),
    autoFocus: true,
  });

  if (!video) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-8 border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 shadow-2xl">
      <div className="max-w-2xl z-10 relative">
        <div className="inline-flex items-center gap-2 bg-red-600/90 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-md mb-3 tracking-wider">
          <span>EPISODE TERBARU</span>
          <span className="bg-white/20 px-1 rounded text-[10px]">EPS. {video.episode}</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-tight leading-snug">
          {video.title}
        </h2>

        <p className="text-slate-400 text-xs md:text-sm line-clamp-3 mb-6 leading-relaxed max-w-xl">
          Saksikan aksi lucu Komandan Andre, Wendy Cagur, Andhika Pratama, Surya Insomnia, Hesti Purwadinata, dan Kiky Saputri dalam memecahkan kasus-kasus kriminal penuh tawa.
        </p>

        <div className="flex items-center gap-4">
          <button
            ref={playFocus.ref}
            onClick={() => onPlay(video.slug)}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer ${
              playFocus.isFocused
                ? 'bg-brand text-slate-950 scale-105 shadow-tv-focus ring-4 ring-white/50'
                : 'bg-brand text-slate-950 hover:bg-amber-400'
            }`}
          >
            <Play className="w-4 h-4 fill-current stroke-[2.5]" />
            <span>Putar Sekarang (OK)</span>
          </button>

          <span className="text-slate-400 text-xs font-medium">
            Durasi: {video.duration || '45:00'}
          </span>
        </div>
      </div>
    </div>
  );
};
