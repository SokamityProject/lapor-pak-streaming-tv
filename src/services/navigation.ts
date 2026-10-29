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
  element?: HTMLElement;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

class SpatialNavigationManager {
  private items = new Map<string, FocusItem>();
  private currentFocusId: string | null = null;
  private activeScopeId: string | null = null;
  private listeners = new Set<(id: string | null) => void>();
  private isListening = false;
  private lastKeyTime = 0;

  public register(id: string, rect: Rect, onSelect?: () => void, groupId?: string, element?: HTMLElement): void {
    this.items.set(id, { id, rect, onSelect, groupId, element });
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
      const candidates = this.getCandidates();
      const next = candidates.length > 0 ? candidates[0].id : null;
      this.setFocus(next);
    }
  }

  public setScope(scopeId: string | null): void {
    this.activeScopeId = scopeId;
    if (scopeId) {
      const scopedItems = this.getCandidates();
      if (scopedItems.length > 0 && (!this.currentFocusId || !scopedItems.some(i => i.id === this.currentFocusId))) {
        this.setFocus(scopedItems[0].id);
      }
    }
  }

  public getScope(): string | null {
    return this.activeScopeId;
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
    this.activeScopeId = null;
    this.listeners.clear();
  }

  public subscribe(listener: (id: string | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private getItemRect(item: FocusItem): Rect {
    if (item.element && typeof item.element.getBoundingClientRect === 'function') {
      const b = item.element.getBoundingClientRect();
      return {
        x: b.left + (typeof window !== 'undefined' ? window.scrollX : 0),
        y: b.top + (typeof window !== 'undefined' ? window.scrollY : 0),
        width: b.width,
        height: b.height,
      };
    }
    return item.rect;
  }

  private getCandidates(): FocusItem[] {
    const all = Array.from(this.items.values());
    if (this.activeScopeId) {
      return all.filter((i) => i.groupId === this.activeScopeId);
    }
    return all;
  }

  public move(direction: Direction): boolean {
    const candidates = this.getCandidates();
    if (candidates.length === 0) return false;

    if (!this.currentFocusId || !this.items.has(this.currentFocusId)) {
      this.setFocus(candidates[0].id);
      return true;
    }

    const current = this.items.get(this.currentFocusId)!;
    const currentRect = this.getItemRect(current);
    const curCx = currentRect.x + currentRect.width / 2;
    const curCy = currentRect.y + currentRect.height / 2;

    let bestId: string | null = null;
    let minScore = Infinity;

    for (const candidate of candidates) {
      if (candidate.id === this.currentFocusId) continue;

      const candRect = this.getItemRect(candidate);
      const candCx = candRect.x + candRect.width / 2;
      const candCy = candRect.y + candRect.height / 2;
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
        bestId = candidate.id;
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
      // Key repeat throttling (70ms) to prevent dropped frames on TV remote long-press
      const now = performance.now();
      if (e.repeat && now - this.lastKeyTime < 70) {
        e.preventDefault();
        return;
      }
      this.lastKeyTime = now;

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
