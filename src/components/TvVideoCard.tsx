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
  className = 'w-64 shrink-0',
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

  const formatEpisodeDate = (ep: string, dateStr?: string) => {
    if (dateStr) {
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const [, y, m, d] = match;
        const mIdx = parseInt(m, 10) - 1;
        return `${parseInt(d, 10)} ${months[mIdx] || m} ${y}`;
      }
      return dateStr;
    }
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

  const formattedDate = formatEpisodeDate(video.episode, video.created_at);

  const formatDisplayTitle = (title: string) => {
    if (!title) return 'Eps.';
    const trimmed = title.trim();
    if (/^eps\.?/i.test(trimmed)) {
      return trimmed.replace(/^eps\.?\s*/i, 'Eps. ');
    }
    if (/^episode\s*/i.test(trimmed)) {
      return trimmed.replace(/^episode\s*/i, 'Eps. ');
    }
    return `Eps. ${trimmed}`;
  };

  const displayTitle = formatDisplayTitle(video.title);

  return (
    <div
      ref={ref}
      id={id}
      onClick={onSelect}
      className={`group relative flex flex-col bg-[#0F172A] rounded-xl overflow-hidden border-2 transition-transform duration-100 cursor-pointer origin-center ${className} ${
        focused
          ? 'border-brand scale-108 shadow-md ring-2 ring-brand/40 z-20 bg-[#1E293B]'
          : 'border-white/10 opacity-90'
      }`}
    >
      {/* 1. Thumbnail Container (Fixed 16:9 aspect ratio) */}
      <div className="relative aspect-video w-full bg-[#080B11] overflow-hidden flex items-center justify-center">
        {imgSrc && !hasError ? (
          <img
            src={imgSrc}
            alt={displayTitle}
            onError={handleImgError}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-zinc-500">
            <Tv className="w-8 h-8 text-brand/60" />
            <span className="text-xs font-bold text-zinc-400 text-center line-clamp-1">
              Lapor Pak!
            </span>
          </div>
        )}

        {/* Center Play Icon on Focus */}
        {focused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-brand text-slate-950 flex items-center justify-center shadow-md">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
        )}

        {/* Top-Right: Status Badge */}
        {isCompleted ? (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 text-[10px] font-bold border border-emerald-500/50 shadow">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Selesai</span>
          </div>
        ) : progress > 0 ? (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-brand text-slate-950 text-[10px] font-extrabold shadow">
            {progress}%
          </div>
        ) : null}

        {/* Bottom-Right: Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-semibold text-zinc-200 border border-white/10 shadow tracking-wide">
            {video.duration}
          </div>
        )}

        {/* Bottom edge progress bar for continuing episodes */}
        {progress > 0 && !isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/70">
            <div
              className="h-full bg-brand transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>

      {/* 2. Title & Metadata */}
      <div className="p-2.5 bg-[#0F172A] flex flex-col gap-1 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
          <Calendar className="w-3 h-3 text-brand shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <h3
          className={`font-bold text-xs sm:text-sm line-clamp-1 leading-snug transition-colors ${
            focused ? 'text-brand' : 'text-white'
          }`}
          title={displayTitle}
        >
          {displayTitle}
        </h3>
      </div>
    </div>
  );
};
