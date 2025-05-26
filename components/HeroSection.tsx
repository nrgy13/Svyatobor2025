"use client";

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import Image from 'next/image';

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section 
      id="главная" 
      ref={ref}
      className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-black overflow-hidden">
        <div 
          className="absolute inset-0 bg-center bg-cover"
          style={{ 
            backgroundImage: "url('/images/hero-bg.jpg')",
            filter: "brightness(0.7)",
            transition: "transform 0.5s ease-out",
            transform: isLoaded ? "scale(1)" : "scale(1.1)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column - Logo and Tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-6">
              <Image 
                src="/images/logo.png"
                alt="Логотип Святобор"
                width={320}
                height={320}
                className="rounded-full object-cover"
              />
            </div>
            <h2 className="text-warm-beige text-2xl md:text-3xl font-correiria mb-4 text-center">
              Хранитель лесов — на вашей стороне
            </h2>
          </motion.div>

          {/* Right Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-correiria mb-6 text-shadow">
              Быстрая расчистка участков от деревьев, кустов и травы
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-warm-beige/90">
              Наводим порядок на земле —<br />
              убираем лишнее, сохраняя ценное
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-forest-green hover:bg-moss-green text-white border-2 border-transparent text-lg font-medium transition-all duration-300 rounded-lg px-8 py-6"
                onClick={() => document.getElementById('контакты')?.scrollIntoView({behavior: 'smooth'})}
              >
                Оставить заявку
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-white bg-white text-black hover:text-[#00FF00] hover:bg-transparent text-lg font-medium transition-all duration-300 rounded-lg px-8 py-6 flex items-center gap-2"
                onClick={() => window.open('https://wa.me/79952209432', '_blank')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                Написать в WhatsApp
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center md:opacity-100 opacity-0 transition-opacity duration-300">
        <span className="text-white mb-2">Прокрутите вниз</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </motion.div>
      </div>
    </section>
  );
}