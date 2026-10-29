import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TvVideoCard } from '../src/components/TvVideoCard';
import { TvNavbar } from '../src/components/TvNavbar';
import { TvSidebar } from '../src/components/TvSidebar';
import { TvHeroSpotlight } from '../src/components/TvHeroSpotlight';
import { TvRetryButton } from '../src/pages/TvHomePage';

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
});
