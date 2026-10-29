import { useEffect, useRef, useState, useCallback } from 'react';
import { SpatialNavigation } from '../services/navigation';

export interface UseTvFocusOptions {
  id: string;
  onSelect?: () => void;
  groupId?: string;
  autoFocus?: boolean;
  scrollBlock?: ScrollLogicalPosition;
  scrollInline?: ScrollLogicalPosition;
  scrollBehavior?: ScrollBehavior;
}

export function useTvFocus<T extends HTMLElement = HTMLDivElement>({
  id,
  onSelect,
  groupId,
  autoFocus = false,
  scrollBlock,
  scrollInline,
  scrollBehavior = 'auto',
}: UseTvFocusOptions) {
  const ref = useRef<T | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const measureAndRegister = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      SpatialNavigation.register(
        id,
        {
          x: rect.left + (typeof window !== 'undefined' ? window.scrollX : 0),
          y: rect.top + (typeof window !== 'undefined' ? window.scrollY : 0),
          width: rect.width,
          height: rect.height,
        },
        onSelect,
        groupId,
        ref.current
      );
    }
  }, [id, onSelect, groupId]);

  useEffect(() => {
    measureAndRegister();

    if (autoFocus) {
      SpatialNavigation.setFocus(id);
    }

    const unsubscribe = SpatialNavigation.subscribe((currentId) => {
      const focused = currentId === id;
      setIsFocused(focused);
      if (focused && ref.current) {
        const isTopSection =
          id.startsWith('nav-') ||
          id.startsWith('sidebar-') ||
          id.startsWith('hero-') ||
          id === 'hero-play-btn';

        const defaultBlock: ScrollLogicalPosition = isTopSection ? 'start' : 'center';
        const defaultInline: ScrollLogicalPosition = 'nearest';

        if (typeof ref.current.scrollIntoView === 'function') {
          ref.current.scrollIntoView({
            behavior: scrollBehavior,
            block: scrollBlock ?? defaultBlock,
            inline: scrollInline ?? defaultInline,
          });
        }
      }
    });

    return () => {
      unsubscribe();
      SpatialNavigation.unregister(id);
    };
  }, [id, autoFocus, measureAndRegister, scrollBlock, scrollInline, scrollBehavior]);

  return { ref, isFocused };
}
