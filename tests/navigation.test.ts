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
});
