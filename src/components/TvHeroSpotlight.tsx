import React, { useState } from 'react';
import { VideoItem } from '../types/api';
import { useTvFocus } from '../hooks/useTvFocus';
import { Play, Sparkles, Clock, ShieldCheck } from 'lucide-react';

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

  const progress = video.progress || 0;
  const isCompleted = video.is_completed || progress >= 99;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-8 border border-white/10 bg-[#0C111A] shadow-xl">
      {/* Background artwork with dual soft fades */}
      <div className="absolute inset-0 pointer-events-none">
        {backdropSrc && !backdropError && (
          <img
            src={backdropSrc}
            alt={video.title}
            onError={handleBackdropError}
            className="w-full h-full object-cover object-center opacity-40 transform scale-102 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080B11] via-[#080B11]/90 via-50% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080B11] via-transparent to-transparent" />
      </div>

      {/* Hero Content - Compact & Balanced */}
      <div className="relative z-10 p-6 sm:p-7 md:p-8 flex flex-col justify-between min-h-[240px] md:min-h-[260px] max-w-2xl">
        {/* Top: Metadata tags */}
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
            Terbaru
          </span>
          <span className="text-zinc-200 font-bold">EPS. {video.episode}</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 text-zinc-300">
            <Clock className="w-3 h-3 text-zinc-400" />
            {video.duration || '45:00'}
          </span>
        </div>

        {/* Center: Title & Synopsis */}
        <div className="my-1.5 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug line-clamp-2">
            {video.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2 max-w-xl">
            Gelar perkara dan sketsa interogasi komedi resmi Pasukan Lapor Pak! TRANS7 bersama Komandan Andre, Wendy, Andhika, Surya, Hesti, dan Kiky.
          </p>
        </div>

        {/* Bottom: Action CTA */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            ref={playFocus.ref}
            onClick={() => onPlay(video.slug)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
              playFocus.isFocused
                ? 'bg-amber-500 text-slate-950 font-black scale-105 shadow-tv-card-focus ring-4 ring-white/80'
                : 'bg-white hover:bg-zinc-200 text-slate-950 font-bold shadow-md'
            }`}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            <span>
              {progress > 0 && !isCompleted ? 'Lanjutkan Menonton (OK)' : 'Tonton Sekarang (OK)'}
            </span>
          </button>

          {progress > 0 && !isCompleted ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{progress}% selesai</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Selesai Ditonton</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
