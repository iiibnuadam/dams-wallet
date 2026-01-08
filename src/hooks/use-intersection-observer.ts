import { useEffect, useState, useRef } from 'react';

export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options.threshold, options.root, options.rootMargin]);

  return { ref, inView: isIntersecting };
}
