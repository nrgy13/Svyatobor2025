"use client";

import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

const processSteps = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: "Подача заявки на сайте или в WhatsApp",
    description: "Оставьте заявку через форму на сайте или напишите нам в WhatsApp. Опишите, что необходимо сделать на вашем участке."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: "Осмотр участка или анализ фотографий",
    description: "Наш специалист выезжает на осмотр участка или анализирует присланные вами фотографии для оценки объема работ."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Расчет стоимости и согласование",
    description: "На основе полученных данных наш менеджер рассчитывает стоимость работ и согласовывает с вами все детали."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Подписание договора",
    description: "Заключаем официальный договор с подробным описанием всех работ, сроков выполнения и гарантийных обязательств."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    ),
    title: "Выполнение работ по расчистке",
    description: "Бригада специалистов приступает к работе согласно установленному графику. Мы используем профессиональное оборудование и современные технологии."
  }
];

export default function ProcessSection() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section id="процесс" className="py-20 bg-warm-beige relative" ref={ref}>      
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="section-heading">Как мы работаем</h2>
        <p className="section-subheading">
          Прозрачный процесс работы от заявки до сдачи готового участка
        </p>

        <div className="relative">
          {/* Timeline Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-forest-green/30 transform -translate-x-1/2"></div>

          {/* Process Steps */}
          <div className="space-y-12 md:space-y-0">
            {processSteps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className={`md:flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Timeline Circle */}
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-forest-green text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <div className={`flex items-center mb-4 ${index % 2 === 0 ? 'justify-end' : ''}`}>
                        <div className="md:hidden flex-shrink-0 w-10 h-10 rounded-full bg-forest-green text-white flex items-center justify-center font-bold mr-4">
                          {index + 1}
                        </div>
                        <h3 className="text-xl font-semibold text-wood-brown">{step.title}</h3>
                      </div>
                      <p className="text-gray-700">{step.description}</p>
                    </div>
                  </div>

                  {/* Icon (visible on larger screens) */}
                  <div className={`hidden md:block w-1/2 ${index % 2 === 0 ? 'md:pl-16' : 'md:pr-16 md:text-right'}`}>
                    <div className={`inline-flex p-4 rounded-full bg-light-moss/20 text-forest-green ${index % 2 === 1 ? 'ml-auto' : ''}`}>
                      {step.icon}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
