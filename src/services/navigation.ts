export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FocusItem {
  id: string;
  rect: Rect;
  onSelect?: () => void;
  groupId?: string;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

class SpatialNavigationManager {
  private items = new Map<string, FocusItem>();
  private currentFocusId: string | null = null;
  private listeners = new Set<(id: string | null) => void>();
  private isListening = false;

  public register(id: string, rect: Rect, onSelect?: () => void, groupId?: string): void {
    this.items.set(id, { id, rect, onSelect, groupId });
    if (!this.currentFocusId) {
      this.setFocus(id);
    }
  }

  public updateRect(id: string, rect: Rect): void {
    const item = this.items.get(id);
    if (item) {
      item.rect = rect;
    }
  }

  public unregister(id: string): void {
    this.items.delete(id);
    if (this.currentFocusId === id) {
      // Pick next available
      const next = this.items.keys().next().value;
      this.setFocus(next || null);
    }
  }

  public setFocus(id: string | null): void {
    if (this.currentFocusId !== id) {
      this.currentFocusId = id;
      this.listeners.forEach((listener) => listener(this.currentFocusId));
    }
  }

  public getCurrentFocus(): string | null {
    return this.currentFocusId;
  }

  public reset(): void {
    this.items.clear();
    this.currentFocusId = null;
    this.listeners.clear();
  }

  public subscribe(listener: (id: string | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public move(direction: Direction): boolean {
    if (!this.currentFocusId || !this.items.has(this.currentFocusId)) {
      const first = this.items.keys().next().value;
      if (first) {
        this.setFocus(first);
        return true;
      }
      return false;
    }

    const current = this.items.get(this.currentFocusId)!;
    const curCx = current.rect.x + current.rect.width / 2;
    const curCy = current.rect.y + current.rect.height / 2;

    let bestId: string | null = null;
    let minScore = Infinity;

    for (const [id, candidate] of this.items.entries()) {
      if (id === this.currentFocusId) continue;

      const candCx = candidate.rect.x + candidate.rect.width / 2;
      const candCy = candidate.rect.y + candidate.rect.height / 2;
      const dx = candCx - curCx;
      const dy = candCy - curCy;

      let isValidDirection = false;
      let score = Infinity;

      switch (direction) {
        case 'right':
          if (dx > 5) {
            isValidDirection = true;
            score = dx + Math.abs(dy) * 2.5;
          }
          break;
        case 'left':
          if (dx < -5) {
            isValidDirection = true;
            score = Math.abs(dx) + Math.abs(dy) * 2.5;
          }
          break;
        case 'down':
          if (dy > 5) {
            isValidDirection = true;
            score = dy + Math.abs(dx) * 2.5;
          }
          break;
        case 'up':
          if (dy < -5) {
            isValidDirection = true;
            score = Math.abs(dy) + Math.abs(dx) * 2.5;
          }
          break;
      }

      if (isValidDirection && score < minScore) {
        minScore = score;
        bestId = id;
      }
    }

    if (bestId) {
      this.setFocus(bestId);
      return true;
    }

    return false;
  }

  public triggerSelect(): void {
    if (this.currentFocusId) {
      const item = this.items.get(this.currentFocusId);
      if (item && item.onSelect) {
        item.onSelect();
      }
    }
  }

  public initGlobalKeyboardListener(): () => void {
    if (typeof window === 'undefined' || this.isListening) {
      return () => {};
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      let handled = false;
      switch (e.key) {
        case 'ArrowUp':
          handled = this.move('up');
          break;
        case 'ArrowDown':
          handled = this.move('down');
          break;
        case 'ArrowLeft':
          handled = this.move('left');
          break;
        case 'ArrowRight':
          handled = this.move('right');
          break;
        case 'Enter':
          this.triggerSelect();
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    this.isListening = true;

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      this.isListening = false;
    };
  }
}

export const SpatialNavigation = new SpatialNavigationManager();
