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
    <div className="mb-12">
      <div className="flex items-center gap-3.5 mb-4">
        <div className="flex items-center gap-2.5">
          {isContinueWatching ? (
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderArchive className="w-4 h-4" />
            </div>
          )}
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {title}
          </h3>
        </div>

        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-full">
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
