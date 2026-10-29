import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TvVideoCard } from '../src/components/TvVideoCard';
import { TvNavbar } from '../src/components/TvNavbar';
import { TvSidebar } from '../src/components/TvSidebar';
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
});
