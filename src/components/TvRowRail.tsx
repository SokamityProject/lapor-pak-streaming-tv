import React from 'react';
import { VideoItem } from '../types/api';
import { TvVideoCard } from './TvVideoCard';
import { Clock, FolderArchive } from 'lucide-react';

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

  const isContinueWatching = title.toLowerCase().includes('lanjutkan');

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-3">
        {isContinueWatching ? (
          <Clock className="w-4 h-4 text-brand" />
        ) : (
          <FolderArchive className="w-4 h-4 text-blue-400" />
        )}
        <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
          {title}
        </h3>
        <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
          {videos.length}
        </span>
      </div>

      <div className="flex gap-6 overflow-x-auto py-2 px-1 -mx-1 scrollbar-none">
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
