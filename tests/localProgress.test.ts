import { describe, it, expect, beforeEach } from 'vitest';
import {
  getLocalProgress,
  saveLocalProgress,
  getContinueWatchingList,
  applyLocalProgressToWatchDetails,
  applyLocalProgressToFeed,
  clearLocalProgress,
} from '../src/services/localProgress';
import { WatchVideoDetails, HomeFeedData } from '../src/types/api';

describe('Local TV Video Progress Manager', () => {
  beforeEach(() => {
    localStorage.clear();
    clearLocalProgress();
  });

  it('saves and retrieves local playback progress for a video', () => {
    const video = {
      id: 105,
      slug: 'eps-105',
      title: 'Episode 105 - Sidang Tilang',
      episode: '105',
      thumbnail: 'thumb105.webp',
      duration: '40:00',
    };

    // Watched 10 minutes (600 seconds) out of 40:00 (2400 seconds) = 25%
    saveLocalProgress(video, 600, 2400, false);

    const saved = getLocalProgress(105);
    expect(saved).not.toBeNull();
    expect(saved?.lastTime).toBe(600);
    expect(saved?.progress).toBe(25);
    expect(saved?.isCompleted).toBe(false);
  });

  it('marks video as completed when watched >= 95%', () => {
    const video = {
      id: 106,
      slug: 'eps-106',
      title: 'Episode 106',
      episode: '106',
      thumbnail: 'thumb106.webp',
      duration: '20:00', // 1200s
    };

    // Watched 1150s out of 1200s (> 95%)
    saveLocalProgress(video, 1150, 1200);

    const saved = getLocalProgress(106);
    expect(saved?.isCompleted).toBe(true);
    expect(saved?.progress).toBe(100);
  });

  it('builds continue_watching list solely from locally watched in-progress videos', () => {
    saveLocalProgress(
      { id: 1, slug: 'eps-1', title: 'Eps 1', episode: '1', thumbnail: 't1.webp', duration: '30:00' },
      300,
      1800,
      false
    );
    saveLocalProgress(
      { id: 2, slug: 'eps-2', title: 'Eps 2', episode: '2', thumbnail: 't2.webp', duration: '30:00' },
      1750,
      1800,
      true // Completed - should NOT be in continue watching
    );

    const continueList = getContinueWatchingList();
    expect(continueList).toHaveLength(1);
    expect(continueList[0].id).toBe(1);
    expect(continueList[0].progress).toBeGreaterThan(0);
    expect(continueList[0].progress).toBeLessThan(100);
  });

  it('applies local progress to HomeFeedData, replacing remote user progress and continue_watching', () => {
    saveLocalProgress(
      { id: 42, slug: 'eps-42', title: 'Eps 42', episode: '42', thumbnail: 't42.webp', duration: '40:00' },
      1200,
      2400,
      false
    );

    const remoteFeed: HomeFeedData = {
      total: 100,
      hero: {
        id: 42,
        slug: 'eps-42',
        title: 'Eps 42',
        episode: '42',
        thumbnail: 't42.webp',
        duration: '40:00',
        progress: 99, // Remote says 99%, local should override to 50%
      },
      continue_watching: [
        {
          id: 999, // Remote user watched this, but TV never watched this!
          slug: 'eps-999',
          title: 'Remote User Video',
          episode: '999',
          thumbnail: 't999.webp',
          duration: '30:00',
          progress: 40,
        },
      ],
      recent_months: [
        {
          month: '2026-10',
          videos: [
            {
              id: 42,
              slug: 'eps-42',
              title: 'Eps 42',
              episode: '42',
              thumbnail: 't42.webp',
              duration: '40:00',
              progress: 0,
            },
            {
              id: 43,
              slug: 'eps-43',
              title: 'Eps 43',
              episode: '43',
              thumbnail: 't43.webp',
              duration: '40:00',
              progress: 80, // Remote says 80%, but TV never watched it
            },
          ],
        },
      ],
    };

    const localFeed = applyLocalProgressToFeed(remoteFeed);

    // Hero progress overridden to local 50%
    expect(localFeed.hero?.progress).toBe(50);
    expect(localFeed.hero?.last_time).toBe(1200);

    // continue_watching should only have video 42, NOT remote video 999
    expect(localFeed.continue_watching).toHaveLength(1);
    expect(localFeed.continue_watching[0].id).toBe(42);

    // Recent months: video 42 has 50%, un-watched video 43 is reset to 0%
    expect(localFeed.recent_months[0].videos[0].progress).toBe(50);
    expect(localFeed.recent_months[0].videos[1].progress).toBe(0);
  });

  it('applies local resume_time to WatchVideoDetails', () => {
    saveLocalProgress(
      { id: 88, slug: 'eps-88', title: 'Eps 88', episode: '88', thumbnail: 't88.webp', duration: '40:00' },
      900,
      2400,
      false
    );

    const remoteDetails: WatchVideoDetails = {
      id: 88,
      slug: 'eps-88',
      title: 'Eps 88',
      episode: '88',
      thumbnail: 't88.webp',
      duration: '40:00',
      hd: 'https://cdn/hd.mp4',
      sd: 'https://cdn/sd.mp4',
      resume_time: 1800, // Remote says 1800s, local should override to 900s
      is_completed: false,
    };

    const details = applyLocalProgressToWatchDetails(remoteDetails);
    expect(details.resume_time).toBe(900);
  });
});
