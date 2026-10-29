import React, { useState } from 'react';
import { VideoItem } from '../types/api';
import { useTvFocus } from '../hooks/useTvFocus';
import { Tv } from 'lucide-react';

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

  const [imgSrc, setImgSrc] = useState<string>(video.thumbnail || '');
  const [hasError, setHasError] = useState(false);

  const handleImgError = () => {
    if (imgSrc && !imgSrc.startsWith('http')) {
      // Fallback from relative path to remote server URL
      const cleanPath = imgSrc.startsWith('/') ? imgSrc : `/${imgSrc}`;
      setImgSrc(`https://laporpak.my.to${cleanPath}`);
    } else {
      setHasError(true);
    }
  };

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
        {imgSrc && !hasError ? (
          <img
            src={imgSrc}
            alt={video.title}
            onError={handleImgError}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-slate-500">
            <Tv className="w-8 h-8 text-brand/60" />
            <span className="text-[11px] font-semibold text-slate-400 text-center line-clamp-1">
              Lapor Pak!
            </span>
          </div>
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
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, video.progress))}%` }}
            />
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="p-3 bg-card flex flex-col gap-1">
        <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-brand">
          {video.title}
        </h3>
        <span className="text-[11px] text-slate-400">
          Episode {video.episode}
        </span>
      </div>
    </div>
  );
};
