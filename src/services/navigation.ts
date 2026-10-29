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
  private activeSidebarId: string = 'nav-home';
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

  public setActiveSidebarItem(id: string): void {
    this.activeSidebarId = id;
  }

  public getActiveSidebarItem(): string {
    if (this.activeSidebarId && this.items.has(this.activeSidebarId)) {
      return this.activeSidebarId;
    }
    const sidebarOrder = ['nav-home', 'nav-playlist', 'nav-history', 'nav-exit'];
    for (const id of sidebarOrder) {
      if (this.items.has(id)) return id;
    }
    return 'nav-home';
  }

  public setFocus(id: string | null): void {
    if (this.currentFocusId !== id) {
      this.currentFocusId = id;
      if (id && ['nav-home', 'nav-playlist', 'nav-history'].includes(id)) {
        this.activeSidebarId = id;
      }
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
    this.activeSidebarId = 'nav-home';
    this.listeners.clear();
  }

  public subscribe(listener: (id: string | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private getCandidates(): FocusItem[] {
    const all = Array.from(this.items.values());
    if (this.activeScopeId) {
      return all.filter((i) => i.groupId === this.activeScopeId);
    }
    return all;
  }

  /**
   * Deterministic structural navigation for known Android TV components.
   * Guarantees 0-glitch, O(1), predictable row/grid navigation.
   */
  private moveDeterministic(currentId: string, direction: Direction): string | null {
    if (this.activeScopeId) {
      // If modal or dialog is active, handle modal buttons
      if (currentId === 'exit-cancel-btn' && direction === 'right') {
        return this.items.has('exit-confirm-btn') ? 'exit-confirm-btn' : null;
      }
      if (currentId === 'exit-confirm-btn' && direction === 'left') {
        return this.items.has('exit-cancel-btn') ? 'exit-cancel-btn' : null;
      }
      if (currentId === 'player-retry-link-btn' && direction === 'right') {
        return this.items.has('player-error-back-btn') ? 'player-error-back-btn' : null;
      }
      if (currentId === 'player-error-back-btn' && direction === 'left') {
        return this.items.has('player-retry-link-btn') ? 'player-retry-link-btn' : null;
      }
      return null;
    }

    // 1. Sidebar Navigation (Left Vertical Bar)
    // Order: nav-home -> nav-playlist -> nav-history -> nav-exit
    if (currentId.startsWith('nav-')) {
      const sidebarItems = ['nav-home', 'nav-playlist', 'nav-history', 'nav-exit'].filter(id => this.items.has(id));
      const idx = sidebarItems.indexOf(currentId);
      if (idx !== -1) {
        if (direction === 'down') {
          if (idx < sidebarItems.length - 1) {
            return sidebarItems[idx + 1];
          }
          return currentId;
        }
        if (direction === 'up') {
          if (idx > 0) {
            return sidebarItems[idx - 1];
          }
          return currentId;
        }
        if (direction === 'left') {
          return currentId;
        }
        if (direction === 'right') {
          const target = this.getSidebarRightTarget(currentId);
          if (target && this.items.has(target)) {
            return target;
          }
          return null;
        }
      }
    }

    // 2. Hero Spotlight Play Button
    if (currentId === 'hero-play-btn') {
      if (direction === 'left') {
        return this.getActiveSidebarItem();
      }
      if (direction === 'down') {
        const firstCard = this.findFirstAvailableCard();
        if (firstCard) return firstCard;
      }
      if (direction === 'up' || direction === 'right') {
        return currentId;
      }
      return null;
    }

    // 3. Rail Cards: rail-{railId}-card-{idx}
    const railMatch = currentId.match(/^rail-(.+)-card-(\d+)$/);
    if (railMatch) {
      const railId = railMatch[1];
      const cardIdx = parseInt(railMatch[2], 10);
      const allRails = this.getOrderedRailIds();
      const currentRailIdx = allRails.indexOf(railId);

      if (direction === 'left') {
        if (cardIdx > 0 && this.items.has(`rail-${railId}-card-${cardIdx - 1}`)) {
          return `rail-${railId}-card-${cardIdx - 1}`;
        }
        if (cardIdx === 0) {
          return this.getActiveSidebarItem();
        }
        return null;
      }
      if (direction === 'right') {
        if (this.items.has(`rail-${railId}-card-${cardIdx + 1}`)) {
          return `rail-${railId}-card-${cardIdx + 1}`;
        }
        return null;
      }
      if (direction === 'down') {
        if (currentRailIdx !== -1 && currentRailIdx < allRails.length - 1) {
          const nextRailId = allRails[currentRailIdx + 1];
          return this.findBestCardInRail(nextRailId, cardIdx);
        }
        return null;
      }
      if (direction === 'up') {
        if (currentRailIdx > 0) {
          const prevRailId = allRails[currentRailIdx - 1];
          const target = this.findBestCardInRail(prevRailId, cardIdx);
          if (target) return target;
        }
        // At top rail, going UP always goes to Hero Spotlight Play Button if present, else stay at top card
        if (this.items.has('hero-play-btn')) return 'hero-play-btn';
        return currentId;
      }
    }

    // 4. Playlist Grid Cards (3 columns): playlist-card-{idx}
    const playlistMatch = currentId.match(/^playlist-card-(\d+)$/);
    if (playlistMatch) {
      const idx = parseInt(playlistMatch[1], 10);
      const cols = 3;
      if (direction === 'left') {
        if (idx % cols !== 0 && this.items.has(`playlist-card-${idx - 1}`)) {
          return `playlist-card-${idx - 1}`;
        }
        if (idx % cols === 0) {
          if (this.items.has('nav-playlist')) return 'nav-playlist';
          return this.getActiveSidebarItem();
        }
        return null;
      }
      if (direction === 'right' && (idx + 1) % cols !== 0 && this.items.has(`playlist-card-${idx + 1}`)) {
        return `playlist-card-${idx + 1}`;
      }
      if (direction === 'down' && this.items.has(`playlist-card-${idx + cols}`)) {
        return `playlist-card-${idx + cols}`;
      }
      if (direction === 'up') {
        if (idx >= cols && this.items.has(`playlist-card-${idx - cols}`)) {
          return `playlist-card-${idx - cols}`;
        }
        return currentId;
      }
    }

    // 5. History Grid Cards (3 columns): history-card-{idx}
    const historyMatch = currentId.match(/^history-card-(\d+)$/);
    if (historyMatch) {
      const idx = parseInt(historyMatch[1], 10);
      const cols = 3;
      if (direction === 'left') {
        if (idx % cols !== 0 && this.items.has(`history-card-${idx - 1}`)) {
          return `history-card-${idx - 1}`;
        }
        if (idx % cols === 0) {
          if (this.items.has('nav-history')) return 'nav-history';
          return this.getActiveSidebarItem();
        }
        return null;
      }
      if (direction === 'right' && (idx + 1) % cols !== 0 && this.items.has(`history-card-${idx + 1}`)) {
        return `history-card-${idx + 1}`;
      }
      if (direction === 'down' && this.items.has(`history-card-${idx + cols}`)) {
        return `history-card-${idx + cols}`;
      }
      if (direction === 'up') {
        if (idx >= cols && this.items.has(`history-card-${idx - cols}`)) {
          return `history-card-${idx - cols}`;
        }
        return currentId;
      }
    }

    // 6. Retry Button
    if (currentId === 'btn-retry') {
      if (direction === 'left') {
        return this.getActiveSidebarItem();
      }
      if (direction === 'up') {
        return currentId;
      }
    }

    return null;
  }

  private getSidebarRightTarget(currentId: string): string | null {
    if (currentId === 'nav-playlist' && this.items.has('playlist-card-0')) {
      return 'playlist-card-0';
    }
    if (currentId === 'nav-history' && this.items.has('history-card-0')) {
      return 'history-card-0';
    }
    if (this.items.has('hero-play-btn')) {
      return 'hero-play-btn';
    }
    const firstCard = this.findFirstAvailableCard();
    if (firstCard) {
      return firstCard;
    }
    if (this.items.has('playlist-card-0')) return 'playlist-card-0';
    if (this.items.has('history-card-0')) return 'history-card-0';
    return null;
  }

  private getOrderedRailIds(): string[] {
    const railSet = new Set<string>();
    for (const key of this.items.keys()) {
      const match = key.match(/^rail-(.+)-card-\d+$/);
      if (match) {
        railSet.add(match[1]);
      }
    }
    const rails = Array.from(railSet);
    rails.sort((a, b) => {
      // 'continue' is strictly the first rail
      if (a === 'continue') return -1;
      if (b === 'continue') return 1;
      // Sort months numerically: month-0, month-1, month-2...
      const aNum = a.match(/^month-(\d+)$/);
      const bNum = b.match(/^month-(\d+)$/);
      if (aNum && bNum) {
        return parseInt(aNum[1], 10) - parseInt(bNum[1], 10);
      }
      const aIsNum = /^\d+$/.test(a);
      const bIsNum = /^\d+$/.test(b);
      if (aIsNum && bIsNum) {
        return parseInt(a, 10) - parseInt(b, 10);
      }
      return a.localeCompare(b);
    });
    return rails;
  }

  private findBestCardInRail(railId: string, preferredCol: number): string | null {
    if (this.items.has(`rail-${railId}-card-${preferredCol}`)) {
      return `rail-${railId}-card-${preferredCol}`;
    }
    // Fall back to highest available card index in this rail
    for (let c = preferredCol - 1; c >= 0; c--) {
      if (this.items.has(`rail-${railId}-card-${c}`)) {
        return `rail-${railId}-card-${c}`;
      }
    }
    return this.items.has(`rail-${railId}-card-0`) ? `rail-${railId}-card-0` : null;
  }

  private findFirstAvailableCard(): string | null {
    if (this.items.has('rail-continue-card-0')) return 'rail-continue-card-0';
    const orderedRails = this.getOrderedRailIds();
    for (const railId of orderedRails) {
      const key = `rail-${railId}-card-0`;
      if (this.items.has(key)) return key;
    }
    for (const key of this.items.keys()) {
      if (key.startsWith('rail-') && key.endsWith('-card-0')) {
        return key;
      }
    }
    return null;
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

  public move(direction: Direction): boolean {
    const candidates = this.getCandidates();
    if (candidates.length === 0) return false;

    if (!this.currentFocusId || !this.items.has(this.currentFocusId)) {
      this.setFocus(candidates[0].id);
      return true;
    }

    // Step 1: Try deterministic navigation first for 100% predictable TV flow
    const deterministicTarget = this.moveDeterministic(this.currentFocusId, direction);
    if (deterministicTarget && this.items.has(deterministicTarget)) {
      this.setFocus(deterministicTarget);
      return true;
    }

    // Step 2: Robust geometric fallback for arbitrary items or modal dialogs
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
            score = dx + Math.abs(dy) * 3;
          }
          break;
        case 'left':
          if (dx < -5) {
            isValidDirection = true;
            score = Math.abs(dx) + Math.abs(dy) * 3;
          }
          break;
        case 'down':
          if (dy > 5) {
            isValidDirection = true;
            score = dy * 2.5 + Math.abs(dx);
          }
          break;
        case 'up':
          if (dy < -5) {
            isValidDirection = true;
            score = Math.abs(dy) * 2.5 + Math.abs(dx);
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
      // Key repeat throttling (50ms) - lightweight and responsive
      const now = performance.now();
      if (e.repeat && now - this.lastKeyTime < 50) {
        e.preventDefault();
        return;
      }
      this.lastKeyTime = now;

      let handled = false;
      const key = e.key;
      const code = (e as any).keyCode;

      if (key === 'ArrowUp' || key === 'Up' || code === 19) {
        handled = this.move('up');
      } else if (key === 'ArrowDown' || key === 'Down' || code === 20) {
        handled = this.move('down');
      } else if (key === 'ArrowLeft' || key === 'Left' || code === 21) {
        handled = this.move('left');
      } else if (key === 'ArrowRight' || key === 'Right' || code === 22) {
        handled = this.move('right');
      } else if (key === 'Enter' || key === 'Select' || key === ' ' || code === 13 || code === 23) {
        this.triggerSelect();
        handled = true;
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
