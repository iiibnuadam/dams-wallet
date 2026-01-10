import { useState, useCallback, useRef } from 'react';

export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((node: Element | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      const observer = new IntersectionObserver(([entry]) => {
        setIntersecting(entry.isIntersecting);
      }, options);

      observer.observe(node);
      observerRef.current = observer;
    }
  }, [options.threshold, options.root, options.rootMargin]);

  return { ref, inView: isIntersecting };
}
