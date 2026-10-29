import React, { useState } from 'react';
import { VideoItem } from '../types/api';
import { useTvFocus } from '../hooks/useTvFocus';
import { Play, Sparkles, Clock, CheckCircle } from 'lucide-react';

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
    <div
      onClick={() => onPlay(video.slug)}
      className={`relative w-full rounded-2xl overflow-hidden mb-8 border-2 transition-colors duration-100 bg-[#0F172A] shadow-md cursor-pointer ${
        playFocus.isFocused
          ? 'border-brand ring-2 ring-brand/40 shadow-lg'
          : 'border-white/10'
      }`}
    >
      {/* Background artwork with subtle horizontal fade */}
      <div className="absolute inset-0 pointer-events-none">
        {backdropSrc && !backdropError && (
          <img
            src={backdropSrc}
            alt={video.title}
            onError={handleBackdropError}
            className="w-full h-full object-cover object-center opacity-30"
            loading="eager"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 p-6 md:p-7 flex flex-col justify-between min-h-[220px] max-w-2xl">
        {/* Top: Metadata */}
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand text-slate-950 font-black text-[10px] uppercase">
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
        <div className="my-1 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug line-clamp-1">
            {video.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2 max-w-xl">
            Gelar perkara dan sketsa interogasi komedi resmi Pasukan Lapor Pak! TRANS7 bersama Komandan Andre, Wendy, Andhika, Surya, Hesti, dan Kiky.
          </p>
        </div>

        {/* Bottom: Action CTA Button */}
        <div className="flex items-center gap-3 pt-3">
          <button
            ref={playFocus.ref}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(video.slug);
            }}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-colors duration-100 cursor-pointer ${
              playFocus.isFocused
                ? 'bg-brand text-slate-950 font-black ring-2 ring-white'
                : 'bg-white text-slate-950'
            }`}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            <span>
              {progress > 0 && !isCompleted ? 'Lanjutkan Menonton (OK)' : 'Tonton Sekarang (OK)'}
            </span>
          </button>

          {progress > 0 && !isCompleted ? (
            <span className="text-xs text-brand font-bold bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-lg">
              {progress}% ditonton
            </span>
          ) : isCompleted ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5" />
              Selesai Ditonton
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
