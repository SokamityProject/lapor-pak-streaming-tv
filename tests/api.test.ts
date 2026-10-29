import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initTvSession, fetchHomeFeed, fetchWatchDetails, saveProgress } from '../src/services/api';

describe('TV API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('performs silent auto-login and stores session cookie/token', async () => {
    const mockLoginResponse = { ok: true, user: { id: 1, username: 'admin', role: 'admin' } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockLoginResponse,
    } as unknown as Response);

    const success = await initTvSession({ username: 'admin', password: 'password' });
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
      json: async () => mockFeed,
    } as unknown as Response);

    const feed = await fetchHomeFeed();
    expect(feed.total).toBe(167);
    expect(feed.hero?.title).toBe('Episode 1');
  });

  it('fetches watch details including streaming HD and SD URLs', async () => {
    const mockDetails = {
      ok: true,
      data: {
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
      }
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDetails,
    } as unknown as Response);

    const details = await fetchWatchDetails('eps-1');
    expect(details.hd).toBe('https://video.fbcdn.net/hd.mp4');
    expect(details.resume_time).toBe(120);
  });

  it('saves playback progress to backend', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as unknown as Response);

    await saveProgress(1, 450, false);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/videos/progress'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ video_id: 1, last_time: 450, is_completed: 0 })
      })
    );
  });
});
