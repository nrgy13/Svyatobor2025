"use client";

import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ContactFormData, submitContactForm } from '@/lib/supabase';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Имя должно содержать не менее 2 символов"
  }),
  phone: z.string().min(10, {
    message: "Введите корректный номер телефона"
  }),
  preferredTime: z.string().optional(),
});

export default function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      preferredTime: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await submitContactForm(data as ContactFormData);
      toast.success("Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.");
      reset();
    } catch (error) {
      toast.error("Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="контакты" className="py-20 bg-warm-beige relative" ref={ref}>
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="section-heading">Свяжитесь с нами</h2>
        <p className="section-subheading">
          Оставьте заявку, и мы перезвоним вам для консультации или расчета стоимости работ
        </p>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* Left - Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-lg shadow-lg relative"
            >
              <div className="ornament-vertical ornament-left"></div>
              <h3 className="text-2xl font-correiria text-forest-green mb-6">
                Оставить заявку
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Ваше имя</Label>
                  <Input
                    id="name"
                    placeholder="Иван Иванов"
                    {...register("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Номер телефона</Label>
                  <Input
                    id="phone"
                    placeholder="+7 (XXX) XXX-XX-XX"
                    {...register("phone")}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Удобное время для звонка (необязательно)</Label>
                  <Input
                    id="preferredTime"
                    placeholder="Например: с 10:00 до 18:00"
                    {...register("preferredTime")}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-forest-green hover:bg-moss-green text-white py-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Отправка..." : "Перезвоните мне"}
                </Button>
              </form>

              <div className="mt-6 text-sm text-gray-500">
                Нажимая на кнопку, вы соглашаетесь с нашей политикой конфиденциальности и даете согласие на обработку персональных данных.
              </div>
            </motion.div>

            {/* Right - Contact Info and Bonus */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col space-y-8"
            >
              {/* Contact Info */}
              <div className="bg-white p-8 rounded-lg shadow-lg relative">
                <h3 className="text-2xl font-correiria text-forest-green mb-6">
                  Контактная информация
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-forest-green/10 p-3 rounded-full mr-4 text-forest-green">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Телефон:</p>
                      <a href="tel:+79952209432" className="text-forest-green hover:underline">
                        +7 (995) 220-94-32
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-forest-green/10 p-3 rounded-full mr-4 text-forest-green">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Email:</p>
                      <a href="mailto:берест@святобор.online" className="text-forest-green hover:underline">
                        берест@святобор.online
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-forest-green/10 p-3 rounded-full mr-4 text-forest-green">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Адрес:</p>
                      <p>Новороссийск и Краснодарский край</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-forest-green/10 p-3 rounded-full mr-4 text-forest-green">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Время работы:</p>
                      <p>Пн-Пт: 8:00 - 20:00</p>
                      <p>Сб-Вс: 9:00 - 18:00</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <a 
                    href="https://wa.me/79952209432" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-forest-green text-white p-3 rounded-full hover:bg-moss-green transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  </a>
                  <a 
                    href="tel:+79952209432"
                    className="bg-forest-green text-white p-3 rounded-full hover:bg-moss-green transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Bonus Offer */}
              <div className="bg-forest-green p-8 rounded-lg shadow-lg text-white relative">
                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <h3 className="text-2xl font-correiria">Специальное предложение</h3>
                </div>
                <p className="text-xl mb-4">
                  Скидка 20% на покос травы при заказе через сайт!
                </p>
                <p className="text-sm">
                  Акция действует при оформлении заявки онлайн. Скидка распространяется на первый заказ услуги покоса травы.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
