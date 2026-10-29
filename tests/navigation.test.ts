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
});
