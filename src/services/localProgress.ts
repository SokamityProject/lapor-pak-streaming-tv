import { HomeFeedData, PlaylistData, VideoItem, WatchVideoDetails } from '../types/api';

export interface LocalWatchRecord {
  videoId: number;
  slug: string;
  title: string;
  episode: string;
  thumbnail: string;
  duration: string;
  durationSec: number;
  lastTime: number;
  progress: number; // 0 to 100
  isCompleted: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'laporpak_tv_local_progress';

let memoryCache: Record<number, LocalWatchRecord> | null = null;

function loadStore(): Record<number, LocalWatchRecord> {
  if (memoryCache !== null) return memoryCache;

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryCache = JSON.parse(raw);
        return memoryCache || {};
      }
    }
  } catch (e) {
    console.warn('Failed to read local TV watch progress:', e);
  }

  memoryCache = {};
  return memoryCache;
}

function persistStore(): void {
  if (!memoryCache) return;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
    }
  } catch (e) {
    console.warn('Failed to persist local TV watch progress:', e);
  }
}

/**
 * Parse a duration string ("45:30", "01:10:00") into total seconds.
 */
export function parseDurationToSeconds(duration?: string | number): number {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;

  const parts = duration.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  return parseInt(duration, 10) || 0;
}

/**
 * Retrieve local watch progress for a video ID.
 */
export function getLocalProgress(videoId: number): LocalWatchRecord | null {
  const store = loadStore();
  return store[videoId] || null;
}

/**
 * Save playback position locally on this TV device.
 */
export function saveLocalProgress(
  video: {
    id: number;
    slug: string;
    title?: string;
    episode?: string;
    thumbnail?: string;
    duration?: string;
  },
  currentTime: number,
  durationSec?: number,
  isCompleted?: boolean
): LocalWatchRecord {
  const store = loadStore();
  const durSec = durationSec || parseDurationToSeconds(video.duration) || 2400; // fallback 40m
  const completed =
    isCompleted !== undefined
      ? isCompleted
      : durSec > 0 && currentTime >= durSec * 0.95;

  let progress = 0;
  if (completed) {
    progress = 100;
  } else if (durSec > 0 && currentTime > 0) {
    progress = Math.max(1, Math.min(99, Math.floor((currentTime / durSec) * 100)));
  }

  const existing = store[video.id];

  const record: LocalWatchRecord = {
    videoId: video.id,
    slug: video.slug,
    title: video.title || existing?.title || `Episode ${video.episode || video.id}`,
    episode: video.episode || existing?.episode || String(video.id),
    thumbnail: video.thumbnail || existing?.thumbnail || '',
    duration: video.duration || existing?.duration || '45:00',
    durationSec: durSec,
    lastTime: completed ? 0 : Math.floor(currentTime),
    progress,
    isCompleted: completed,
    updatedAt: Date.now(),
  };

  store[video.id] = record;
  persistStore();
  return record;
}

/**
 * Get all in-progress videos watched on this TV device, sorted by most recently watched.
 */
export function getContinueWatchingList(): VideoItem[] {
  const store = loadStore();
  const records = Object.values(store)
    .filter((r) => !r.isCompleted && r.progress > 0 && r.progress < 95)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return records.map((r) => ({
    id: r.videoId,
    title: r.title,
    episode: r.episode,
    thumbnail: r.thumbnail,
    duration: r.duration,
    slug: r.slug,
    progress: r.progress,
    last_time: r.lastTime,
    is_completed: false,
  }));
}

/**
 * Get all videos that have been watched on this TV device, sorted by most recently watched.
 */
export function getAllWatchedVideos(): VideoItem[] {
  const store = loadStore();
  const records = Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);

  return records.map((r) => ({
    id: r.videoId,
    title: r.title,
    episode: r.episode,
    thumbnail: r.thumbnail,
    duration: r.duration,
    slug: r.slug,
    progress: r.progress,
    last_time: r.lastTime,
    is_completed: r.isCompleted,
  }));
}

/**
 * Overlay local watch progress onto a VideoItem.
 */
export function applyLocalProgressToVideo(video: VideoItem): VideoItem {
  const local = getLocalProgress(video.id);
  if (local) {
    return {
      ...video,
      progress: local.progress,
      last_time: local.lastTime,
      is_completed: local.isCompleted,
    };
  }
  return {
    ...video,
    progress: 0,
    last_time: 0,
    is_completed: false,
  };
}

/**
 * Overlay local resume_time onto WatchVideoDetails.
 */
export function applyLocalProgressToWatchDetails(details: WatchVideoDetails): WatchVideoDetails {
  const local = getLocalProgress(details.id);
  if (local) {
    return {
      ...details,
      resume_time: local.isCompleted ? 0 : local.lastTime,
      is_completed: local.isCompleted,
    };
  }
  return {
    ...details,
    resume_time: 0,
    is_completed: false,
  };
}

/**
 * Transform entire HomeFeedData using local TV storage.
 */
export function applyLocalProgressToFeed(feed: HomeFeedData): HomeFeedData {
  const hero = feed.hero ? applyLocalProgressToVideo(feed.hero) : null;
  const continue_watching = getContinueWatchingList();

  const recent_months = (feed.recent_months || []).map((m) => ({
    ...m,
    videos: (m.videos || []).map(applyLocalProgressToVideo),
  }));

  return {
    ...feed,
    hero,
    continue_watching,
    recent_months,
  };
}

/**
 * Transform PlaylistData using local TV storage.
 */
export function applyLocalProgressToPlaylist(playlist: PlaylistData): PlaylistData {
  return {
    ...playlist,
    items: (playlist.items || []).map(applyLocalProgressToVideo),
  };
}

/**
 * Clear all local progress cache (useful for tests or app reset).
 */
export function clearLocalProgress(): void {
  memoryCache = {};
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignored
  }
}
