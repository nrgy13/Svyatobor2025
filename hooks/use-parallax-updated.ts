"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useScrollThrottleContext } from '@/contexts/ScrollThrottleContext';

interface UseParallaxOptions {
  speed?: number;
  disabled?: boolean;
  respectScrollThrottle?: boolean; // Учитывать ограничение скорости скролла
}

export function useParallax(options: UseParallaxOptions = {}) {
  const {
    speed = 0.5,
    disabled = false,
    respectScrollThrottle = true
  } = options;

  const [offsetY, setOffsetY] = useState(0);
  const [isThrottling, setIsThrottling] = useState(false);

  // Получаем состояние ограничения скорости скролла
  const scrollThrottle = respectScrollThrottle ? useScrollThrottleContext() : null;

  const handleScroll = useCallback(() => {
    if (disabled) return;

    // При активном throttling уменьшаем скорость параллакса
    if (scrollThrottle?.isThrottling) {
      setIsThrottling(true);
      // Используем уменьшенную скорость при throttling
      const throttledSpeed = speed * 0.3; // Значительно уменьшаем скорость
      setOffsetY(window.pageYOffset * throttledSpeed);
    } else {
      setIsThrottling(false);
      setOffsetY(window.pageYOffset * speed);
    }
  }, [disabled, speed, scrollThrottle?.isThrottling]);

  useEffect(() => {
    if (disabled) return;

    // Set initial value
    handleScroll();

    const throttledHandleScroll = () => {
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [disabled, handleScroll]);

  // Применяем дополнительное замедление при активном throttling
  const finalOffset = useMemo(() => {
    if (scrollThrottle?.isThrottling && isThrottling) {
      return offsetY * 0.7; // Дополнительное замедление
    }
    return offsetY;
  }, [offsetY, scrollThrottle?.isThrottling, isThrottling]);

  return {
    offsetY: finalOffset,
    isThrottling: scrollThrottle?.isThrottling || false,
    currentSpeed: scrollThrottle?.currentSpeed || 0,
  };
}