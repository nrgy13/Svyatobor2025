"use client";

import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { Tractor, RussianRuble } from 'lucide-react';
import Image from 'next/image';

const advantages = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Бесплатный выезд на участок",
    description: "Оценим объем работы и рассчитаем стоимость без дополнительных затрат с вашей стороны."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Быстрое выполнение работ",
    description: "Выполним все необходимые работы от 1 дня в зависимости от сложности и объема."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Опыт более 5 лет",
    description: "Наша команда успешно выполнила сотни проектов различной сложности."
  },
  {
    icon: <Tractor className="h-10 w-10" />,
    title: "Собственная техника",
    description: "Используем профессиональное оборудование, которое позволяет выполнять работы любой сложности."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: "Экологичный подход",
    description: "Соблюдаем все экологические нормы при выполнении работ и утилизации растительных остатков."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Договор и гарантия на работы",
    description: "Официальное оформление всех отношений с клиентами и гарантия на выполненные работы."
  },
  {
    icon: <RussianRuble className="h-10 w-10" />,
    title: "Доступные цены",
    description: "Оптимальное соотношение цены и качества. Индивидуальный подход к каждому клиенту."
  }
];

export default function AdvantagesSection() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="преимущества" className="py-20 bg-white" ref={ref}>
      <div className="container mx-auto px-4">
        <h2 className="section-heading">Наши преимущества</h2>
        <p className="section-subheading">
          Почему клиенты выбирают именно нас для расчистки и благоустройства своих участков
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left - Advantages */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid grid-cols-1 gap-6"
          >
            {advantages.slice(0, 4).map((advantage, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-start bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="mr-4 text-forest-green flex-shrink-0">
                  {advantage.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-wood-brown mb-2">{advantage.title}</h3>
                  <p className="text-gray-700">{advantage.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right - Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8 }}
            className="relative rounded-lg overflow-hidden shadow-xl h-[500px]"
          >
            <Image 
              src="https://ytbtznozmjlifztitlas.supabase.co/storage/v1/object/sign/svyatobor/advantages-image.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzYzZmI0NGNiLWJmYjktNGRjYi05ZDJjLTg3OWY1OTdlMzE2MyJ9.eyJ1cmwiOiJzdnlhdG9ib3IvYWR2YW50YWdlcy1pbWFnZS5qcGciLCJpYXQiOjE3NDY3MTA0MTMsImV4cCI6MTc3ODI0NjQxM30.TK2iqWfjf0K0l4hEC_MgVPEhjn-ANOWutA8udEnTyDo" 
              alt="Наши преимущества" 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-forest-green/10"></div>
          </motion.div>

          {/* Additional Advantages (Below) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 mt-10"
          >
            {advantages.slice(4).map((advantage, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex flex-col items-center text-center bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="mb-4 text-forest-green bg-light-moss/20 p-4 rounded-full">
                  {advantage.icon}
                </div>
                <h3 className="text-xl font-semibold text-wood-brown mb-2">{advantage.title}</h3>
                <p className="text-gray-700">{advantage.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}