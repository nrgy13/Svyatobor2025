"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LoadingAnimationContextType {
  isPageReady: boolean;
  finishLoading: () => void;
  registerAnimation: (id: string) => void;
  unregisterAnimation: (id: string) => void;
}

const LoadingAnimationContext = createContext<LoadingAnimationContextType | undefined>(undefined);

export function LoadingAnimationProvider({ children }: { children: ReactNode }) {
  const [isPageReady, setIsPageReady] = useState(false);
  const [animations, setAnimations] = useState<Set<string>>(new Set());

  const finishLoading = () => {
    setIsPageReady(true);
  };

  const registerAnimation = (id: string) => {
    setAnimations(prev => new Set(prev).add(id));
  };

  const unregisterAnimation = (id: string) => {
    setAnimations(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  // Проверяем готовность страницы после монтирования
  useEffect(() => {
    const checkPageReady = () => {
      // Проверяем, что DOM готов и основные ресурсы загружены
      if (document.readyState === 'complete') {
        // Даем время на инициализацию анимаций
        setTimeout(() => {
          finishLoading();
        }, 1500);
      }
    };

    if (document.readyState === 'complete') {
      checkPageReady();
    } else {
      window.addEventListener('load', checkPageReady);
      return () => window.removeEventListener('load', checkPageReady);
    }
  }, []);

  return (
    <LoadingAnimationContext.Provider
      value={{
        isPageReady,
        finishLoading,
        registerAnimation,
        unregisterAnimation,
      }}
    >
      {children}
    </LoadingAnimationContext.Provider>
  );
}

export function useLoadingAnimation() {
  const context = useContext(LoadingAnimationContext);
  if (context === undefined) {
    throw new Error('useLoadingAnimation must be used within a LoadingAnimationProvider');
  }
  return context;
}