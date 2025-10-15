"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';

interface UseParallaxOptions {
  speed?: number;
  disabled?: boolean;
}

export function useParallax(options: UseParallaxOptions = {}) {
  const { speed = 0.5, disabled = false } = options;
  const [offsetY, setOffsetY] = useState(0);

  const handleScroll = useCallback(() => {
    if (disabled) return;
    setOffsetY(window.pageYOffset);
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;

    // Set initial value
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [disabled, handleScroll]);

  return useMemo(() => offsetY * speed, [offsetY, speed]);
}