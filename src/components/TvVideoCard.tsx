import React, { useState } from 'react';
import { VideoItem } from '../types/api';
import { useTvFocus } from '../hooks/useTvFocus';
import { Tv } from 'lucide-react';

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

  const [imgSrc, setImgSrc] = useState<string>(video.thumbnail || '');
  const [hasError, setHasError] = useState(false);

  const handleImgError = () => {
    if (imgSrc && !imgSrc.startsWith('http')) {
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
      className={`relative flex flex-col bg-slate-900/90 rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${className} ${
        focused
          ? 'border-brand scale-108 shadow-[0_12px_36px_rgba(245,158,11,0.35)] ring-4 ring-brand/40 z-20 bg-slate-800'
          : 'border-slate-800/80 opacity-90 hover:opacity-100 hover:border-slate-700'
      }`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {imgSrc && !hasError ? (
          <img
            src={imgSrc}
            alt={video.title}
            onError={handleImgError}
            className="w-full h-full object-cover transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-slate-500">
            <Tv className="w-10 h-10 text-brand/60" />
            <span className="text-xs font-bold text-slate-400 text-center line-clamp-1">
              Lapor Pak!
            </span>
          </div>
        )}

        {/* Episode Badge */}
        <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md border border-slate-700 text-brand text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-md">
          EPS. {video.episode}
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute top-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-200 text-xs font-semibold px-2 py-1 rounded-lg shadow-md">
            {video.duration}
          </div>
        )}

        {/* Progress Bar */}
        {video.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-950/90">
            <div
              className="h-full bg-brand transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ width: `${Math.min(100, Math.max(0, video.progress))}%` }}
            />
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="p-4 bg-slate-900/95 flex flex-col gap-1.5 border-t border-slate-800/60">
        <h3 className={`font-extrabold text-base line-clamp-1 transition-colors ${
          focused ? 'text-brand' : 'text-white'
        }`}>
          {video.title}
        </h3>
        <span className="text-xs font-medium text-slate-400">
          Episode {video.episode}
        </span>
      </div>
    </div>
  );
};
