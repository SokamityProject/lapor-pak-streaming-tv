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
    <div className="mb-8">
      <h3 className="text-base font-bold text-slate-200 mb-3.5 tracking-wide flex items-center gap-2">
        <span>{title}</span>
        <span className="text-xs font-normal text-slate-500">({videos.length} episode)</span>
      </h3>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth">
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
