import { useEffect, useRef } from 'react';

export function useScrollToBottom<T>(dep: T) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver(() => {
        if (ref.current) {
          ref.current.scrollTop = ref.current.scrollHeight;
        }
      });

      observer.observe(ref.current, { childList: true, subtree: true });

      return () => observer.disconnect();
    }
  }, [dep]);

  return ref;
}
