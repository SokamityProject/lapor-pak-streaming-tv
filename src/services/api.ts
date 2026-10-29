import { Capacitor, CapacitorHttp, CapacitorCookies } from '@capacitor/core';
import { HomeFeedData, PlaylistData, WatchVideoDetails } from '../types/api';
import { extractAndSolveChallenge } from './slowAes';
import {
  applyLocalProgressToFeed,
  applyLocalProgressToPlaylist,
  applyLocalProgressToWatchDetails,
  saveLocalProgress,
} from './localProgress';

const DEFAULT_API_BASE = 'https://laporpak.my.to/api';
export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : DEFAULT_API_BASE;

export interface LoginCredentials {
  username: string;
  password: string;
}

export const TV_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 12; Android TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DEFAULT_ADMIN: LoginCredentials = {
  username: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_USER) || 'syamsubahar',
  password: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_PASS) || 'syamsu66',
};

let activeSession = false;
let currentCredentials = DEFAULT_ADMIN;
let activeTestCookie: string | null = null;
let activePhpSession: string | null = null;

export function isSessionActive(): boolean {
  return activeSession;
}

export function getActiveTestCookie(): string | null {
  return activeTestCookie;
}

export function setActiveTestCookie(val: string | null): void {
  activeTestCookie = val;
}

export function getActivePhpSession(): string | null {
  return activePhpSession;
}

export function setActivePhpSession(val: string | null): void {
  activePhpSession = val;
}

/**
 * Preflights the InfinityFree challenge and calculates the __test cookie if needed.
 */
export async function ensureInfinityFreeCookie(): Promise<string | null> {
  if (activeTestCookie) return activeTestCookie;

  const rootUrl = API_BASE.replace(/\/api\/?$/, '');
  let html = '';

  try {
    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.get({
        url: rootUrl,
        headers: {
          'User-Agent': TV_USER_AGENT,
        },
      });
      html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    } else {
      const res = await fetch(rootUrl, {
        headers: { 'User-Agent': TV_USER_AGENT },
      });
      if (typeof res.text === 'function') {
        html = await res.text();
      } else if (typeof res.json === 'function') {
        const j = await res.json();
        html = typeof j === 'string' ? j : JSON.stringify(j);
      }
    }

    const solved = extractAndSolveChallenge(html);
    if (solved) {
      activeTestCookie = solved;
      try {
        await CapacitorCookies.setCookie({
          url: rootUrl,
          key: '__test',
          value: solved,
        });
      } catch {
        // Ignored in non-native / test environments
      }
    }
  } catch (err: any) {
    console.error('InfinityFree challenge preflight error:', err);
    throw new Error(`Gagal membuka firewall InfinityFree: ${err?.message || err}`);
  }

  return activeTestCookie;
}

/**
 * Perform silent auto-login to backend to establish PHPSESSID session.
 */
export async function initTvSession(credentials?: LoginCredentials): Promise<boolean> {
  if (credentials) {
    currentCredentials = credentials;
  }

  await ensureInfinityFreeCookie();

  const rootUrl = API_BASE.replace(/\/api\/?$/, '');
  const loginUrl = `${API_BASE}/auth/login`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': TV_USER_AGENT,
  };

  const cookieParts: string[] = [];
  if (activeTestCookie) cookieParts.push(`__test=${activeTestCookie}`);
  if (activePhpSession) cookieParts.push(`PHPSESSID=${activePhpSession}`);
  if (cookieParts.length > 0) {
    headers['Cookie'] = cookieParts.join('; ');
  }

  let status = 0;
  let data: any = null;
  let setCookieHeaders: string | string[] | undefined;

  try {
    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.post({
        url: loginUrl,
        headers,
        data: currentCredentials,
      });
      status = res.status;
      data = res.data;
      setCookieHeaders = res.headers?.['set-cookie'] || res.headers?.['Set-Cookie'];
    } else {
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(currentCredentials),
      });
      status = res.status;
      data = await res.json();
    }
  } catch (err: any) {
    console.error('TV Auto-login network error:', err);
    throw new Error(`Gagal menghubungi endpoint login: ${err?.message || err}`);
  }

  // Extract regenerated PHPSESSID from set-cookie
  if (setCookieHeaders) {
    const cookieStr = Array.isArray(setCookieHeaders) ? setCookieHeaders.join('; ') : setCookieHeaders;
    const matches = [...cookieStr.matchAll(/PHPSESSID=([a-zA-Z0-9]+)/g)];
    if (matches.length > 0) {
      activePhpSession = matches[matches.length - 1][1];
      try {
        await CapacitorCookies.setCookie({
          url: rootUrl,
          key: 'PHPSESSID',
          value: activePhpSession,
        });
      } catch {
        // Ignored in non-native / test environments
      }
    }
  }

  if (status === 200 && data && data.ok) {
    activeSession = true;
    return true;
  }

  const msg = data?.message || `Status HTTP ${status}`;
  throw new Error(`Login admin ditolak: ${msg}`);
}

/**
 * Internal fetch wrapper with automatic 401 re-login retry.
 */
async function tvApiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  await ensureInfinityFreeCookie();

  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': TV_USER_AGENT,
    ...((options.headers as Record<string, string>) || {}),
  };

  const cookieParts: string[] = [];
  if (activeTestCookie) cookieParts.push(`__test=${activeTestCookie}`);
  if (activePhpSession) cookieParts.push(`PHPSESSID=${activePhpSession}`);
  if (cookieParts.length > 0) {
    headers['Cookie'] = cookieParts.join('; ');
  }

  let status = 0;
  let data: any = null;

  if (Capacitor.isNativePlatform()) {
    const method = (options.method || 'GET').toUpperCase();
    let bodyData: any = undefined;
    if (options.body && typeof options.body === 'string') {
      try {
        bodyData = JSON.parse(options.body);
      } catch {
        bodyData = options.body;
      }
    }
    const res = await CapacitorHttp.request({
      url,
      method,
      headers,
      data: bodyData,
    });
    status = res.status;
    data = res.data;
  } else {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
    status = res.status;
    data = await res.json();
  }

  // If unauthorized, re-authenticate silently once and retry
  if (status === 401 && !endpoint.includes('/auth/login')) {
    const relogged = await initTvSession();
    if (relogged) {
      return tvApiFetch<T>(endpoint, options);
    }
  }

  if (status < 200 || status >= 300) {
    const msg = data?.message || `Status HTTP ${status}`;
    throw new Error(`API ${endpoint} error: ${msg}`);
  }

  return (data.data ?? data) as T;
}

/**
 * Fetch home feed data (Hero + Continue Watching + Months),
 * transformed to use local TV playback progress.
 */
export async function fetchHomeFeed(): Promise<HomeFeedData> {
  const data = await tvApiFetch<HomeFeedData>('/videos/home');
  return applyLocalProgressToFeed(data);
}

/**
 * Fetch playlist list with local TV playback progress.
 */
export async function fetchPlaylist(month?: string, search?: string): Promise<PlaylistData> {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (search) params.append('search', search);
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await tvApiFetch<PlaylistData>(`/videos${query}`);
  return applyLocalProgressToPlaylist(data);
}

/**
 * Fetch specific video details with streaming HD/SD URLs and local TV resume time.
 * Supports retry=true to force-refresh Facebook CDN URLs when stream expires.
 */
export async function fetchWatchDetails(slug: string, retry = false): Promise<WatchVideoDetails> {
  const query = retry ? '?retry=1' : '';
  const res = await tvApiFetch<any>(`/videos/${encodeURIComponent(slug)}${query}`);
  const raw = res && res.video ? res.video : res && res.data ? res.data : res;
  return applyLocalProgressToWatchDetails(raw as WatchVideoDetails);
}

/**
 * Save playback progress locally on this TV (does not modify server database).
 */
export async function saveProgress(
  videoId: number,
  time: number,
  completed: boolean,
  videoMeta?: { slug?: string; title?: string; episode?: string; thumbnail?: string; duration?: string }
): Promise<void> {
  saveLocalProgress(
    {
      id: videoId,
      slug: videoMeta?.slug || String(videoId),
      title: videoMeta?.title,
      episode: videoMeta?.episode,
      thumbnail: videoMeta?.thumbnail,
      duration: videoMeta?.duration,
    },
    time,
    undefined,
    completed
  );
}
