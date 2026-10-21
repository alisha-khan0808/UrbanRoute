"use client";

import { useEffect, useState, type RefObject } from "react";

/** True while the element is (nearly) on screen — used to pause 3D rendering off-screen. */
export function useInView(ref: RefObject<Element>, rootMargin = "100px") {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
