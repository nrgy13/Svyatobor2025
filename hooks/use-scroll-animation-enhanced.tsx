"use client";

import { useEffect, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAnimationPreloader } from './use-animation-preloader';
import { PRELOAD_CONFIGS } from '@/lib/animation-resources';

interface UseScrollAnimationOptions {
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  staggerDelay?: number;
  animationType?: 'fadeIn' | 'slideUp' | 'slideIn' | 'scale' | 'custom';
  requirePreload?: boolean;
}

interface AnimationVariants {
  initial: any;
  animate: any;
  exit?: any;
}

export function useScrollAnimationEnhanced(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    triggerOnce = true,
    delay = 0,
    staggerDelay = 0,
    animationType = 'fadeIn',
    requirePreload = false,
  } = options;

  const [hasTriggered, setHasTriggered] = useState(false);
  const [isAnimationReady, setIsAnimationReady] = useState(!requirePreload);

  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
  });

  // Проверяем готовность ресурсов для анимации
  const { progress } = useAnimationPreloader({
    resources: PRELOAD_CONFIGS.minimal,
    minProgress: 30, // Минимальный прогресс для начала анимаций
  });

  // Определяем готовность анимации
  useEffect(() => {
    if (!requirePreload) {
      setIsAnimationReady(true);
    } else {
      setIsAnimationReady(progress.percentage >= 30);
    }
  }, [progress.percentage, requirePreload]);

  useEffect(() => {
    if (inView && !hasTriggered && isAnimationReady) {
      const timer = setTimeout(() => {
        setHasTriggered(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [inView, hasTriggered, delay, isAnimationReady]);

  const getAnimationVariants = useCallback((): AnimationVariants => {
    const baseVariants: AnimationVariants = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    };

    switch (animationType) {
      case 'fadeIn':
        return {
          initial: { opacity: 0 },
          animate: {
            opacity: 1,
            transition: { duration: 0.6, ease: "easeOut" }
          },
        };

      case 'slideUp':
        return {
          initial: { opacity: 0, y: 50 },
          animate: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
          },
        };

      case 'slideIn':
        return {
          initial: { opacity: 0, x: -50 },
          animate: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.6, ease: "easeOut" }
          },
        };

      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, ease: "easeOut" }
          },
        };

      default:
        return baseVariants;
    }
  }, [animationType]);

  return {
    ref,
    inView: hasTriggered && isAnimationReady,
    shouldAnimate: inView && hasTriggered && isAnimationReady,
    isAnimationReady,
    animationVariants: getAnimationVariants(),
    preloadProgress: progress,
  };
}

export function useStaggeredAnimationEnhanced(
  itemCount: number,
  options: UseScrollAnimationOptions = {}
) {
  const { staggerDelay = 100, ...animationOptions } = options;
  const { ref, shouldAnimate, isAnimationReady, animationVariants, preloadProgress } = useScrollAnimationEnhanced(animationOptions);

  const getStaggeredDelay = useCallback((index: number) => {
    return index * staggerDelay;
  }, [staggerDelay]);

  const getStaggeredVariants = useCallback((index: number) => {
    const delay = getStaggeredDelay(index);
    return {
      ...animationVariants,
      animate: {
        ...animationVariants.animate,
        transition: {
          ...animationVariants.animate.transition,
          delay: shouldAnimate ? delay / 1000 : 0,
        },
      },
    };
  }, [animationVariants, getStaggeredDelay, shouldAnimate]);

  return {
    ref,
    shouldAnimate,
    isAnimationReady,
    getStaggeredDelay,
    getStaggeredVariants,
    preloadProgress,
  };
}

// Хук для управления производительностью анимаций
export function useAnimationPerformance() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    // Проверяем настройки пользователя для reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);

    // Проверяем производительность устройства
    const checkPerformance = () => {
      const connection = (navigator as any).connection;
      const isSlowConnection = connection && (
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g' ||
        connection.saveData
      );

      const isSlowDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;

      setIsLowPerformance(isSlowConnection || isSlowDevice);
    };

    checkPerformance();
  }, []);

  return {
    isReducedMotion,
    isLowPerformance,
    shouldOptimize: isReducedMotion || isLowPerformance,
  };
}