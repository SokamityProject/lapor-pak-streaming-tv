import React from 'react';
import { VideoItem } from '../types/api';
import { TvVideoCard } from './TvVideoCard';

export interface TvRowRailProps {
  title: string;
  videos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
  railId: string;
}

export const TvRowRail: React.FC<TvRowRailProps> = ({
  title,
  videos,
  onSelectVideo,
  railId,
}) => {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xl md:text-2xl font-black text-white tracking-wide">
          {title}
        </h3>
        <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
          {videos.length} Episode
        </span>
      </div>

      <div className="flex gap-7 lg:gap-8 overflow-x-auto py-6 px-3 -mx-3 scrollbar-none scroll-smooth">
        {videos.map((video, idx) => (
          <TvVideoCard
            key={video.id}
            id={`${railId}-card-${idx}`}
            video={video}
            onSelect={() => onSelectVideo(video)}
          />
        ))}
      </div>
    </div>
  );
};
