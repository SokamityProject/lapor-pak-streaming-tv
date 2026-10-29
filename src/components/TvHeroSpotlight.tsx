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
    <div className="relative w-full rounded-3xl overflow-hidden mb-12 border border-white/10 bg-[#0C111A] shadow-2xl">
      {/* Background artwork with dual soft fades matching Web App Hero */}
      <div className="absolute inset-0 pointer-events-none">
        {backdropSrc && !backdropError && (
          <img
            src={backdropSrc}
            alt={video.title}
            onError={handleBackdropError}
            className="w-full h-full object-cover object-center opacity-45 transform scale-102 transition-transform duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080B11] via-[#080B11]/90 via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080B11] via-transparent to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 p-8 sm:p-10 md:p-12 flex flex-col justify-between min-h-[320px] max-w-3xl">
        {/* Top: Metadata tags */}
        <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-400 mb-4">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3 h-3 fill-current" />
            Terbaru
          </span>
          <span className="text-zinc-200 font-bold">EPS. {video.episode}</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            {video.duration || '45:00'}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 font-medium">Gelar Perkara TRANS7</span>
        </div>

        {/* Center: Title & Synopsis */}
        <div className="my-2 space-y-3">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
            {video.title}
          </h1>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed max-w-2xl line-clamp-2">
            Gelar perkara dan sketsa interogasi komedi resmi Pasukan Lapor Pak! TRANS7 bersama Komandan Andre, Wendy, Andhika, Surya, Hesti, dan Kiky.
          </p>
        </div>

        {/* Bottom: Action CTA matching Web Hero */}
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <button
            ref={playFocus.ref}
            onClick={() => onPlay(video.slug)}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-base transition-all duration-200 cursor-pointer ${
              playFocus.isFocused
                ? 'bg-amber-500 text-slate-950 font-black scale-105 shadow-tv-card-focus ring-4 ring-white/80'
                : 'bg-white hover:bg-zinc-200 text-slate-950 font-bold shadow-lg'
            }`}
          >
            <Play className="w-5 h-5 fill-current ml-0.5 stroke-[2.5]" />
            <span>
              {progress > 0 && !isCompleted ? 'Lanjutkan Menonton (OK)' : 'Tonton Sekarang (OK)'}
            </span>
          </button>

          {progress > 0 && !isCompleted ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{progress}% terselesaikan di TV</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sudah Selesai Ditonton</span>
            </div>
          ) : null}

          <span className="text-zinc-400 text-xs font-semibold bg-white/[0.04] border border-white/[0.08] px-4 py-3 rounded-xl">
            Kualitas HD 1080p
          </span>
        </div>
      </div>
    </div>
  );
};
