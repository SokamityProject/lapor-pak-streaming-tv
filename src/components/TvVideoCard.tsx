import React, { useState } from 'react';
import { VideoItem } from '../types/api';
import { useTvFocus } from '../hooks/useTvFocus';
import { Play, Check, Calendar, Tv } from 'lucide-react';

export interface TvVideoCardProps {
  video: VideoItem;
  isFocused?: boolean;
  onSelect: () => void;
  id?: string;
  className?: string;
}

export const TvVideoCard: React.FC<TvVideoCardProps> = ({
  video,
  isFocused: externalFocused,
  onSelect,
  id = `video-${video.id}`,
  className = 'w-80 shrink-0',
}) => {
  const { ref, isFocused: hookFocused } = useTvFocus({
    id,
    onSelect,
  });

  const focused = externalFocused !== undefined ? externalFocused : hookFocused;

  const [imgSrc, setImgSrc] = useState<string>(video.thumbnail || '/assets/img/og/default.png');
  const [hasError, setHasError] = useState(false);

  const handleImgError = () => {
    if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('/assets/img/og')) {
      const cleanPath = imgSrc.startsWith('/') ? imgSrc : `/${imgSrc}`;
      setImgSrc(`https://laporpak.my.to${cleanPath}`);
    } else if (imgSrc !== '/assets/img/og/default.png') {
      setImgSrc('/assets/img/og/default.png');
    } else {
      setHasError(true);
    }
  };

  const progress = video.progress || 0;
  const isCompleted = video.is_completed || progress >= 99;

  // Format YYYY-MM-DD into localized Indonesian date (e.g. "25 Mar 2024")
  const formatEpisodeDate = (ep: string) => {
    if (!ep) return 'Episode Baru';
    const match = ep.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return ep.startsWith('EPS.') || ep.startsWith('Eps.') ? ep : `Episode ${ep}`;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const [, y, m, d] = match;
    const mIdx = parseInt(m, 10) - 1;
    return `${parseInt(d, 10)} ${months[mIdx] || m} ${y}`;
  };

  const formattedDate = formatEpisodeDate(video.episode);

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={`group relative flex flex-col bg-[#0C111A] rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${className} ${
        focused
          ? 'border-brand scale-108 shadow-tv-card-focus ring-4 ring-brand/40 z-20 bg-[#111724]'
          : 'border-white/10 opacity-95 hover:opacity-100 hover:border-white/20 shadow-tv-card'
      }`}
    >
      {/* 1. Thumbnail Container matching Web VideoCard */}
      <div className="relative aspect-video w-full bg-[#080B11] overflow-hidden flex items-center justify-center">
        {imgSrc && !hasError ? (
          <img
            src={imgSrc}
            alt={video.title}
            onError={handleImgError}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              focused ? 'scale-105' : 'scale-100'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-zinc-500">
            <Tv className="w-10 h-10 text-amber-500/60" />
            <span className="text-xs font-bold text-zinc-400 text-center line-clamp-1">
              Lapor Pak!
            </span>
          </div>
        )}

        {/* Ambient Dark Scrim on Focus */}
        <div
          className={`absolute inset-0 bg-black/35 transition-colors duration-200 ${
            focused ? 'bg-black/55' : 'bg-black/25'
          }`}
        />

        {/* Center Play Icon reveal on TV Focus */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
            focused ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl">
            <Play className="w-5 h-5 fill-current ml-0.5 stroke-[2]" />
          </div>
        </div>

        {/* Top-Left: Episode Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black text-amber-400 border border-white/10 shadow-sm">
          EPS. {video.episode}
        </div>

        {/* Top-Right: Status Badge (Selesai / Progress %) */}
        {isCompleted ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-400 text-[10px] font-bold border border-emerald-500/50 backdrop-blur-md shadow-sm">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Selesai</span>
          </div>
        ) : progress > 0 ? (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-extrabold shadow-sm">
            {progress}%
          </div>
        ) : null}

        {/* Bottom-Right: Duration pill */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[10px] font-semibold text-zinc-200 border border-white/10 shadow-sm">
            {video.duration}
          </div>
        )}

        {/* Bottom edge progress bar */}
        {progress > 0 && !isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/70">
            <div
              className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.9)]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>

      {/* 2. Title & Metadata matching Web VideoCard */}
      <div className="p-3.5 bg-[#0C111A] flex flex-col gap-1.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <h3
          className={`font-bold text-sm md:text-base line-clamp-1 leading-snug transition-colors ${
            focused ? 'text-amber-400' : 'text-white'
          }`}
        >
          {video.title}
        </h3>
      </div>
    </div>
  );
};
