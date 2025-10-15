"use client";

import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { ThumbsDown, Bug } from 'lucide-react';
import Image from 'next/image';
import { IMAGES } from '@/lib/constants';

const problems = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    title: "Пожарная опасность",
    description: "Сухая трава и ветки становятся легковоспламеняющимся материалом, представляя угрозу для вашего имущества."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Штрафы за заброшенность",
    description: "Неухоженные участки попадают под административную ответственность с регулярными штрафами."
  },
  {
    icon: <Bug className="h-8 w-8 text-green-700" />,
    title: "Распространение вредителей",
    description: "Неконтролируемые растения привлекают насекомых-вредителей и грызунов, которые могут повредить будущие постройки."
  },
  {
    icon: <ThumbsDown className="h-8 w-8 text-yellow-600" />,
    title: "Снижение привлекательности и стоимости участка",
    description: "Заросшая территория с пнями и сухостоем создаёт запущенное впечатление, отпугивает потенциальных покупателей и снижает рыночную цену будущей недвижимости."
  }
];

export default function ProblemsSection() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section id="проблемы" className="py-20 bg-warm-beige relative overflow-hidden" ref={ref}>      
      <div className="container mx-auto px-4">
        <h2 className="section-heading">Проблемные вопросы</h2>
        <p className="section-subheading">
          Заросший участок создаёт множество проблем, которые важно решить своевременно
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left - Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8 }}
            className="relative rounded-lg overflow-hidden shadow-xl h-[400px] md:h-[500px]"
          >
            <Image 
              src={IMAGES.PROBLEM_IMAGE}
              alt="Заросший участок" 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-black/20"></div>
          </motion.div>

          {/* Right - Problem Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid grid-cols-1 gap-6"
          >
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="forest-card flex items-start p-6 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="mr-4 mt-1">{problem.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-wood-brown mb-2">{problem.title}</h3>
                  <p className="text-gray-700">{problem.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}