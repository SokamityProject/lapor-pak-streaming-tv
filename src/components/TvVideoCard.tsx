import React from 'react';
import { VideoItem } from '../types/api';
import { useTvFocus } from '../hooks/useTvFocus';

export interface TvVideoCardProps {
  video: VideoItem;
  isFocused?: boolean;
  onSelect: () => void;
  id?: string;
}

export const TvVideoCard: React.FC<TvVideoCardProps> = ({
  video,
  isFocused: externalFocused,
  onSelect,
  id = `video-${video.id}`,
}) => {
  const { ref, isFocused: hookFocused } = useTvFocus({
    id,
    onSelect,
  });

  const focused = externalFocused !== undefined ? externalFocused : hookFocused;

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={`relative flex flex-col w-64 bg-card rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
        focused
          ? 'border-brand scale-105 shadow-tv-focus z-10'
          : 'border-slate-800 opacity-85 hover:opacity-100'
      }`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-slate-600 text-xs font-medium">Lapor Pak!</div>
        )}

        {/* Episode Badge */}
        <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-brand text-[11px] font-bold px-2 py-0.5 rounded">
          EPS. {video.episode}
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-sm text-slate-300 text-[11px] font-medium px-1.5 py-0.5 rounded">
            {video.duration}
          </div>
        )}

        {/* Progress Bar */}
        {video.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, video.progress))}%` }}
            />
          </div>
        )}
      </div>

      {/* Title & Info */}
      <div className="p-3 bg-cardSecondary/60 flex-1 flex flex-col justify-between">
        <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 leading-relaxed">
          {video.title}
        </h4>
        {video.last_time !== undefined && video.last_time > 0 && (
          <span className="text-[10px] text-amber-400/90 font-medium mt-1">
            Lanjut menit ke-{Math.floor(video.last_time / 60)}
          </span>
        )}
      </div>
    </div>
  );
};
