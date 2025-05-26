"use client";

import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { IMAGES } from '@/lib/constants';

const reviews = [
  {
    name: "Николай Петрович",
    age: 52,
    location: "Новороссийск",
    text: "Обратился в компанию для расчистки участка под строительство дома. Территория была сильно заросшей, множество кустарников и несколько больших деревьев. Бригада справилась за два дня, очень качественно. Впечатлила слаженность в работе и профессиональный подход. Рекомендую!",
    avatar: IMAGES.CLIENT_1,
  },
  {
    name: "Марина Васильевна",
    age: 38,
    location: "п. Гайдук",
    text: "Долго не могла найти специалистов для расчистки дачного участка. Нашла Святобор через знакомых, и очень довольна результатом. Приехали в оговоренное время, убрали всю поросль и сухостой, обработали участок от вредителей. Сделали всё аккуратно, без повреждения забора и соседних насаждений.",
    avatar: IMAGES.CLIENT_2,
  },
  {
    name: "Игорь Александрович",
    age: 44,
    location: "п. Абрау-Дюрсо",
    text: "Заказывал комплексную расчистку запущенного участка. Работали быстро и качественно, вывезли весь мусор. Отдельное спасибо за рекомендации по дальнейшему уходу за участком. После работы специалистов участок просто не узнать! Теперь буду обращаться к ним регулярно для поддержания порядка.",
    avatar: IMAGES.CLIENT_3,
  },
  {
    name: "Елена Сергеевна",
    age: 41,
    location: "Новороссийск",
    text: "Обратилась для расчистки участка от травы и мелких кустарников. Всё сделали за один день, цена полностью соответствовала изначальной договоренности, без дополнительных платежей. Понравилась прозрачность в работе и внимание к деталям. В следующем сезоне обязательно обращусь снова.",
    avatar: IMAGES.CLIENT_1,
  },
];

export default function ReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const handlePrev = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <section id="отзывы" className="py-20 bg-white relative" ref={ref}>      
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="section-heading">Отзывы клиентов</h2>
        <p className="section-subheading">
          Что говорят о нас те, кто уже воспользовался нашими услугами
        </p>

        <div className="max-w-4xl mx-auto">
          {/* Desktop Reviews */}
          <div className="hidden md:block relative">
            <div className="grid grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="forest-card h-full flex flex-col relative"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden mr-4 relative">
                      <Image 
                        src={review.avatar} 
                        alt={review.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-wood-brown">{review.name}</h3>
                      <p className="text-sm text-gray-500">{review.age} лет, {review.location}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700">{review.text}</p>
                  </div>
                  <div className="mt-4 flex justify-between text-forest-green">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">1 месяц назад</span>
                  </div>
                  <div className="ornament-vertical ornament-right"></div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile Reviews Carousel */}
          <div className="md:hidden relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {reviews.map((review, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-2">
                    <div className="forest-card h-full flex flex-col relative">
                      <div className="flex items-center mb-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden mr-4 relative">
                          <Image 
                            src={review.avatar} 
                            alt={review.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-wood-brown">{review.name}</h3>
                          <p className="text-sm text-gray-500">{review.age} лет, {review.location}</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700">{review.text}</p>
                      </div>
                      <div className="mt-4 flex justify-between text-forest-green">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <div className="ornament-vertical ornament-right"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md text-forest-green z-10"
              onClick={handlePrev}
              aria-label="Предыдущий отзыв"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md text-forest-green z-10"
              onClick={handleNext}
              aria-label="Следующий отзыв"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    activeIndex === index 
                      ? "bg-forest-green w-6" 
                      : "bg-gray-300 hover:bg-gray-400"
                  )}
                  aria-label={`Перейти к отзыву ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Add Review CTA */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-correiria text-forest-green mb-4">
              Стали нашим клиентом?
            </h3>
            <p className="text-gray-700 mb-6">
              Мы будем благодарны за ваш отзыв о нашей работе
            </p>
            <button 
              className="inline-flex items-center justify-center px-6 py-3 border border-forest-green text-forest-green font-medium rounded-lg hover:bg-forest-green hover:text-white transition-colors duration-300"
              onClick={() => window.open('https://wa.me/79952209432?text=Здравствуйте!%20Я%20хочу%20оставить%20отзыв%20о%20вашей%20работе.', '_blank')}
            >
              Оставить отзыв
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}