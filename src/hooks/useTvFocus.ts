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
  const [element, setElement] = useState<T | null>(null);
  const elementRef = useRef<T | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const setRef = useCallback((node: T | null) => {
    elementRef.current = node;
    setElement(node);
  }, []);

  const measureAndRegister = useCallback(() => {
    const el = elementRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      SpatialNavigation.register(
        id,
        {
          x: rect.left + (typeof window !== 'undefined' ? window.scrollX : 0),
          y: rect.top + (typeof window !== 'undefined' ? window.scrollY : 0),
          width: rect.width,
          height: rect.height,
        },
        () => onSelectRef.current?.(),
        groupId,
        el
      );
    }
  }, [id, groupId]);

  useEffect(() => {
    if (element) {
      measureAndRegister();

      if (autoFocus) {
        SpatialNavigation.setFocus(id);
      }
    }

    const unsubscribe = SpatialNavigation.subscribe((currentId) => {
      const focused = currentId === id;
      setIsFocused(focused);
      const el = elementRef.current;
      if (focused && el) {
        const isTopSection =
          id.startsWith('nav-') ||
          id.startsWith('sidebar-') ||
          id.startsWith('hero-') ||
          id === 'hero-play-btn';

        const defaultBlock: ScrollLogicalPosition = isTopSection ? 'start' : 'center';
        const defaultInline: ScrollLogicalPosition = 'nearest';

        if (typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({
            behavior: scrollBehavior,
            block: scrollBlock ?? defaultBlock,
            inline: scrollInline ?? defaultInline,
          });
        }

        // Horizontal rail scroll adjustment for TV video cards
        const parent = el.parentElement;
        if (parent) {
          if (id.endsWith('-card-0') || !el.previousElementSibling) {
            parent.scrollLeft = 0;
            if (typeof parent.scrollTo === 'function') {
              try {
                parent.scrollTo({ left: 0, behavior: scrollBehavior });
              } catch (e) {}
            }
          } else if (parent.scrollWidth > parent.clientWidth) {
            const parentRect = parent.getBoundingClientRect();
            const cardRect = el.getBoundingClientRect();
            const PADDING = 48; // Generous margin ensuring scale-108 focus zoom never clips
            if (cardRect.left - PADDING < parentRect.left) {
              const diff = parentRect.left - cardRect.left + PADDING;
              const newLeft = Math.max(0, parent.scrollLeft - diff);
              parent.scrollLeft = newLeft;
              if (typeof parent.scrollTo === 'function') {
                try {
                  parent.scrollTo({ left: newLeft, behavior: scrollBehavior });
                } catch (e) {}
              }
            } else if (cardRect.right + PADDING > parentRect.right) {
              const diff = cardRect.right + PADDING - parentRect.right;
              const newLeft = parent.scrollLeft + diff;
              parent.scrollLeft = newLeft;
              if (typeof parent.scrollTo === 'function') {
                try {
                  parent.scrollTo({ left: newLeft, behavior: scrollBehavior });
                } catch (e) {}
              }
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
      SpatialNavigation.unregister(id);
    };
  }, [id, autoFocus, measureAndRegister, scrollBlock, scrollInline, scrollBehavior, element]);

  // Support both ref object and callback ref for 100% interoperability
  const ref = setRef as unknown as React.MutableRefObject<T | null>;
  Object.defineProperty(ref, 'current', {
    get: () => elementRef.current,
    set: (v: T | null) => {
      elementRef.current = v;
      setElement(v);
    },
    configurable: true,
  });

  return { ref, isFocused };
}
