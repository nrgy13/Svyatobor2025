"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Простая задержка без сложных анимаций
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Уменьшил время до 1.5 секунд

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }} // Упростил анимацию
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest-green/90 backdrop-blur-sm"
        >
          <div className="text-center">
            {/* Простая пульсирующая точка вместо сложной анимации */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-4 h-4 bg-warm-beige rounded-full mx-auto mb-4"
            />

            {/* Минималистичный текст */}
            <p className="text-warm-beige text-sm font-medium">
              Загрузка...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}