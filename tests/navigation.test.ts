import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialNavigation } from '../src/services/navigation';

describe('Spatial Navigation Engine', () => {
  beforeEach(() => {
    SpatialNavigation.reset();
  });

  it('navigates between horizontal cards on ArrowRight', () => {
    SpatialNavigation.register('card-0', { x: 0, y: 100, width: 200, height: 120 });
    SpatialNavigation.register('card-1', { x: 220, y: 100, width: 200, height: 120 });
    SpatialNavigation.setFocus('card-0');

    SpatialNavigation.move('right');
    expect(SpatialNavigation.getCurrentFocus()).toBe('card-1');
  });

  it('navigates vertically between rails on ArrowDown', () => {
    SpatialNavigation.register('rail-0-card-0', { x: 0, y: 100, width: 200, height: 120 });
    SpatialNavigation.register('rail-1-card-0', { x: 0, y: 300, width: 200, height: 120 });
    SpatialNavigation.setFocus('rail-0-card-0');

    SpatialNavigation.move('down');
    expect(SpatialNavigation.getCurrentFocus()).toBe('rail-1-card-0');
  });

  it('navigates back to left card on ArrowLeft', () => {
    SpatialNavigation.register('card-0', { x: 0, y: 100, width: 200, height: 120 });
    SpatialNavigation.register('card-1', { x: 220, y: 100, width: 200, height: 120 });
    SpatialNavigation.setFocus('card-1');

    SpatialNavigation.move('left');
    expect(SpatialNavigation.getCurrentFocus()).toBe('card-0');
  });

  it('navigates up on ArrowUp', () => {
    SpatialNavigation.register('top-nav', { x: 0, y: 0, width: 800, height: 50 });
    SpatialNavigation.register('hero-button', { x: 0, y: 150, width: 200, height: 60 });
    SpatialNavigation.setFocus('hero-button');

    SpatialNavigation.move('up');
    expect(SpatialNavigation.getCurrentFocus()).toBe('top-nav');
  });

  it('traps focus inside an active scope / group when scope is set', () => {
    // Background items
    SpatialNavigation.register('bg-card-1', { x: 0, y: 100, width: 200, height: 120 });
    SpatialNavigation.register('bg-card-2', { x: 250, y: 100, width: 200, height: 120 });

    // Modal dialog items in group 'modal'
    SpatialNavigation.register('modal-btn-cancel', { x: 100, y: 200, width: 100, height: 50 }, undefined, 'modal');
    SpatialNavigation.register('modal-btn-confirm', { x: 220, y: 200, width: 100, height: 50 }, undefined, 'modal');

    // Activate modal scope
    SpatialNavigation.setScope('modal');
    SpatialNavigation.setFocus('modal-btn-cancel');

    // Moving right should focus modal-btn-confirm
    SpatialNavigation.move('right');
    expect(SpatialNavigation.getCurrentFocus()).toBe('modal-btn-confirm');

    // Moving right again should NOT leak to background cards; it stays or loops within modal
    SpatialNavigation.move('right');
    expect(SpatialNavigation.getCurrentFocus()).toBe('modal-btn-confirm');
  });

  describe('Cross-Pane Sidebar and Content Deterministic Navigation', () => {
    it('traverses the 4 vertical sidebar items on ArrowDown and ArrowUp', () => {
      SpatialNavigation.register('nav-home', { x: 0, y: 50, width: 80, height: 48 });
      SpatialNavigation.register('nav-playlist', { x: 0, y: 110, width: 80, height: 48 });
      SpatialNavigation.register('nav-history', { x: 0, y: 170, width: 80, height: 48 });
      SpatialNavigation.register('nav-exit', { x: 0, y: 400, width: 80, height: 48 });
      SpatialNavigation.setFocus('nav-home');

      // Moving down sequentially
      SpatialNavigation.move('down');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-playlist');

      SpatialNavigation.move('down');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-history');

      SpatialNavigation.move('down');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-exit');

      // Boundary check: cannot move down past nav-exit
      SpatialNavigation.move('down');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-exit');

      // Moving up sequentially
      SpatialNavigation.move('up');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-history');

      SpatialNavigation.move('up');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-playlist');

      SpatialNavigation.move('up');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-home');

      // Boundary check: cannot move up past nav-home
      SpatialNavigation.move('up');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-home');

      // Moving left stays in sidebar
      SpatialNavigation.move('left');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-home');
    });

    it('moves Right from sidebar to hero-play-btn or first visible card', () => {
      SpatialNavigation.register('nav-home', { x: 0, y: 50, width: 80, height: 48 });
      SpatialNavigation.register('hero-play-btn', { x: 200, y: 200, width: 180, height: 48 });
      SpatialNavigation.register('rail-continue-card-0', { x: 200, y: 350, width: 256, height: 144 });
      SpatialNavigation.setFocus('nav-home');

      // When hero-play-btn is present, right from nav-home targets hero-play-btn
      SpatialNavigation.move('right');
      expect(SpatialNavigation.getCurrentFocus()).toBe('hero-play-btn');

      // When hero-play-btn is not present, right targets first available card
      SpatialNavigation.reset();
      SpatialNavigation.register('nav-home', { x: 0, y: 50, width: 80, height: 48 });
      SpatialNavigation.register('rail-continue-card-0', { x: 200, y: 350, width: 256, height: 144 });
      SpatialNavigation.setFocus('nav-home');

      SpatialNavigation.move('right');
      expect(SpatialNavigation.getCurrentFocus()).toBe('rail-continue-card-0');
    });

    it('moves Right from nav-playlist and nav-history to corresponding grid cards', () => {
      SpatialNavigation.register('nav-home', { x: 0, y: 50, width: 80, height: 48 });
      SpatialNavigation.register('nav-playlist', { x: 0, y: 110, width: 80, height: 48 });
      SpatialNavigation.register('nav-history', { x: 0, y: 170, width: 80, height: 48 });
      SpatialNavigation.register('playlist-card-0', { x: 200, y: 100, width: 256, height: 144 });
      SpatialNavigation.register('history-card-0', { x: 200, y: 100, width: 256, height: 144 });

      SpatialNavigation.setFocus('nav-playlist');
      SpatialNavigation.move('right');
      expect(SpatialNavigation.getCurrentFocus()).toBe('playlist-card-0');

      SpatialNavigation.setFocus('nav-history');
      SpatialNavigation.move('right');
      expect(SpatialNavigation.getCurrentFocus()).toBe('history-card-0');
    });

    it('moves Left from hero-play-btn and rail card column 0 to sidebar', () => {
      SpatialNavigation.register('nav-home', { x: 0, y: 50, width: 80, height: 48 });
      SpatialNavigation.register('hero-play-btn', { x: 200, y: 200, width: 180, height: 48 });
      SpatialNavigation.register('rail-continue-card-0', { x: 200, y: 350, width: 256, height: 144 });
      SpatialNavigation.register('rail-continue-card-1', { x: 480, y: 350, width: 256, height: 144 });
      SpatialNavigation.register('rail-month-0-card-0', { x: 200, y: 550, width: 256, height: 144 });

      // Left from hero-play-btn targets nav-home
      SpatialNavigation.setFocus('hero-play-btn');
      SpatialNavigation.move('left');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-home');

      // Left from rail-continue-card-0 targets nav-home
      SpatialNavigation.setFocus('rail-continue-card-0');
      SpatialNavigation.move('left');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-home');

      // Left from rail-month-0-card-0 targets nav-home
      SpatialNavigation.setFocus('rail-month-0-card-0');
      SpatialNavigation.move('left');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-home');

      // Left from card index > 0 stays within the rail
      SpatialNavigation.setFocus('rail-continue-card-1');
      SpatialNavigation.move('left');
      expect(SpatialNavigation.getCurrentFocus()).toBe('rail-continue-card-0');
    });

    it('navigates vertically between hero-play-btn and rail 0 cards', () => {
      SpatialNavigation.register('nav-home', { x: 0, y: 50, width: 80, height: 48 });
      SpatialNavigation.register('hero-play-btn', { x: 200, y: 200, width: 180, height: 48 });
      SpatialNavigation.register('rail-continue-card-0', { x: 200, y: 350, width: 256, height: 144 });
      SpatialNavigation.register('rail-month-0-card-0', { x: 200, y: 550, width: 256, height: 144 });

      // From hero-play-btn, Down moves to rail-continue-card-0
      SpatialNavigation.setFocus('hero-play-btn');
      SpatialNavigation.move('down');
      expect(SpatialNavigation.getCurrentFocus()).toBe('rail-continue-card-0');

      // From rail-continue-card-0 (top rail), Up moves to hero-play-btn
      SpatialNavigation.move('up');
      expect(SpatialNavigation.getCurrentFocus()).toBe('hero-play-btn');

      // From hero-play-btn, Up stays on hero-play-btn (does not jump away)
      SpatialNavigation.move('up');
      expect(SpatialNavigation.getCurrentFocus()).toBe('hero-play-btn');
    });

    it('moves Left from playlist and history column 0 to respective sidebar item', () => {
      SpatialNavigation.register('nav-home', { x: 0, y: 50, width: 80, height: 48 });
      SpatialNavigation.register('nav-playlist', { x: 0, y: 110, width: 80, height: 48 });
      SpatialNavigation.register('nav-history', { x: 0, y: 170, width: 80, height: 48 });
      SpatialNavigation.register('playlist-card-0', { x: 200, y: 100, width: 256, height: 144 });
      SpatialNavigation.register('playlist-card-1', { x: 480, y: 100, width: 256, height: 144 });
      SpatialNavigation.register('history-card-0', { x: 200, y: 100, width: 256, height: 144 });

      // Left from playlist col 0 -> nav-playlist
      SpatialNavigation.setFocus('playlist-card-0');
      SpatialNavigation.move('left');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-playlist');

      // Left from playlist col 1 -> playlist-card-0
      SpatialNavigation.setFocus('playlist-card-1');
      SpatialNavigation.move('left');
      expect(SpatialNavigation.getCurrentFocus()).toBe('playlist-card-0');

      // Left from history col 0 -> nav-history
      SpatialNavigation.setFocus('history-card-0');
      SpatialNavigation.move('left');
      expect(SpatialNavigation.getCurrentFocus()).toBe('nav-history');
    });
  });
});
