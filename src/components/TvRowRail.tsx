import React from 'react';
import { VideoItem } from '../types/api';
import { TvVideoCard } from './TvVideoCard';
import { Clock, FolderArchive, Sparkles, Calendar } from 'lucide-react';

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
  const isRecent = title.toLowerCase().includes('terbaru');
  const isMonth = title.toLowerCase().includes('episode') || title.toLowerCase().includes('bulan');

  const renderIcon = () => {
    if (isContinueWatching) {
      return <Clock className="w-4 h-4 text-brand shrink-0" />;
    }
    if (isRecent) {
      return <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (isMonth) {
      return <Calendar className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    return <FolderArchive className="w-4 h-4 text-blue-400 shrink-0" />;
  };

  return (
    <div className="mb-6">
      {/* Rail Header with Category Icon & Count Badge */}
      <div className="flex items-center gap-2 mb-2 px-1">
        {renderIcon()}
        <h3 className="text-base md:text-lg font-black text-white tracking-tight">
          {title}
        </h3>
        <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded-full">
          {videos.length}
        </span>
      </div>

      {/* Horizontal scrolling container with generous headroom so focused cards never clip */}
      <div className="flex gap-6 overflow-x-hidden py-6 px-8 scrollbar-none items-center [scroll-padding-left:2rem] [scroll-padding-right:2rem]">
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
