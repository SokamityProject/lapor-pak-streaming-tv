import { HomeFeedData, PlaylistData, WatchVideoDetails } from '../types/api';

const DEFAULT_API_BASE = 'https://laporpak.my.to/api';
export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : DEFAULT_API_BASE;

export interface LoginCredentials {
  username: string;
  password: string;
}

const DEFAULT_ADMIN: LoginCredentials = {
  username: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_USER) || 'admin',
  password: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_PASS) || 'admin123',
};

let activeSession = false;
let currentCredentials = DEFAULT_ADMIN;

export function isSessionActive(): boolean {
  return activeSession;
}

/**
 * Perform silent auto-login to backend to establish PHPSESSID session.
 */
export async function initTvSession(credentials?: LoginCredentials): Promise<boolean> {
  if (credentials) {
    currentCredentials = credentials;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(currentCredentials),
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      activeSession = true;
      return true;
    }
    return false;
  } catch (err) {
    console.error('TV Auto-login failed:', err);
    return false;
  }
}

/**
 * Internal fetch wrapper with automatic 401 re-login retry.
 */
async function tvApiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  let res = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    credentials: 'include',
  });

  // If unauthorized, re-authenticate silently once and retry
  if (res.status === 401 && !endpoint.includes('/auth/login')) {
    const relogged = await initTvSession();
    if (relogged) {
      res = await fetch(url, {
        ...options,
        headers: defaultHeaders,
        credentials: 'include',
      });
    }
  }

  if (!res.ok) {
    throw new Error(`API Request to ${endpoint} failed with status ${res.status}`);
  }

  const json = await res.json();
  return (json.data ?? json) as T;
}

/**
 * Fetch home feed data (Hero + Continue Watching + Months).
 */
export async function fetchHomeFeed(): Promise<HomeFeedData> {
  return tvApiFetch<HomeFeedData>('/videos/home');
}

/**
 * Fetch playlist list.
 */
export async function fetchPlaylist(month?: string, search?: string): Promise<PlaylistData> {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (search) params.append('search', search);
  const query = params.toString() ? `?${params.toString()}` : '';
  return tvApiFetch<PlaylistData>(`/videos${query}`);
}

/**
 * Fetch specific video details with streaming HD/SD URLs.
 */
export async function fetchWatchDetails(slug: string): Promise<WatchVideoDetails> {
  return tvApiFetch<WatchVideoDetails>(`/videos/${encodeURIComponent(slug)}`);
}

/**
 * Save current playback progress to backend.
 */
export async function saveProgress(videoId: number, time: number, completed: boolean): Promise<void> {
  await tvApiFetch('/videos/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_id: videoId,
      last_time: Math.floor(time),
      is_completed: completed ? 1 : 0,
    }),
  });
}
