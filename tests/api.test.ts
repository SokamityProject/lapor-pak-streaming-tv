import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initTvSession,
  fetchHomeFeed,
  fetchPlaylist,
  fetchWatchDetails,
  saveProgress,
  ensureInfinityFreeCookie,
  getActiveTestCookie,
  setActiveTestCookie
} from '../src/services/api';

describe('TV API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setActiveTestCookie(null);
  });

  it('solves InfinityFree challenge during preflight', async () => {
    const challengeHtml = `
      <html><body><script>
      var a=toNumbers("f655ba9d09a112d4968c63579db590b4"),b=toNumbers("98344c2eee86c3994890592585b49f80"),c=toNumbers("c4c77a73718eb5bb248fe400eef76eb5");
      document.cookie="__test="+toHex(slowAES.decrypt(c,2,a,b))+"; max-age=21600; expires=Thu, 31-Dec-37 23:55:55 GMT; path=/";
      </script></body></html>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => challengeHtml,
      json: async () => ({}),
    } as unknown as Response);

    const cookie = await ensureInfinityFreeCookie();
    expect(cookie).toBe('2f312d304562ccae42675f89848424b1');
    expect(getActiveTestCookie()).toBe('2f312d304562ccae42675f89848424b1');
  });

  it('performs silent auto-login and stores session cookie/token', async () => {
    const mockLoginResponse = { ok: true, user: { id: 1, username: 'syamsubahar', role: 'admin' } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => mockLoginResponse,
      headers: {
        get: () => 'PHPSESSID=testsession123; path=/',
      },
    } as unknown as Response);

    const success = await initTvSession({ username: 'syamsubahar', password: 'password' });
    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetches home feed with hero and rails', async () => {
    const mockFeed = {
      ok: true,
      data: {
        total: 167,
        hero: { id: 1, title: 'Episode 1', episode: '1', slug: 'eps-1', thumbnail: 'thumb.jpg', duration: '40:00', progress: 0 },
        continue_watching: [],
        recent_months: []
      }
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => mockFeed,
    } as unknown as Response);

    const feed = await fetchHomeFeed();
    expect(feed.total).toBe(167);
    expect(feed.hero?.title).toBe('Episode 1');
  });

  it('fetches watch details including streaming HD and SD URLs unwrapping video property', async () => {
    // Real PHP backend response has `video` property
    const mockDetails = {
      ok: true,
      video: {
        id: 1,
        title: 'Episode 1',
        episode: '1',
        thumbnail: 'thumb.jpg',
        duration: '40:00',
        slug: 'eps-1',
        hd: 'https://video.fbcdn.net/hd.mp4',
        sd: 'https://video.fbcdn.net/sd.mp4',
        resume_time: 120,
        is_completed: false
      },
      next_up: []
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => mockDetails,
    } as unknown as Response);

    const details = await fetchWatchDetails('eps-1');
    expect(details.hd).toBe('https://video.fbcdn.net/hd.mp4');
    expect(details.sd).toBe('https://video.fbcdn.net/sd.mp4');
    expect(details.title).toBe('Episode 1');
  });

  it('fetchPlaylist accepts cursor and limit options and passes them to API query', async () => {
    const mockPlaylist = {
      ok: true,
      data: {
        items: [{ id: 1, title: 'Episode 1', episode: '1', slug: 'eps-1', thumbnail: 'thumb.jpg', duration: '40:00', progress: 0 }],
        total: 1,
        has_more: false,
        next_cursor: null
      }
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => mockPlaylist,
    } as unknown as Response);

    const result = await fetchPlaylist({ cursor: 'test-cursor-123', limit: 24, month: '2024-05', search: 'lapor' });
    expect(result.items).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('cursor=test-cursor-123'),
      expect.anything()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=24'),
      expect.anything()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('month=2024-05'),
      expect.anything()
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=lapor'),
      expect.anything()
    );
  });

  it('fetchPlaylist supports backwards-compatible positional arguments and no args', async () => {
    const mockPlaylist = {
      ok: true,
      data: {
        items: [{ id: 1, title: 'Episode 1', episode: '1', slug: 'eps-1', thumbnail: 'thumb.jpg', duration: '40:00', progress: 0 }],
        total: 1,
        has_more: false,
        next_cursor: null
      }
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => mockPlaylist,
    } as unknown as Response);

    // Positional call
    await fetchPlaylist('2024-05', 'lapor');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/videos?month=2024-05&search=lapor'),
      expect.anything()
    );

    // No args call
    await fetchPlaylist();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/videos$/),
      expect.anything()
    );
  });

  it('manages video progress locally without overriding remote user database', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => ({ ok: true }),
    } as unknown as Response);

    await saveProgress(1, 450, false, { slug: 'eps-1', title: 'Episode 1', duration: '40:00' });
    // Local TV storage should store the progress
    const { getLocalProgress } = await import('../src/services/localProgress');
    const local = getLocalProgress(1);
    expect(local).not.toBeNull();
    expect(local?.lastTime).toBe(450);
    // Remote database API endpoint is not touched
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/videos/progress'),
      expect.anything()
    );
  });
});
