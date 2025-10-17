import { AnimationResource } from '@/hooks/use-animation-preloader';

export const ANIMATION_RESOURCES: AnimationResource[] = [
  // Высокий приоритет - критически важные изображения для анимаций
  {
    id: 'hero-bg',
    type: 'image',
    src: '/images/hero-bg.jpg',
    priority: 'high',
    preload: true,
  },
  {
    id: 'logo',
    type: 'image',
    src: '/images/logo.png',
    priority: 'high',
    preload: true,
  },
  {
    id: 'logo-circle',
    type: 'image',
    src: '/images/logo-circle.png',
    priority: 'high',
    preload: true,
  },
  {
    id: 'element',
    type: 'image',
    src: '/images/element.png',
    priority: 'high',
    preload: true,
  },

  // Средний приоритет - изображения для секций
  {
    id: 'advantages-image',
    type: 'image',
    src: '/images/advantages-image.jpg',
    priority: 'medium',
    preload: true,
  },
  {
    id: 'problem-image',
    type: 'image',
    src: '/images/problem-image.jpg',
    priority: 'medium',
    preload: true,
  },
  {
    id: 'result-bg',
    type: 'image',
    src: '/images/result-bg.jpg',
    priority: 'medium',
    preload: true,
  },

  // Средний приоритет - изображения клиентов и услуг
  {
    id: 'client-1',
    type: 'image',
    src: '/images/client-1.jpg',
    priority: 'medium',
    preload: false,
  },
  {
    id: 'client-2',
    type: 'image',
    src: '/images/client-2.jpg',
    priority: 'medium',
    preload: false,
  },
  {
    id: 'client-3',
    type: 'image',
    src: '/images/client-3.jpg',
    priority: 'medium',
    preload: false,
  },
  {
    id: 'service-construction',
    type: 'image',
    src: '/images/service-construction.jpg',
    priority: 'medium',
    preload: false,
  },
  {
    id: 'service-grass',
    type: 'image',
    src: '/images/service-grass.jpg',
    priority: 'medium',
    preload: false,
  },
  {
    id: 'service-removal',
    type: 'image',
    src: '/images/service-removal.jpg',
    priority: 'medium',
    preload: false,
  },
  {
    id: 'service-spraying',
    type: 'image',
    src: '/images/service-spraying.jpg',
    priority: 'medium',
    preload: false,
  },
  {
    id: 'service-trees',
    type: 'image',
    src: '/images/service-trees.jpg',
    priority: 'medium',
    preload: false,
  },

  // Декоративные элементы
  {
    id: 'floral-ornament',
    type: 'image',
    src: '/images/red-floral-ornament-white-background-embroidery.png',
    priority: 'low',
    preload: false,
  },

  // CSS анимации - предзагрузка критических стилей
  {
    id: 'framer-motion-styles',
    type: 'css',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/framer-motion/11.0.3/style.min.css',
    priority: 'high',
    preload: true,
  },

  // Шрифты для анимаций текста
  {
    id: 'font-montserrat',
    type: 'font',
    src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOYuT2tK8PQQ.woff2',
    priority: 'medium',
    preload: true,
  },
  {
    id: 'font-cormorant',
    type: 'font',
    src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjQrwOkbK-Ww.woff2',
    priority: 'medium',
    preload: true,
  },
];

// Функция для получения ресурсов по приоритету
export function getResourcesByPriority(priority: 'high' | 'medium' | 'low'): AnimationResource[] {
  return ANIMATION_RESOURCES.filter(resource => resource.priority === priority);
}

// Функция для получения ресурсов для предзагрузки
export function getPreloadResources(): AnimationResource[] {
  return ANIMATION_RESOURCES.filter(resource => resource.preload === true);
}

// Функция для получения всех ресурсов
export function getAllAnimationResources(): AnimationResource[] {
  return ANIMATION_RESOURCES;
}

// Конфигурация для разных сценариев загрузки
export const PRELOAD_CONFIGS = {
  // Минимальная предзагрузка для быстрого отображения
  minimal: getResourcesByPriority('high'),

  // Стандартная предзагрузка
  standard: getPreloadResources(),

  // Полная предзагрузка всех ресурсов
  full: getAllAnimationResources(),

  // Предзагрузка только критически важных ресурсов для мобильных устройств
  mobile: getResourcesByPriority('high').slice(0, 5),
};