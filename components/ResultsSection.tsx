"use client";

import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { IMAGES } from '@/lib/constants';

export default function ResultsSection() {
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section id="результаты" className="relative h-[500px] md:h-[600px] overflow-hidden" ref={ref}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-center bg-cover"
          style={{ 
            backgroundImage: `url('${IMAGES.RESULT_BG}')`,
            filter: "brightness(0.7)",
          }}
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 h-full flex items-center justify-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl p-8 rounded-lg bg-black/40 backdrop-blur-sm"
        >
          <h2 className="text-4xl md:text-5xl font-correiria text-white mb-6">
            Расчистка участка и сдача работ
          </h2>
          <p className="text-xl md:text-2xl text-warm-beige mb-8">
            Мы полностью удаляем весь растительный мусор и сдаем участок, готовый для дальнейших работ.<br />
            Ваш участок преобразится, станет безопасным и готовым к новой жизни.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-forest-green hover:bg-moss-green text-white border-2 border-transparent text-lg font-medium transition-all duration-300 rounded-lg"
              onClick={() => document.getElementById('контакты')?.scrollIntoView({behavior: 'smooth'})}
            >
              Получить консультацию
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-white bg-white text-black hover:text-[#00FF00] hover:bg-transparent text-lg font-medium transition-all duration-300 rounded-lg"
              onClick={() => window.open('tel:+79250000033', '_blank')}
            >
              Позвонить сейчас
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Before/After Comparison Effect */}
      <div className="absolute top-0 left-0 bottom-0 w-1/5 bg-gradient-to-r from-black/40 to-transparent"></div>
      <div className="absolute top-0 right-0 bottom-0 w-1/5 bg-gradient-to-l from-black/40 to-transparent"></div>
    </section>
  );
}