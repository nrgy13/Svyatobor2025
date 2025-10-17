import { useState, useEffect } from 'react';

// Мониторинг производительности анимаций
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  isOptimal: boolean;
}

export class AnimationPerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameTime = 16.67; // 60fps
  private metricsHistory: PerformanceMetrics[] = [];
  private maxHistorySize = 60; // Храним метрики за последнюю секунду

  // Настройки производительности
  private readonly OPTIMAL_FPS = 50;
  private readonly WARNING_FPS = 30;
  private readonly CRITICAL_FPS = 15;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    const measureFPS = () => {
      this.frameCount++;
      const currentTime = performance.now();

      // Измеряем FPS каждую секунду
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.frameTime = 1000 / this.fps;

        this.recordMetrics();
        this.frameCount = 0;
        this.lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  private recordMetrics() {
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit : 0;

    const metrics: PerformanceMetrics = {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage,
      isOptimal: this.fps >= this.OPTIMAL_FPS,
    };

    this.metricsHistory.push(metrics);

    // Ограничиваем размер истории
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    // Автоматическая оптимизация при плохой производительности
    if (!metrics.isOptimal && this.fps < this.WARNING_FPS) {
      this.optimizeAnimations();
    }
  }

  public getCurrentMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize / (performance as any).memory?.jsHeapSizeLimit || 0,
      isOptimal: this.fps >= this.OPTIMAL_FPS,
    };
  }

  public getAverageMetrics(): PerformanceMetrics {
    if (this.metricsHistory.length === 0) {
      return this.getCurrentMetrics();
    }

    const sum = this.metricsHistory.reduce(
      (acc, metrics) => ({
        fps: acc.fps + metrics.fps,
        frameTime: acc.frameTime + metrics.frameTime,
        memoryUsage: acc.memoryUsage + metrics.memoryUsage,
        isOptimal: acc.isOptimal && metrics.isOptimal,
      }),
      { fps: 0, frameTime: 0, memoryUsage: 0, isOptimal: true }
    );

    const count = this.metricsHistory.length;
    return {
      fps: Math.round(sum.fps / count),
      frameTime: Math.round(sum.frameTime / count * 100) / 100,
      memoryUsage: Math.round(sum.memoryUsage / count * 100) / 100,
      isOptimal: sum.isOptimal,
    };
  }

  public getPerformanceLevel(): 'optimal' | 'warning' | 'critical' {
    if (this.fps >= this.OPTIMAL_FPS) return 'optimal';
    if (this.fps >= this.WARNING_FPS) return 'warning';
    return 'critical';
  }

  private optimizeAnimations() {
    // Отправляем событие для оптимизации анимаций
    window.dispatchEvent(new CustomEvent('optimizeAnimations', {
      detail: {
        level: this.getPerformanceLevel(),
        fps: this.fps,
      }
    }));

    console.warn(`Производительность анимаций снижена: ${this.fps} FPS. Применяем оптимизации.`);
  }

  public shouldReduceAnimations(): boolean {
    return this.fps < this.WARNING_FPS;
  }

  public shouldDisableAnimations(): boolean {
    return this.fps < this.CRITICAL_FPS;
  }

  // Методы для отладки и мониторинга
  public logMetrics() {
    const metrics = this.getCurrentMetrics();
    console.log('Метрики производительности анимаций:', metrics);
  }

  public exportMetrics(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }
}

// Глобальный экземпляр мониторинга
export const animationPerformanceMonitor = new AnimationPerformanceMonitor();

// Хук для использования мониторинга в компонентах
export function useAnimationPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() =>
    animationPerformanceMonitor.getCurrentMetrics()
  );

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(animationPerformanceMonitor.getCurrentMetrics());
    };

    // Обновляем метрики каждые 2 секунды
    const interval = setInterval(updateMetrics, 2000);

    // Слушаем события оптимизации
    const handleOptimize = (event: CustomEvent) => {
      console.log('Событие оптимизации анимаций:', event.detail);
      updateMetrics();
    };

    window.addEventListener('optimizeAnimations', handleOptimize as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('optimizeAnimations', handleOptimize as EventListener);
    };
  }, []);

  return {
    metrics,
    performanceLevel: animationPerformanceMonitor.getPerformanceLevel(),
    shouldReduceAnimations: animationPerformanceMonitor.shouldReduceAnimations(),
    shouldDisableAnimations: animationPerformanceMonitor.shouldDisableAnimations(),
  };
}