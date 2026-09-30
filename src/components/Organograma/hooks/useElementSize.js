import { useEffect, useRef, useState } from 'react';

export function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observerRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      setSize((prev) => {
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    };

    update();

    if (typeof ResizeObserver !== 'undefined') {
      observerRef.current = new ResizeObserver(update);
      observerRef.current.observe(el);
    } else {
      window.addEventListener('resize', update);
    }

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref]);

  return size;
}
