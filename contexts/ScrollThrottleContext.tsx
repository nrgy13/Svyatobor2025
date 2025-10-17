"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useScrollThrottle } from '@/hooks/use-scroll-throttle';

interface ScrollThrottleContextType {
  isThrottling: boolean;
  currentSpeed: number;
  maxSpeed: number;
  safeSpeed: number;
  isScrollLimited: boolean;
  throttledScrollTo: (targetScrollTop: number) => void;
}

const ScrollThrottleContext = createContext<ScrollThrottleContextType | undefined>(undefined);

interface ScrollThrottleProviderProps {
  children: ReactNode;
  maxSpeed?: number;
  safeSpeed?: number;
  smoothingFactor?: number;
  enabled?: boolean;
}

export function ScrollThrottleProvider({
  children,
  maxSpeed = 3000,
  safeSpeed = 1500,
  smoothingFactor = 0.8,
  enabled = true,
}: ScrollThrottleProviderProps) {
  const scrollThrottle = useScrollThrottle({
    maxSpeed,
    safeSpeed,
    smoothingFactor,
    enabled,
  });

  const contextValue: ScrollThrottleContextType = {
    isThrottling: scrollThrottle.isThrottling,
    currentSpeed: scrollThrottle.currentSpeed,
    maxSpeed: scrollThrottle.maxSpeed,
    safeSpeed: scrollThrottle.safeSpeed,
    isScrollLimited: scrollThrottle.isScrollLimited,
    throttledScrollTo: scrollThrottle.throttledScrollTo,
  };

  return (
    <ScrollThrottleContext.Provider value={contextValue}>
      {children}
    </ScrollThrottleContext.Provider>
  );
}

export function useScrollThrottleContext() {
  const context = useContext(ScrollThrottleContext);
  if (context === undefined) {
    throw new Error('useScrollThrottleContext must be used within a ScrollThrottleProvider');
  }
  return context;
}