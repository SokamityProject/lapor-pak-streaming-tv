import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TvVideoCard } from '../src/components/TvVideoCard';
import { TvRowRail } from '../src/components/TvRowRail';
import { TvNavbar } from '../src/components/TvNavbar';
import { TvSidebar } from '../src/components/TvSidebar';
import { TvHeroSpotlight } from '../src/components/TvHeroSpotlight';
import { TvRetryButton, TvHomePage } from '../src/pages/TvHomePage';
import { TvExitModal, exitTvApp } from '../src/components/TvExitModal';
import { useTvFocus } from '../src/hooks/useTvFocus';
import { SpatialNavigation } from '../src/services/navigation';

describe('TV UI Components', () => {
  it('renders TvVideoCard with title, duration badge, and focused golden border class', () => {
    const video = {
      id: 101,
      title: 'Eps. 250 - Kasus Misterius',
      episode: '250',
      thumbnail: 'https://example.com/thumb.jpg',
      duration: '45:00',
      slug: 'eps-250',
      progress: 60,
    };

    const { container } = render(
      <TvVideoCard video={video} isFocused={true} onSelect={() => {}} />
    );

    expect(screen.getByText('Eps. 250 - Kasus Misterius')).toBeDefined();
    expect(screen.getByText('45:00')).toBeDefined();
    const cardEl = container.firstElementChild as HTMLElement;
    expect(cardEl.className).toContain('border-brand');
    expect(cardEl.className).toContain('scale-108');
  });

  it('renders TvNavbar with brand logo and navigation tabs', () => {
    render(<TvNavbar activeTab="home" onSelectTab={() => {}} />);
    expect(screen.getByText('LAPOR PAK! TV')).toBeDefined();
    expect(screen.getByText('Beranda')).toBeDefined();
    expect(screen.getByText('Playlist')).toBeDefined();
  });

  it('renders TvSidebar with brand badge, navigation items, and handles actions', () => {
    const handleSelectTab = vi.fn();
    const handleOpenExitModal = vi.fn();

    render(
      <TvSidebar
        activeTab="home"
        onSelectTab={handleSelectTab}
        onOpenExitModal={handleOpenExitModal}
      />
    );

    // Verify brand
    expect(screen.getByText('LP')).toBeDefined();
    expect(screen.getByText('LAPOR PAK! TV')).toBeDefined();

    // Verify navigation items
    expect(screen.getByTestId('nav-home')).toBeDefined();
    expect(screen.getByTestId('nav-playlist')).toBeDefined();
    expect(screen.getByTestId('nav-history')).toBeDefined();
    expect(screen.getByTestId('nav-exit')).toBeDefined();

    expect(screen.getByText('Beranda')).toBeDefined();
    expect(screen.getByText('Playlist')).toBeDefined();
    expect(screen.getByText('Riwayat')).toBeDefined();
    expect(screen.getByText('Keluar')).toBeDefined();

    // Test tab selection
    fireEvent.click(screen.getByTestId('nav-playlist'));
    expect(handleSelectTab).toHaveBeenCalledWith('playlist');

    fireEvent.click(screen.getByTestId('nav-history'));
    expect(handleSelectTab).toHaveBeenCalledWith('history');

    // Test exit selection
    fireEvent.click(screen.getByTestId('nav-exit'));
    expect(handleOpenExitModal).toHaveBeenCalledTimes(1);
  });

  it('renders focusable TvRetryButton with remote focus styling when focused', () => {
    const { container } = render(<TvRetryButton isFocused={true} onRetry={() => {}} />);
    expect(screen.getByText(/Coba Lagi/)).toBeDefined();
    const btn = container.firstElementChild as HTMLElement;
    expect(btn.className).toContain('shadow-tv-focus');
    expect(btn.className).toContain('scale-105');
  });

  it('renders TvHeroSpotlight with title, channel badge, release date, synopsis, and focusable play CTA', () => {
    const video = {
      id: 999,
      title: 'Eps. 300 - Sidak Kantor Lapor Pak',
      episode: '300',
      created_at: '28 Oktober 2026',
      thumbnail: 'https://example.com/hero.jpg',
      duration: '48:15',
      slug: 'eps-300',
      progress: 0,
      synopsis: 'Komandan Andre memimpin penyelidikan kasus misteri kantor bersama Pasukan Lapor Pak.',
    };

    const handlePlay = vi.fn();

    const { container } = render(
      <TvHeroSpotlight video={video} onPlay={handlePlay} />
    );

    // Title
    expect(screen.getByText('Eps. 300 - Sidak Kantor Lapor Pak')).toBeDefined();

    // Channel badge
    expect(screen.getByText(/TRANS7/)).toBeDefined();
    expect(screen.getByText(/TRANS7 HD/)).toBeDefined();

    // Release date
    expect(screen.getByText(/28 Oktober 2026/)).toBeDefined();

    // Duration
    expect(screen.getByText(/48:15/)).toBeDefined();

    // Synopsis
    expect(
      screen.getByText(/Komandan Andre memimpin penyelidikan kasus misteri/i)
    ).toBeDefined();

    // Focusable Play CTA button with id "hero-play-btn"
    const playBtn = screen.getByRole('button', { name: /putar episode/i });
    expect(playBtn).toBeDefined();
    expect(playBtn.id).toBe('hero-play-btn');

    // Clicking play button triggers onPlay with slug
    fireEvent.click(playBtn);
    expect(handlePlay).toHaveBeenCalledWith('eps-300');

    // Clicking hero container triggers onPlay with slug
    handlePlay.mockClear();
    fireEvent.click(container.firstElementChild as HTMLElement);
    expect(handlePlay).toHaveBeenCalledWith('eps-300');
  });

  it('applies high-visibility focus ring to hero-play-btn when focused', () => {
    const video = {
      id: 999,
      title: 'Eps. 300 - Sidak Kantor Lapor Pak',
      episode: '300',
      created_at: '28 Oktober 2026',
      thumbnail: 'https://example.com/hero.jpg',
      duration: '48:15',
      slug: 'eps-300',
      progress: 0,
    };

    render(<TvHeroSpotlight video={video} onPlay={() => {}} isFocused={true} />);

    const playBtn = screen.getByRole('button', { name: /putar episode/i });
    expect(playBtn.className).toContain('ring-2');
    expect(playBtn.className).toContain('ring-white');
    expect(playBtn.className).toContain('bg-brand');
    expect(playBtn.className).toContain('text-slate-950');
    expect(playBtn.className).toContain('font-bold');
  });

  it('renders TvHeroSpotlight when video is null without error', () => {
    const { container } = render(<TvHeroSpotlight video={null} onPlay={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders resume progress when video has watch progress', () => {
    const video = {
      id: 999,
      title: 'Eps. 300 - Sidak Kantor Lapor Pak',
      episode: '300',
      created_at: '28 Oktober 2026',
      thumbnail: 'https://example.com/hero.jpg',
      duration: '48:15',
      slug: 'eps-300',
      progress: 55,
      is_completed: false,
    };

    render(<TvHeroSpotlight video={video} onPlay={() => {}} />);

    expect(screen.getByRole('button', { name: /lanjutkan menonton/i })).toBeDefined();
    expect(screen.getByText(/55% ditonton/i)).toBeDefined();
  });

  it('renders TvRowRail with category icon, count badge, and video cards', () => {
    const videos = [
      {
        id: 1,
        title: 'Eps. 10 - Kasus Pertama',
        episode: '10',
        thumbnail: 'https://example.com/1.jpg',
        duration: '40:00',
        slug: 'eps-10',
        progress: 0,
      },
      {
        id: 2,
        title: 'Eps. 11 - Kasus Kedua',
        episode: '11',
        thumbnail: 'https://example.com/2.jpg',
        duration: '42:00',
        slug: 'eps-11',
        progress: 80,
      },
    ];

    const handleSelect = vi.fn();

    const { container } = render(
      <TvRowRail
        title="Lanjutkan Menonton"
        videos={videos}
        onSelectVideo={handleSelect}
        railId="rail-continue"
      />
    );

    expect(screen.getByText('Lanjutkan Menonton')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('Eps. 10 - Kasus Pertama')).toBeDefined();
    expect(screen.getByText('Eps. 11 - Kasus Kedua')).toBeDefined();

    // Verify scrolling container has generous headroom classes so cards never clip
    const scrollContainer = container.querySelector('.overflow-x-hidden');
    expect(scrollContainer).toBeDefined();
    expect(scrollContainer?.className).toContain('py-6');
    expect(scrollContainer?.className).toContain('px-8');

    // Click card
    fireEvent.click(screen.getByText('Eps. 10 - Kasus Pertama'));
    expect(handleSelect).toHaveBeenCalledWith(videos[0]);
  });

  it('renders TvRowRail returns null when videos is empty', () => {
    const { container } = render(
      <TvRowRail
        title="Kosong"
        videos={[]}
        onSelectVideo={() => {}}
        railId="rail-empty"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders TvVideoCard with completed badge and progress bar', () => {
    const completedVideo = {
      id: 201,
      title: 'Eps. 201 - Kasus Selesai',
      episode: '201',
      thumbnail: 'https://example.com/thumb2.jpg',
      duration: '45:00',
      slug: 'eps-201',
      progress: 100,
      is_completed: true,
    };

    render(
      <TvVideoCard video={completedVideo} onSelect={() => {}} />
    );

    expect(screen.getByText('Selesai')).toBeDefined();
  });

  it('renders TvVideoCard with focus ring and play overlay without blur filters', () => {
    const video = {
      id: 301,
      title: 'Eps. 301 - Kasus Fokus',
      episode: '301',
      thumbnail: 'https://example.com/thumb3.jpg',
      duration: '50:00',
      slug: 'eps-301',
      progress: 40,
    };

    const { container } = render(
      <TvVideoCard video={video} isFocused={true} onSelect={() => {}} />
    );

    const cardEl = container.firstElementChild as HTMLElement;
    expect(cardEl.className).toContain('border-brand');
    expect(cardEl.className).toContain('scale-108');
    expect(cardEl.className).toContain('shadow-md');
    expect(cardEl.className).toContain('ring-2');
    expect(cardEl.className).not.toContain('backdrop-blur');

    // In-progress percentage badge
    expect(screen.getByText('40%')).toBeDefined();
  });

  it('prefixes video title with Eps. and does not render top-left episode badge on thumbnail', () => {
    const rawVideo = {
      id: 505,
      title: 'Misteri Bebek Pak RT',
      episode: '2026-10-28',
      thumbnail: 'https://example.com/thumb.jpg',
      duration: '42:00',
      slug: 'misteri-bebek',
      progress: 0,
    };

    render(<TvVideoCard video={rawVideo} onSelect={() => {}} />);

    // Title should be prefixed with "Eps. "
    expect(screen.getByText('Eps. Misteri Bebek Pak RT')).toBeDefined();
    // Top-left episode badge with raw "EPS. 2026-10-28" should NOT be present
    expect(screen.queryByText('EPS. 2026-10-28')).toBeNull();
  });

  it('useTvFocus auto-scrolls to start for nav/hero and center for cards', () => {
    SpatialNavigation.reset();
    const scrollMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollMock;

    function TestComponent() {
      const navItem = useTvFocus({ id: 'nav-item' });
      const cardItem = useTvFocus({ id: 'rail-card-0' });
      return (
        <div>
          <div ref={navItem.ref} id="nav-item" />
          <div ref={cardItem.ref} id="rail-card-0" />
        </div>
      );
    }

    const { unmount } = render(<TestComponent />);

    act(() => {
      SpatialNavigation.setFocus('rail-card-0');
    });
    expect(scrollMock).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
      inline: 'nearest',
    });

    scrollMock.mockClear();
    act(() => {
      SpatialNavigation.setFocus('nav-item');
    });
    expect(scrollMock).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
      inline: 'nearest',
    });

    unmount();
    act(() => {
      SpatialNavigation.reset();
    });
  });

  it('resets horizontal rail scrollLeft to 0 when returning to card-0 to prevent leftmost clipping', () => {
    SpatialNavigation.reset();
    const mockVideos = [
      { id: 101, title: 'Episode 101', slug: 'ep-101', thumbnail: '', duration: '45:00', episode: '101' },
      { id: 102, title: 'Episode 102', slug: 'ep-102', thumbnail: '', duration: '45:00', episode: '102' },
      { id: 103, title: 'Episode 103', slug: 'ep-103', thumbnail: '', duration: '45:00', episode: '103' },
    ];

    const { unmount } = render(
      <TvRowRail
        railId="rail-test"
        title="Test Rail"
        videos={mockVideos as any}
        onSelectVideo={() => {}}
      />
    );

    const card0 = document.getElementById('rail-test-card-0');
    expect(card0).toBeDefined();
    const container = card0?.parentElement as HTMLElement;
    expect(container).toBeDefined();

    // First focus on card-1 (user navigated right)
    act(() => {
      SpatialNavigation.setFocus('rail-test-card-1');
    });

    // Simulate carousel scrolled right (e.g. scrollLeft = 120px)
    container.scrollLeft = 120;
    expect(container.scrollLeft).toBe(120);

    // Now return focus to card-0 (user navigated all the way back to the leftmost card)
    act(() => {
      SpatialNavigation.setFocus('rail-test-card-0');
    });

    // Container scrollLeft must be reset to 0 so the first card is never clipped!
    expect(container.scrollLeft).toBe(0);

    unmount();
  });

  it('renders TvExitModal with high-contrast OLED styling, Batal, and Keluar buttons', () => {
    SpatialNavigation.reset();
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    const { unmount } = render(
      <TvExitModal onConfirm={handleConfirm} onCancel={handleCancel} />
    );

    expect(screen.getByText('Keluar dari Aplikasi?')).toBeDefined();
    expect(screen.getByText(/Apakah Anda yakin ingin menutup/i)).toBeDefined();

    const cancelBtn = screen.getByTestId('exit-cancel-btn');
    const confirmBtn = screen.getByTestId('exit-confirm-btn');

    expect(cancelBtn).toBeDefined();
    expect(cancelBtn.textContent).toContain('Batal');
    expect(confirmBtn).toBeDefined();
    expect(confirmBtn.textContent).toContain('Keluar Aplikasi');

    // Verify scope is set to 'exit-modal' and default focus is Batal
    expect(SpatialNavigation.getScope()).toBe('exit-modal');
    expect(SpatialNavigation.getCurrentFocus()).toBe('exit-cancel-btn');

    // Test cancel action
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);

    // Test confirm action
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    unmount();
    // Scope should be reset to null on unmount
    expect(SpatialNavigation.getScope()).toBeNull();
    SpatialNavigation.reset();
  });

  it('exitTvApp calls TvAppBridge.exitApp when available, or window.close fallback', async () => {
    const originalBridge = (window as any).TvAppBridge;
    const mockExit = vi.fn();
    (window as any).TvAppBridge = { exitApp: mockExit };

    await exitTvApp();
    expect(mockExit).toHaveBeenCalledTimes(1);

    delete (window as any).TvAppBridge;
    const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
    await exitTvApp();
    expect(closeSpy).toHaveBeenCalledTimes(1);
    closeSpy.mockRestore();

    if (originalBridge) {
      (window as any).TvAppBridge = originalBridge;
    }
  });

  it('traverses exit modal buttons using both Left/Right and Up/Down D-pad directions', () => {
    const { unmount } = render(<TvExitModal isOpen={true} onConfirm={() => {}} onCancel={() => {}} />);

    // Initially focused on exit-cancel-btn
    expect(SpatialNavigation.getCurrentFocus()).toBe('exit-cancel-btn');

    // Right moves to exit-confirm-btn
    act(() => {
      SpatialNavigation.move('right');
    });
    expect(SpatialNavigation.getCurrentFocus()).toBe('exit-confirm-btn');

    // Left moves back to exit-cancel-btn
    act(() => {
      SpatialNavigation.move('left');
    });
    expect(SpatialNavigation.getCurrentFocus()).toBe('exit-cancel-btn');

    // Down also moves to exit-confirm-btn
    act(() => {
      SpatialNavigation.move('down');
    });
    expect(SpatialNavigation.getCurrentFocus()).toBe('exit-confirm-btn');

    // Up also moves back to exit-cancel-btn
    act(() => {
      SpatialNavigation.move('up');
    });
    expect(SpatialNavigation.getCurrentFocus()).toBe('exit-cancel-btn');

    unmount();
  });

  it('registers buttons and handles selection when TvExitModal transitions from isOpen=false to isOpen=true', () => {
    SpatialNavigation.reset();
    const handleCancel = vi.fn();
    const handleConfirm = vi.fn();

    const { rerender, unmount } = render(
      <TvExitModal isOpen={false} onConfirm={handleConfirm} onCancel={handleCancel} />
    );

    // Modal was closed initially
    expect(SpatialNavigation.getScope()).toBeNull();

    // Now open modal
    act(() => {
      rerender(<TvExitModal isOpen={true} onConfirm={handleConfirm} onCancel={handleCancel} />);
    });

    // Must be scoped to exit-modal and focused on exit-cancel-btn
    expect(SpatialNavigation.getScope()).toBe('exit-modal');
    expect(SpatialNavigation.getCurrentFocus()).toBe('exit-cancel-btn');

    // Trigger select on exit-cancel-btn must call handleCancel
    SpatialNavigation.triggerSelect();
    expect(handleCancel).toHaveBeenCalledTimes(1);

    // Move to confirm and trigger select
    SpatialNavigation.move('right');
    expect(SpatialNavigation.getCurrentFocus()).toBe('exit-confirm-btn');
    SpatialNavigation.triggerSelect();
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('TvHomePage renders two-pane OTT shell layout and handles two-tier remote back flow', async () => {
    SpatialNavigation.reset();

    const mockFeed = {
      ok: true,
      user: { id: 1 },
      hero: {
        id: 999,
        title: 'Hero Video',
        slug: 'hero-video',
        thumbnail: 'https://example.com/hero.jpg',
        duration: '45:00',
        episode: '1',
      },
      continue_watching: [],
      recent_months: [],
    };

    const origFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => mockFeed,
      headers: { get: () => null },
    } as unknown as Response);

    const handlePlayVideo = vi.fn();
    const handleExitApp = vi.fn();

    const { container, unmount } = render(
      <TvHomePage onPlayVideo={handlePlayVideo} onExitApp={handleExitApp} />
    );

    // Root container has 2-pane OTT layout classes
    const rootEl = container.firstElementChild as HTMLElement;
    expect(rootEl.className).toContain('flex');
    expect(rootEl.className).toContain('h-screen');
    expect(rootEl.className).toContain('bg-[#060913]');

    // Sidebar is present with 4 navigation items
    expect(screen.getByTestId('nav-home')).toBeDefined();
    expect(screen.getByTestId('nav-playlist')).toBeDefined();
    expect(screen.getByTestId('nav-history')).toBeDefined();
    expect(screen.getByTestId('nav-exit')).toBeDefined();

    // Tier 1: When focus is in content (e.g. hero-play-btn or a card), Back returns to sidebar
    act(() => {
      SpatialNavigation.setFocus('hero-play-btn');
    });
    expect(SpatialNavigation.getCurrentFocus()).toBe('hero-play-btn');

    // Fire Back event (Escape)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    // Focus should now be returned to active sidebar tab ('nav-home')
    expect(SpatialNavigation.getCurrentFocus()).toBe('nav-home');

    // Tier 2: When focus is in sidebar ('nav-home'), Back opens TvExitModal
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.getByText('Keluar dari Aplikasi?')).toBeDefined();
    expect(SpatialNavigation.getScope()).toBe('exit-modal');
    expect(SpatialNavigation.getCurrentFocus()).toBe('exit-cancel-btn');

    // Tier 0: When Exit Modal is open, Back closes the modal and resumes sidebar focus
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(screen.queryByText('Keluar dari Aplikasi?')).toBeNull();
    expect(SpatialNavigation.getScope()).toBeNull();
    expect(SpatialNavigation.getCurrentFocus()).toBe('nav-home');

    unmount();
    SpatialNavigation.reset();
    global.fetch = origFetch;
  });
});
