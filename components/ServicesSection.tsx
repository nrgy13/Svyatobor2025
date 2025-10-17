"use client";

import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Trees, Scissors, SprayCan } from 'lucide-react';
import Image from 'next/image';
import { IMAGES } from '@/lib/constants';
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/use-scroll-animation';

const services = [
  {
    title: "Удаление деревьев и кустарников",
    description: "Профессиональное удаление деревьев и кустарников любой сложности с использованием специального оборудования.",
    image: IMAGES.SERVICE_TREES,
    icon: <Trees className="h-8 w-8" />
  },
  {
    title: "Покос травы",
    description: "Покос травы и борьба с сорняками на участках любой площади с помощью современной техники.",
    image: IMAGES.SERVICE_GRASS,
    icon: <Scissors className="h-8 w-8" />
  },
  {
    title: "Обработка растений от вредителей",
    description: "Профессиональная обработка участка от вредителей и болезней растений с гарантией эффективности.",
    image: IMAGES.SERVICE_SPRAYING,
    icon: <SprayCan className="h-8 w-8" />
  },
  {
    title: "Вывоз и утилизация растительных остатков",
    description: "Полный цикл очистки участка с вывозом и экологичной утилизацией всех растительных остатков.",
    image: IMAGES.SERVICE_REMOVAL,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  },
  {
    title: "Подготовка участка под строительство",
    description: "Комплексная подготовка земельного участка перед началом строительных работ с планировкой территории.",
    image: IMAGES.SERVICE_CONSTRUCTION,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  }
];

export default function ServicesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % services.length);
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [inView]);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % services.length);
      }, 5000);
    }
  };

  return (
    <section id="услуги" className="py-20 bg-light-brown/10" ref={ref}>
      <div className="container mx-auto px-4">
        <h2 className="section-heading">Наши услуги</h2>
        <p className="section-subheading">
          Комплексный подход к расчистке и благоустройству вашего участка от профессионалов своего дела
        </p>

        <div className="relative">
          <div className="overflow-hidden rounded-xl shadow-xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out" 
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {services.map((service, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative h-[400px] md:h-[500px]">
                      <Image 
                        src={service.image} 
                        alt={service.title} 
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-black/30"></div>
                    </div>

                    <div className="bg-white p-8 md:p-12 flex flex-col justify-center h-[400px] md:h-[500px]">
                      <div className="bg-forest-green/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6 text-forest-green">
                        {service.icon}
                      </div>
                      <h3 className="text-2xl md:text-3xl font-correiria text-forest-green mb-4">
                        {service.title}
                      </h3>
                      <p className="text-gray-700 mb-6">
                        {service.description}
                      </p>
                      <button 
                        onClick={() => document.getElementById('контакты')?.scrollIntoView({behavior: 'smooth'})}
                        className="text-forest-green font-medium flex items-center hover:text-moss-green transition-colors"
                      >
                        Заказать услугу
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => handleDotClick((activeIndex - 1 + services.length) % services.length)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-forest-green z-10 transition-all duration-300"
            aria-label="Предыдущая услуга"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={() => handleDotClick((activeIndex + 1) % services.length)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-forest-green z-10 transition-all duration-300"
            aria-label="Следующая услуга"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex justify-center mt-6 space-x-2">
            {services.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  activeIndex === index 
                    ? "bg-forest-green w-6" 
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Перейти к услуге ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}