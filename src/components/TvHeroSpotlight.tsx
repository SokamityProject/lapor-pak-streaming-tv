import React, { useState } from 'react';
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

  const [backdropSrc, setBackdropSrc] = useState<string>(video?.thumbnail || '');
  const [backdropError, setBackdropError] = useState(false);

  const handleBackdropError = () => {
    if (backdropSrc && !backdropSrc.startsWith('http')) {
      const cleanPath = backdropSrc.startsWith('/') ? backdropSrc : `/${backdropSrc}`;
      setBackdropSrc(`https://laporpak.my.to${cleanPath}`);
    } else {
      setBackdropError(true);
    }
  };

  if (!video) return null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden mb-12 border border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-10 md:p-12 shadow-2xl">
      {/* Background artwork */}
      {backdropSrc && !backdropError && (
        <div className="absolute right-0 top-0 bottom-0 w-3/5 opacity-40 overflow-hidden pointer-events-none">
          <img
            src={backdropSrc}
            alt=""
            onError={handleBackdropError}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>
      )}

      <div className="max-w-2xl z-10 relative">
        <div className="inline-flex items-center gap-2 bg-red-600 text-white font-black text-xs px-3.5 py-1.5 rounded-lg mb-4 tracking-wider shadow-md">
          <span>EPISODE TERBARU</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px]">EPS. {video.episode}</span>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
          {video.title}
        </h2>

        <p className="text-slate-300 text-sm md:text-base line-clamp-3 mb-8 leading-relaxed max-w-xl">
          Saksikan aksi lucu Komandan Andre, Wendy Cagur, Andhika Pratama, Surya Insomnia, Hesti Purwadinata, dan Kiky Saputri dalam memecahkan kasus-kasus kriminal penuh tawa.
        </p>

        <div className="flex items-center gap-5">
          <button
            ref={playFocus.ref}
            onClick={() => onPlay(video.slug)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-base transition-all duration-200 cursor-pointer ${
              playFocus.isFocused
                ? 'bg-brand text-slate-950 scale-108 shadow-[0_12px_36px_rgba(245,158,11,0.4)] ring-4 ring-brand/40'
                : 'bg-brand text-slate-950 hover:bg-amber-400'
            }`}
          >
            <Play className="w-5 h-5 fill-current stroke-[2.5]" />
            <span>Putar Sekarang (OK)</span>
          </button>

          <span className="text-slate-400 text-sm font-semibold bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-xl">
            Durasi: {video.duration || '45:00'}
          </span>
        </div>
      </div>
    </div>
  );
};
