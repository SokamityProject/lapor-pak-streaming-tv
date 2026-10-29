import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TvVideoCard } from '../src/components/TvVideoCard';
import { TvNavbar } from '../src/components/TvNavbar';
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
    expect(cardEl.className).toContain('scale-105');
  });

  it('renders TvNavbar with brand logo and navigation tabs', () => {
    render(<TvNavbar activeTab="home" onSelectTab={() => {}} />);
    expect(screen.getByText('LAPOR PAK! TV')).toBeDefined();
    expect(screen.getByText('Beranda')).toBeDefined();
    expect(screen.getByText('Playlist')).toBeDefined();
  });

  it('renders focusable TvRetryButton with remote focus styling when focused', () => {
    const { container } = render(<TvRetryButton isFocused={true} onRetry={() => {}} />);
    expect(screen.getByText(/Coba Lagi/)).toBeDefined();
    const btn = container.firstElementChild as HTMLElement;
    expect(btn.className).toContain('shadow-tv-focus');
    expect(btn.className).toContain('scale-105');
  });
});
