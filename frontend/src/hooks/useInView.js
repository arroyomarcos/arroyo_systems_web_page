import { useEffect, useRef, useState } from "react";

// One-shot IntersectionObserver flag for scroll-in animations. One-shot on
// purpose: re-playing the entrance every time a section scrolls back into view
// reads as jitter on a marketing page, not as polish.
export const useInView = ({ threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Reduced-motion users get the end state immediately rather than nothing:
    // the content still has to be readable, it just never animates.
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
};

export default useInView;
