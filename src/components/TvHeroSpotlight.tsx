import React, { useState } from 'react';
import { VideoItem } from '../types/api';
import { useTvFocus } from '../hooks/useTvFocus';
import { Play, Clock, Calendar, CheckCircle } from 'lucide-react';

export interface TvHeroSpotlightProps {
  video: VideoItem | null;
  onPlay: (slug: string) => void;
  isFocused?: boolean;
  autoFocus?: boolean;
}

export const TvHeroSpotlight: React.FC<TvHeroSpotlightProps> = ({
  video,
  onPlay,
  isFocused: externalFocused,
  autoFocus = false,
}) => {
  const playFocus = useTvFocus<HTMLButtonElement>({
    id: 'hero-play-btn',
    onSelect: () => video && onPlay(video.slug),
    autoFocus,
  });

  const isFocused = externalFocused !== undefined ? externalFocused : playFocus.isFocused;

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
  const isResuming = progress > 0 && !isCompleted;

  const formatReleaseDate = (item: VideoItem): string => {
    const rawDate = item.created_at || item.episode || '';
    if (!rawDate) return 'Terbaru';

    const match = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const [, y, m, d] = match;
      const mIdx = parseInt(m, 10) - 1;
      return `${parseInt(d, 10)} ${months[mIdx] || m} ${y}`;
    }

    return rawDate;
  };

  const releaseDate = formatReleaseDate(video);
  const synopsis =
    video.synopsis ||
    video.description ||
    'Gelar perkara dan sketsa interogasi komedi resmi Pasukan Lapor Pak! TRANS7 bersama Komandan Andre, Wendy, Andhika, Surya, Hesti, dan Kiky.';

  const hasEpisodeNumber = video.episode && !video.episode.includes('-');

  return (
    <div
      onClick={() => onPlay(video.slug)}
      className={`relative w-full rounded-2xl overflow-hidden mb-8 border-2 transition-all duration-150 bg-[#0F172A] shadow-md cursor-pointer ${
        isFocused
          ? 'border-brand/80 ring-1 ring-brand/30 shadow-[0_12px_36px_rgba(245,158,11,0.2)]'
          : 'border-white/10'
      }`}
    >
      {/* Background artwork with 0% GPU blur cinema scrim */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {backdropSrc && !backdropError && (
          <img
            src={backdropSrc}
            alt={video.title}
            onError={handleBackdropError}
            className="w-full h-full object-cover object-top sm:object-center opacity-40 scale-105"
            loading="eager"
          />
        )}
        {/* Dark OLED cinema scrim gradients (no laggy CSS blurs) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060913] via-[#060913]/90 via-50% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#060913]/40 to-transparent" />
      </div>

      {/* Hero Billboard Content */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[260px] md:min-h-[300px] max-w-3xl">
        {/* Top: Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-zinc-300 mb-2">
          {/* Channel Badge */}
          <span className="px-2.5 py-0.5 rounded bg-brand text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-sm">
            TRANS7 HD
          </span>

          {/* Release Date */}
          <span className="flex items-center gap-1.5 text-zinc-200">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            <span>{releaseDate}</span>
          </span>

          <span className="text-zinc-600">•</span>

          {/* Duration */}
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{video.duration || '45:00'}</span>
          </span>

          {/* Episode number if distinct from date */}
          {hasEpisodeNumber && (
            <>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-200 font-bold">EPS. {video.episode}</span>
            </>
          )}
        </div>

        {/* Center: Title & Synopsis */}
        <div className="my-2 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
            {video.title}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed line-clamp-3 max-w-2xl font-normal drop-shadow">
            {synopsis}
          </p>
        </div>

        {/* Bottom: Action CTA Button */}
        <div className="flex items-center gap-4 pt-4">
          <button
            ref={playFocus.ref}
            id="hero-play-btn"
            data-testid="hero-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(video.slug);
            }}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
              isFocused
                ? 'ring-2 ring-white bg-brand text-slate-950 font-bold scale-105 shadow-lg'
                : 'bg-white text-slate-950 font-bold hover:bg-zinc-200'
            }`}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            <span>
              {isResuming ? 'Lanjutkan Menonton (OK)' : 'Putar Episode (OK)'}
            </span>
          </button>

          {isResuming ? (
            <span className="text-xs text-brand font-bold bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-lg">
              {progress}% ditonton
            </span>
          ) : isCompleted ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5" />
              Selesai Ditonton
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
