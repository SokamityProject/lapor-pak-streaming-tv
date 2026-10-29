export interface VideoItem {
  id: number;
  title: string;
  episode: string;
  thumbnail: string;
  duration: string;
  slug: string;
  progress: number;
  last_time?: number;
  is_completed?: boolean;
  created_at?: string;
  synopsis?: string;
  description?: string;
}

export interface WatchVideoDetails {
  id: number;
  title: string;
  episode: string;
  thumbnail: string;
  duration: string;
  slug: string;
  hd: string;
  sd: string;
  resume_time: number;
  is_completed: boolean;
}

export interface HomeFeedData {
  total: number;
  hero: VideoItem | null;
  continue_watching: VideoItem[];
  recent_months: {
    month: string;
    videos: VideoItem[];
  }[];
}

export interface PlaylistData {
  items: VideoItem[];
  total: number;
  has_more: boolean;
  next_cursor: string | null;
}
