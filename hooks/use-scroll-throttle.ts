"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseScrollThrottleOptions {
  maxSpeed?: number; // Максимальная скорость скролла в px/s (по умолчанию 3000)
  safeSpeed?: number; // Безопасная скорость в px/s (по умолчанию 1500)
  smoothingFactor?: number; // Коэффициент плавности замедления (по умолчанию 0.8)
  enabled?: boolean; // Включено ли ограничение скорости
}

interface ScrollThrottleState {
  isThrottling: boolean;
  currentSpeed: number;
  targetSpeed: number;
  scrollVelocity: number;
}

export function useScrollThrottle(options: UseScrollThrottleOptions = {}) {
  const {
    maxSpeed = 3000,
    safeSpeed = 1500,
    smoothingFactor = 0.8,
    enabled = true,
  } = options;

  const [scrollState, setScrollState] = useState<ScrollThrottleState>({
    isThrottling: false,
    currentSpeed: 0,
    targetSpeed: 0,
    scrollVelocity: 0,
  });

  const lastScrollTime = useRef<number>(0);
  const lastScrollTop = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  const velocityBuffer = useRef<number[]>([]);
  const isThrottlingRef = useRef<boolean>(false);

  const calculateVelocity = useCallback((scrollTop: number, timestamp: number): number => {
    if (lastScrollTime.current === 0) {
      lastScrollTime.current = timestamp;
      lastScrollTop.current = scrollTop;
      return 0;
    }

    const deltaTime = timestamp - lastScrollTime.current;
    const deltaScroll = Math.abs(scrollTop - lastScrollTop.current);

    if (deltaTime === 0) return 0;

    const velocity = (deltaScroll / deltaTime) * 1000; // px/s

    // Добавляем в буфер для усреднения
    velocityBuffer.current.push(velocity);
    if (velocityBuffer.current.length > 5) {
      velocityBuffer.current.shift();
    }

    lastScrollTime.current = timestamp;
    lastScrollTop.current = scrollTop;

    // Возвращаем усредненную скорость
    return velocityBuffer.current.reduce((sum, v) => sum + v, 0) / velocityBuffer.current.length;
  }, []);

  const applyScrollThrottling = useCallback((targetScrollTop: number) => {
    if (!enabled || !isThrottlingRef.current) {
      window.scrollTo(0, targetScrollTop);
      return;
    }

    const currentScrollTop = window.pageYOffset;
    const delta = targetScrollTop - currentScrollTop;

    if (Math.abs(delta) < 1) return;

    // Применяем плавное замедление
    const throttledDelta = delta * smoothingFactor;
    const throttledScrollTop = currentScrollTop + throttledDelta;

    window.scrollTo(0, throttledScrollTop);

    // Продолжаем анимацию если еще нужно движение
    if (Math.abs(targetScrollTop - throttledScrollTop) > 1) {
      animationFrameId.current = requestAnimationFrame(() =>
        applyScrollThrottling(targetScrollTop)
      );
    } else {
      // Достигли цели, выходим из режима throttling
      setScrollState(prev => ({ ...prev, isThrottling: false }));
      isThrottlingRef.current = false;
    }
  }, [enabled, smoothingFactor]);

  const handleScroll = useCallback(() => {
    if (!enabled) return;

    const timestamp = performance.now();
    const scrollTop = window.pageYOffset;
    const velocity = calculateVelocity(scrollTop, timestamp);

    setScrollState(prev => ({
      ...prev,
      currentSpeed: velocity,
      scrollVelocity: scrollTop - lastScrollTop.current,
    }));

    // Проверяем необходимость активации throttling
    if (velocity > maxSpeed && !isThrottlingRef.current) {
      setScrollState(prev => ({ ...prev, isThrottling: true }));
      isThrottlingRef.current = true;
    }

    // Выходим из режима throttling если скорость нормализовалась
    if (velocity < safeSpeed && isThrottlingRef.current && Math.abs(scrollTop - lastScrollTop.current) < 10) {
      setScrollState(prev => ({ ...prev, isThrottling: false }));
      isThrottlingRef.current = false;
    }
  }, [enabled, maxSpeed, safeSpeed, calculateVelocity]);

  const throttledScrollTo = useCallback((targetScrollTop: number) => {
    if (!enabled || !isThrottlingRef.current) {
      window.scrollTo(0, targetScrollTop);
      return;
    }

    // Отменяем предыдущую анимацию
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    // Запускаем throttling анимацию
    animationFrameId.current = requestAnimationFrame(() =>
      applyScrollThrottling(targetScrollTop)
    );
  }, [enabled, applyScrollThrottling]);

  useEffect(() => {
    if (!enabled) return;

    const throttledHandleScroll = () => {
      animationFrameId.current = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [enabled, handleScroll]);

  return {
    ...scrollState,
    throttledScrollTo,
    isScrollLimited: isThrottlingRef.current,
    maxSpeed,
    safeSpeed,
  };
}