"use client";

import { useState, useEffect, useCallback } from 'react';

export interface AnimationResource {
  id: string;
  type: 'image' | 'css' | 'lottie' | 'font';
  src: string;
  priority?: 'high' | 'medium' | 'low';
  preload?: boolean;
}

export interface PreloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentResource?: string;
  isComplete: boolean;
}

export interface UseAnimationPreloaderOptions {
  resources: AnimationResource[];
  minProgress?: number; // Минимальный прогресс для завершения (по умолчанию 50%)
  onProgress?: (progress: PreloadProgress) => void;
  onComplete?: () => void;
  onError?: (error: Error, resource: AnimationResource) => void;
}

export function useAnimationPreloader(options: UseAnimationPreloaderOptions) {
  const {
    resources,
    minProgress = 50,
    onProgress,
    onComplete,
    onError
  } = options;

  const [progress, setProgress] = useState<PreloadProgress>({
    loaded: 0,
    total: resources.length,
    percentage: 0,
    isComplete: false,
  });

  const [isPreloading, setIsPreloading] = useState(true);

  const preloadResource = useCallback(async (resource: AnimationResource): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        switch (resource.type) {
          case 'image':
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${resource.src}`));
            img.src = resource.src;
            break;

          case 'css':
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = resource.src;
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${resource.src}`));
            document.head.appendChild(link);
            break;

          case 'font':
            const font = new FontFace('preload-font', `url(${resource.src})`);
            font.load().then(() => {
              document.fonts.add(font);
              resolve();
            }).catch(reject);
            break;

          case 'lottie':
            // Для Lottie анимаций используем fetch для предзагрузки JSON
            fetch(resource.src)
              .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
              })
              .then(() => resolve())
              .catch(reject);
            break;

          default:
            resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const startPreloading = useCallback(async () => {
    if (resources.length === 0) {
      setProgress(prev => ({ ...prev, isComplete: true, percentage: 100 }));
      setIsPreloading(false);
      onComplete?.();
      return;
    }

    setIsPreloading(true);
    let loadedCount = 0;

    // Сортируем ресурсы по приоритету
    const sortedResources = [...resources].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return bPriority - aPriority;
    });

    // Используем Promise.allSettled для параллельной загрузки с отслеживанием прогресса
    const preloadPromises = sortedResources.map(async (resource, index) => {
      try {
        await preloadResource(resource);

        loadedCount++;
        const percentage = Math.round((loadedCount / resources.length) * 100);

        setProgress(prev => ({
          ...prev,
          loaded: loadedCount,
          percentage,
          currentResource: resource.id,
        }));

        onProgress?.({
          loaded: loadedCount,
          total: resources.length,
          percentage,
          currentResource: resource.id,
          isComplete: percentage >= minProgress,
        });

        // Если достигли минимального прогресса, считаем загрузку завершенной
        if (percentage >= minProgress && !progress.isComplete) {
          setProgress(prev => ({ ...prev, isComplete: true }));
          setIsPreloading(false);
          onComplete?.();
        }

      } catch (error) {
        const err = error as Error;
        onError?.(err, resource);

        // Продолжаем загрузку даже при ошибке одного ресурса
        loadedCount++;
        const percentage = Math.round((loadedCount / resources.length) * 100);

        setProgress(prev => ({
          ...prev,
          loaded: loadedCount,
          percentage: Math.min(percentage, minProgress), // Не превышаем минимальный порог
          currentResource: resource.id,
        }));
      }
    });

    await Promise.allSettled(preloadPromises);

    // Финальное обновление состояния
    setProgress(prev => ({
      ...prev,
      isComplete: true,
      percentage: 100,
    }));

    setIsPreloading(false);
    onComplete?.();

  }, [resources, minProgress, preloadResource, onProgress, onComplete, onError, progress.isComplete]);

  useEffect(() => {
    startPreloading();
  }, [startPreloading]);

  const retry = useCallback(() => {
    setProgress({
      loaded: 0,
      total: resources.length,
      percentage: 0,
      isComplete: false,
    });
    startPreloading();
  }, [resources.length, startPreloading]);

  return {
    progress,
    isPreloading,
    retry,
    startPreloading,
  };
}