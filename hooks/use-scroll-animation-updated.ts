"use client";

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useScrollThrottleContext } from '@/contexts/ScrollThrottleContext';

interface UseScrollAnimationOptions {
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  staggerDelay?: number;
  respectScrollThrottle?: boolean; // Учитывать ограничение скорости скролла
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    triggerOnce = true,
    delay = 0,
    staggerDelay = 0,
    respectScrollThrottle = true
  } = options;

  const [hasTriggered, setHasTriggered] = useState(false);
  const [isAnimationBlocked, setIsAnimationBlocked] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
  });

  // Получаем состояние ограничения скорости скролла
  const scrollThrottle = respectScrollThrottle ? useScrollThrottleContext() : null;

  useEffect(() => {
    if (inView && !hasTriggered) {
      // Если включено ограничение скорости скролла и оно активно,
      // блокируем анимацию до нормализации скорости
      if (scrollThrottle?.isThrottling) {
        setIsAnimationBlocked(true);
        return;
      }

      const timer = setTimeout(() => {
        setHasTriggered(true);
        setIsAnimationBlocked(false);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [inView, hasTriggered, delay, scrollThrottle?.isThrottling]);

  // Отслеживаем изменения состояния throttling
  useEffect(() => {
    if (scrollThrottle?.isThrottling && inView && !hasTriggered) {
      setIsAnimationBlocked(true);
    } else if (!scrollThrottle?.isThrottling && inView && !hasTriggered) {
      setIsAnimationBlocked(false);
      // Запускаем анимацию после нормализации скорости
      const timer = setTimeout(() => {
        setHasTriggered(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [scrollThrottle?.isThrottling, inView, hasTriggered, delay]);

  return {
    ref,
    inView: hasTriggered,
    shouldAnimate: inView && hasTriggered && !isAnimationBlocked,
    isAnimationBlocked,
    isScrollThrottling: scrollThrottle?.isThrottling || false,
  };
}

export function useStaggeredAnimation(
  itemCount: number,
  options: UseScrollAnimationOptions = {}
) {
  const { staggerDelay = 100, respectScrollThrottle = true } = options;
  const { ref, shouldAnimate, isAnimationBlocked, isScrollThrottling } = useScrollAnimation({
    ...options,
    respectScrollThrottle
  });

  const getStaggeredDelay = (index: number) => {
    // Увеличиваем задержку при ограничении скорости скролла
    const baseDelay = index * staggerDelay;
    return isScrollThrottling ? baseDelay * 1.5 : baseDelay;
  };

  return {
    ref,
    shouldAnimate,
    isAnimationBlocked,
    isScrollThrottling,
    getStaggeredDelay,
  };
}