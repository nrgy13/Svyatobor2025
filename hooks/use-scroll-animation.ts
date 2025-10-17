"use client";

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseScrollAnimationOptions {
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  staggerDelay?: number;
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    triggerOnce = true,
    delay = 0,
    staggerDelay = 0
  } = options;

  const [hasTriggered, setHasTriggered] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
  });

  useEffect(() => {
    if (inView && !hasTriggered) {
      const timer = setTimeout(() => {
        setHasTriggered(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [inView, hasTriggered, delay]);

  return {
    ref,
    inView: hasTriggered,
    shouldAnimate: inView && hasTriggered,
  };
}

export function useStaggeredAnimation(
  itemCount: number,
  options: UseScrollAnimationOptions = {}
) {
  const { staggerDelay = 100 } = options;
  const { ref, shouldAnimate } = useScrollAnimation(options);

  const getStaggeredDelay = (index: number) => index * staggerDelay;

  return {
    ref,
    shouldAnimate,
    getStaggeredDelay,
  };
}